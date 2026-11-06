import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { CM2000, ESP32 } from '../types/esp32.constants';
import type {
  AntennaPowers,
  EpcWriteOptions,
  InventoryOptions,
  TagReading,
  TagRecord,
  TemperatureReading,
} from '../types/esp32.types';
import { SerialService } from './serial.service';

@Injectable()
export class Cm2000Service implements OnModuleDestroy {
  // Events: tag, round, running, stopped, diagnostic, operationError,
  // powerValues, powerApplied, temperatureValue, temperatureError,
  // temperatureAlert, writeProgress, writeSuccess, writeUnchanged, writeError.
  readonly events = new EventEmitter();
  private readonly responses = new EventEmitter();
  private buffer: Buffer = Buffer.alloc(0);
  private invalidFrames = 0;
  private unsafe = false;
  private operations: Promise<unknown> = Promise.resolve();
  private pendingOperations = 0;
  private inventoryTask: Promise<void> | null = null;
  private stopRequested = false;
  private pause: AbortController | null = null;
  private antenna = 1;
  private powers: AntennaPowers | null = null;
  private records = new Map<string, TagRecord>();
  private instants: number[] = [];
  private total = 0;
  private rounds = 0;
  private history: TemperatureReading[] = [];
  private threshold: number | null = null;
  private temperatureAlert = false;
  private temperatureTimer: ReturnType<typeof setTimeout> | null = null;
  private temperatureGeneration = 0;
  private destroyed = false;
  private connectionGeneration = 0;

  private readonly onData = (data: Buffer) => this.decode(data);
  private readonly onConnected = () => {
    this.connectionGeneration++;
    this.buffer = Buffer.alloc(0);
    this.unsafe = false;
    this.powers = null;
  };
  private readonly onDisconnected = () => {
    this.connectionGeneration++;
    this.unsafe = true;
    this.stopRequested = true;
    this.pause?.abort();
    this.stopTemperatureMonitoring();
    this.responses.emit('failure', new Error('Conexión serial perdida.'));
  };

  constructor(private readonly serial: SerialService) {
    serial.events.on('rfid', this.onData);
    serial.events.on('connected', this.onConnected);
    serial.events.on('disconnected', this.onDisconnected);
    serial.events.on('transportError', this.onDisconnected);
  }

  async onModuleDestroy(): Promise<void> {
    this.destroyed = true;
    this.stopTemperatureMonitoring();
    this.onDisconnected();
    await this.stopInventory();
    await this.operations;
    this.serial.events.off('rfid', this.onData);
    this.serial.events.off('connected', this.onConnected);
    this.serial.events.off('disconnected', this.onDisconnected);
    this.serial.events.off('transportError', this.onDisconnected);
  }

  get isInventoryRunning(): boolean {
    return this.inventoryTask !== null;
  }

  async selectAntenna(antenna: number): Promise<void> {
    this.validateAntenna(antenna);
    this.requireIdle();
    return this.exclusive(async () => {
      await this.confirm(CM2000.antenna, Buffer.from([antenna - 1]));
      this.antenna = antenna;
    });
  }

  startInventory(options: InventoryOptions = {}): void {
    this.requireIdle();
    const antenna = options.antenna ?? 1;
    const pauseMs = options.pauseMs ?? 150;
    this.validateAntenna(antenna);
    if (!Number.isInteger(pauseMs) || pauseMs < 0 || pauseMs > 5000) {
      throw new Error('La pausa debe estar entre 0 y 5000 ms.');
    }
    this.stopRequested = false;
    this.inventoryTask = (async () => {
      await this.exclusive(async () => {
        await this.confirm(CM2000.antenna, Buffer.from([antenna - 1]));
        this.antenna = antenna;
      });
      this.events.emit('running', true);
      while (!this.stopRequested) {
        // Se termina la ronda actual aun si se solicita detener el inventario.
        await this.exclusive(() => this.inventoryRound());
        if (this.stopRequested) break;
        this.pause = new AbortController();
        await delay(pauseMs, undefined, { signal: this.pause.signal }).catch(
          () => undefined,
        );
        this.pause = null;
      }
    })()
      .catch((error: Error) => {
        this.unsafe = true;
        this.events.emit('operationError', error.message);
      })
      .finally(() => {
        this.inventoryTask = null;
        this.events.emit('stopped');
      });
  }

  async stopInventory(): Promise<void> {
    this.stopRequested = true;
    this.pause?.abort();
    await this.inventoryTask;
  }

  async stopAllOperations(): Promise<void> {
    this.stopTemperatureMonitoring();
    await this.stopInventory();
    // Una consulta de temperatura ya enviada puede seguir esperando respuesta.
    await this.operations;
  }

  inventory(): Promise<TagReading[]> {
    this.requireIdle();
    return this.exclusive(() => this.inventoryRound());
  }

  getPower(): Promise<AntennaPowers> {
    this.requireIdle();
    return this.exclusive(() => this.readPower());
  }

  setPower(antenna: number, powerDbm: number): Promise<AntennaPowers> {
    this.validateAntenna(antenna);
    if (
      !Number.isInteger(powerDbm) ||
      powerDbm < CM2000.minPower ||
      powerDbm > CM2000.maxPower
    ) {
      throw new Error('La potencia debe estar entre 5 y 30 dBm.');
    }
    this.requireIdle();
    return this.exclusive(async () => {
      const current = await this.readPower();
      const expected: AntennaPowers = [...current];
      expected[antenna - 1] = powerDbm;
      if (current[antenna - 1] !== powerDbm) {
        await this.confirm(CM2000.setPower, Buffer.from(expected), 3000);
        await delay(200);
        const verified = await this.readPower();
        if (verified.some((value, index) => value !== expected[index])) {
          throw new Error(
            'La lectura posterior no confirma las potencias solicitadas.',
          );
        }
      }
      this.events.emit('powerApplied', { antenna, powerDbm });
      return expected;
    });
  }

  getFilter(): Promise<string | null> {
    this.requireIdle();
    return this.exclusive(() => this.readFilter());
  }

  setFilter(epc: string): Promise<void> {
    const normalized = this.validateHex(epc, 24, 'EPC');
    this.requireIdle();
    return this.exclusive(() => this.applyFilter(normalized));
  }

  clearFilter(): Promise<void> {
    this.requireIdle();
    return this.exclusive(() => this.removeFilter());
  }

  getTemperature(antenna = this.antenna): Promise<TemperatureReading> {
    this.validateAntenna(antenna);
    return this.exclusive(async () => {
      try {
        const frames = await this.send(CM2000.temperature);
        if (frames.length !== 1)
          throw new Error(
            'Sin respuesta única a 0x7B; compatibilidad no confirmada.',
          );
        const frame = frames[0];
        if (frame.length === 6) {
          throw new Error(
            `Consulta 0x7B rechazada: 0x${frame[4].toString(16)}; no es una temperatura.`,
          );
        }
        if (frame.length !== 7 || (frame[4] !== 0 && frame[4] !== 1)) {
          throw new Error('Formato o signo de temperatura no reconocido.');
        }
        const reading: TemperatureReading = {
          date: new Date(),
          celsius: frame[4] === 1 ? -frame[5] : frame[5],
          inventoryActive: this.isInventoryRunning,
          antenna,
          powerDbm: this.powers?.[antenna - 1] ?? null,
        };
        this.history.push(reading);
        this.evaluateTemperature(reading.celsius);
        this.events.emit('temperatureValue', {
          ...reading,
          date: new Date(reading.date),
        });
        return { ...reading, date: new Date(reading.date) };
      } catch (error) {
        this.stopTemperatureMonitoring();
        this.events.emit('temperatureError', (error as Error).message);
        throw error;
      } finally {
        if (this.buffer.length >= 4 && this.buffer[3] === CM2000.temperature)
          this.buffer = Buffer.alloc(0);
      }
    });
  }

  startTemperatureMonitoring(
    intervalSeconds = 5,
    antenna = this.antenna,
  ): void {
    this.validateAntenna(antenna);
    if (
      !Number.isFinite(intervalSeconds) ||
      intervalSeconds < 1 ||
      intervalSeconds * 1000 > 2_147_483_647
    ) {
      throw new Error(
        'El intervalo de temperatura debe ser de al menos un segundo.',
      );
    }
    if (this.destroyed) throw new Error('El servicio está detenido.');
    this.stopTemperatureMonitoring();
    const generation = this.temperatureGeneration;
    const measure = async () => {
      if (generation !== this.temperatureGeneration) return;
      if (
        this.pendingOperations === 0 ||
        (this.isInventoryRunning && !this.stopRequested)
      ) {
        try {
          await this.getTemperature(antenna);
        } catch {
          return;
        }
      }
      if (generation === this.temperatureGeneration) {
        this.temperatureTimer = setTimeout(() => {
          void measure();
        }, intervalSeconds * 1000);
      }
    };
    void measure();
  }

  stopTemperatureMonitoring(): void {
    this.temperatureGeneration++;
    if (this.temperatureTimer) clearTimeout(this.temperatureTimer);
    this.temperatureTimer = null;
  }

  setTemperatureThreshold(celsius: number | null): void {
    if (celsius !== null && !Number.isFinite(celsius))
      throw new Error('Umbral de temperatura inválido.');
    this.threshold = celsius;
    this.evaluateTemperature(this.history.at(-1)?.celsius ?? null);
  }

  getTemperatureHistory(): TemperatureReading[] {
    return this.history.map((reading) => ({
      ...reading,
      date: new Date(reading.date),
    }));
  }

  getRecords(): TagRecord[] {
    return [...this.records.values()]
      .sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime())
      .map((record) => ({
        ...record,
        firstSeen: new Date(record.firstSeen),
        lastSeen: new Date(record.lastSeen),
      }));
  }

  getStatistics() {
    const cutoff = performance.now() - 5000;
    this.instants = this.instants.filter((instant) => instant >= cutoff);
    return {
      unique: this.records.size,
      total: this.total,
      rounds: this.rounds,
      readsPerSecond: this.instants.length / 5,
    };
  }

  clearReadings(): void {
    this.records.clear();
    this.instants = [];
    this.total = 0;
    this.rounds = 0;
  }

  exportReadingsCsv(): string {
    const rows = this.getRecords().map((r) =>
      [
        r.epc,
        r.count,
        r.antenna,
        r.rssiRaw,
        `0x${r.rssiRaw.toString(16).padStart(2, '0').toUpperCase()}`,
        r.firstSeen.toISOString(),
        r.lastSeen.toISOString(),
      ].join(','),
    );
    return (
      '\uFEFFEPC,Count,Antena,RSSI_bruto,RSSI_hex,Primera_lectura,Ultima_lectura\r\n' +
      rows.join('\r\n')
    );
  }

  exportTemperatureCsv(): string {
    const rows = this.history.map((r) =>
      [
        r.date.toISOString(),
        r.celsius,
        r.inventoryActive ? 'activo' : 'detenido',
        r.antenna,
        r.powerDbm ?? '',
      ].join(','),
    );
    return (
      '\uFEFFFecha_hora,Temperatura_interna_C,Inventario,Antena,Potencia_dBm_ultima_consultada\r\n' +
      rows.join('\r\n')
    );
  }

  async writeEpc(options: EpcWriteOptions): Promise<TagReading> {
    let current = this.validateHex(options.currentEpc, 24, 'EPC actual');
    const next = this.validateHex(options.newEpc, 24, 'Nuevo EPC');
    const password = Buffer.from(
      this.validateHex(options.password ?? '00000000', 8, 'Access Password'),
      'hex',
    );
    this.validateAntenna(options.antenna);
    // Detener espera el resumen de la última ronda; nunca interrumpirla para escribir.
    try {
      await this.stopInventory();
      return await this.exclusive(async () => {
        const changes: number[] = [];
        for (let i = 0; i < 6; i++)
          if (current.slice(i * 4, i * 4 + 4) !== next.slice(i * 4, i * 4 + 4))
            changes.push(i);
        let lastVerified: string | null = null;
        let attempts = 0;
        let word: number | null = null;
        let result: TagReading | undefined;
        let failure: Error | null = null;
        try {
          await this.confirm(
            CM2000.antenna,
            Buffer.from([options.antenna - 1]),
          );
          this.antenna = options.antenna;
          await this.removeFilter();
          await this.verifyUnique(current);
          lastVerified = current;
          this.events.emit('writeProgress', {
            completed: 0,
            total: changes.length,
            epc: current,
          });
          for (const [index, position] of changes.entries()) {
            word = position + 2;
            await this.verifyUnique(current);
            await this.applyFilter(current);
            const replacement = next.slice(position * 4, position * 4 + 4);
            const expected =
              current.slice(0, position * 4) +
              replacement +
              current.slice(position * 4 + 4);
            attempts++;
            let statuses: Array<number | null> = [];
            try {
              // Exactamente UN intento: contraseña + banco EPC + Word + cantidad + dato.
              const frames = await this.send(
                CM2000.write,
                Buffer.concat([
                  password,
                  Buffer.from([1, word, 1]),
                  Buffer.from(replacement, 'hex'),
                ]),
              );
              statuses = frames.map((frame) => this.writeStatus(frame));
            } catch {
              // Aun sin ACK, verificar el estado real sin repetir la escritura.
              this.events.emit(
                'diagnostic',
                'Respuesta 0x82 fallida/ambigua; verificando por inventario, sin reintentos.',
              );
            }
            await this.removeFilter();
            const found = await this.inventoryRound();
            if (found.length === 1) lastVerified = found[0].epc;
            const rejected = statuses.find(
              (status) => status !== null && status !== 0x10,
            );
            if (rejected !== undefined) {
              const descriptions = {
                0x33: 'error de escritura',
                0x40: 'error de acceso/contraseña',
                0x36: 'etiqueta no encontrada',
                0x37: 'acceso fallido',
              };
              throw new Error(
                `Escritura rechazada: 0x${rejected!.toString(16)} (${descriptions[rejected!] ?? 'estado desconocido'}).`,
              );
            }
            if (found.length !== 1 || found[0].epc !== expected)
              throw new Error(
                `Inventario posterior no confirma EPC intermedio ${expected}.`,
              );
            if (statuses.length !== 1 || statuses[0] !== 0x10) {
              this.events.emit(
                'diagnostic',
                'Respuesta 0x82 ambigua/timeout; modificación confirmada por inventario, sin reintentos.',
              );
            }
            current = expected;
            this.events.emit('writeProgress', {
              completed: index + 1,
              total: changes.length,
              word,
              epc: current,
            });
          }
          result = await this.verifyUnique(next);
          lastVerified = next;
        } catch (error) {
          failure = new Error(
            `${word === null ? 'Preparación' : `Word ${word}`}: ${(error as Error).message} Último EPC verificado: ${lastVerified ?? 'ninguno'}.${attempts ? ' La etiqueta podría estar parcialmente modificada. No se reintentó la escritura.' : ''}`,
          );
        } finally {
          try {
            await this.removeFilter();
          } catch {
            failure = new Error(
              `${failure?.message ?? ''} Limpieza final del filtro no confirmada. Último EPC verificado: ${lastVerified ?? 'ninguno'}.`,
            );
          }
        }
        if (failure) {
          this.events.emit('writeError', failure.message);
          throw failure;
        }
        this.events.emit(changes.length ? 'writeSuccess' : 'writeUnchanged', {
          originalEpc: options.currentEpc.toUpperCase(),
          reading: result,
        });
        return result!;
      });
    } finally {
      password.fill(0);
    }
  }

  private exclusive<T>(operation: () => Promise<T>): Promise<T> {
    this.pendingOperations++;
    const generation = this.connectionGeneration;
    const pending = this.operations.then(async () => {
      if (
        this.destroyed ||
        generation !== this.connectionGeneration ||
        !this.serial.isConnected ||
        this.unsafe
      ) {
        throw new Error(
          'Conexión RFID no disponible o ronda insegura; reconectá el puerto.',
        );
      }
      return operation();
    });
    this.operations = pending
      .catch(() => undefined)
      .finally(() => {
        this.pendingOperations--;
      });
    return pending;
  }

  private requireIdle(): void {
    if (this.isInventoryRunning)
      throw new Error('Detené el inventario antes de esta operación.');
  }

  private validateAntenna(antenna: number): void {
    if (!Number.isInteger(antenna) || antenna < 1 || antenna > 4)
      throw new Error('La antena debe estar entre 1 y 4.');
  }

  private validateHex(value: string, length: number, name: string): string {
    if (!new RegExp(`^[0-9a-fA-F]{${length}}$`).test(value))
      throw new Error(
        `${name}: se requieren ${length} caracteres hexadecimales.`,
      );
    return value.toUpperCase();
  }

  private async readPower(): Promise<AntennaPowers> {
    const frames = await this.send(CM2000.readPower);
    const frame = frames[0];
    let values: AntennaPowers;
    if (frames.length === 1 && frame.length === 6 && frame[4] <= 33) {
      values = [frame[4], frame[4], frame[4], frame[4]];
    } else if (
      frames.length === 1 &&
      frame.length === 9 &&
      [...frame.subarray(4, 8)].every((value) => value <= 33)
    ) {
      values = [frame[4], frame[5], frame[6], frame[7]];
    } else throw new Error('Respuesta de potencia 0x77 inesperada.');
    this.powers = [...values];
    this.events.emit('powerValues', [...values]);
    return values;
  }

  private async confirm(
    command: number,
    data: Buffer,
    timeoutMs: number = ESP32.timeoutMs,
  ): Promise<void> {
    const frames = await this.send(command, data, timeoutMs);
    if (
      frames.length !== 1 ||
      frames[0].length !== 6 ||
      frames[0][4] !== 0x10
    ) {
      throw new Error(`No se confirmó el comando 0x${command.toString(16)}.`);
    }
  }

  private async readFilter(): Promise<string | null> {
    const frames = await this.send(CM2000.readFilter);
    if (frames.length !== 1)
      throw new Error('No se pudo consultar el filtro EPC.');
    const frame = frames[0];
    if (
      [6, 7].includes(frame.length) &&
      frame[4] === 1 &&
      (frame.length === 6 || frame[5] === 0)
    )
      return null;
    if (frame.length >= 7 && frame[4] === 0 && frame.length === frame[5] + 7)
      return frame.subarray(6, -1).toString('hex').toUpperCase();
    throw new Error('Respuesta de filtro EPC inválida.');
  }

  private async removeFilter(): Promise<void> {
    await this.confirm(CM2000.filter, Buffer.from([1, 0]));
    if ((await this.readFilter()) !== null)
      throw new Error('El filtro EPC sigue activo.');
  }

  private async applyFilter(epc: string): Promise<void> {
    await this.confirm(
      CM2000.filter,
      Buffer.concat([Buffer.from([0, 12]), Buffer.from(epc, 'hex')]),
    );
    if ((await this.readFilter()) !== epc)
      throw new Error('El filtro consultado no coincide con el EPC esperado.');
  }

  private async inventoryRound(): Promise<TagReading[]> {
    const frames = await this.send(
      CM2000.inventory,
      Buffer.from([1]),
      CM2000.roundTimeoutMs,
    );
    const readings = new Map<string, TagReading>();
    for (const frame of frames) {
      if (frame[1] === 4) {
        this.unsafe = true;
        throw new Error(
          `Error de inventario 0x89: 0x${frame[4].toString(16)}.`,
        );
      }
      if ([8, 10].includes(frame[1])) continue;
      const tag = this.extractReading(frame);
      if (!tag) throw new Error('Inventario con respuesta no reconocida.');
      readings.set(tag.epc, tag);
    }
    this.rounds++;
    this.events.emit('round');
    return [...readings.values()];
  }

  private async verifyUnique(expected: string): Promise<TagReading> {
    const tags = await this.inventoryRound();
    if (tags.length !== 1 || tags[0].epc !== expected) {
      throw new Error(
        `Se esperaba únicamente ${expected}; detectados: ${tags.map((tag) => tag.epc).join(', ') || 'ninguno'}.`,
      );
    }
    return tags[0];
  }

  private writeStatus(frame: Buffer): number | null {
    if (frame.length < 6 || frame[3] !== CM2000.write) return null;
    if (frame.length === 6) return frame[4];
    const offset = 7 + frame[6];
    return frame.length >= 11 && offset + 4 === frame.length
      ? frame[offset]
      : null;
  }

  private extractReading(frame: Buffer): TagReading | null {
    if (
      frame.length < 11 ||
      frame[3] !== CM2000.inventory ||
      [4, 8, 10].includes(frame[1])
    )
      return null;
    const length = ((frame.readUInt16BE(5) >> 11) & 0x1f) * 2;
    if (length <= 0 || length > 62 || 7 + length !== frame.length - 2)
      return null;
    return {
      epc: frame
        .subarray(7, 7 + length)
        .toString('hex')
        .toUpperCase(),
      antenna: (frame[4] & 3) + 1,
      rssiRaw: frame[frame.length - 2],
    };
  }

  private recordTag(tag: TagReading): void {
    const now = new Date();
    const previous = this.records.get(tag.epc);
    this.records.set(tag.epc, {
      ...tag,
      count: (previous?.count ?? 0) + 1,
      firstSeen: previous?.firstSeen ?? now,
      lastSeen: now,
    });
    this.total++;
    this.instants.push(performance.now());
    if (this.instants.length > 1000) {
      const cutoff = performance.now() - 5000;
      this.instants = this.instants.filter((instant) => instant >= cutoff);
    }
    this.events.emit('tag', { ...tag });
  }

  private evaluateTemperature(celsius: number | null): void {
    const active =
      this.threshold !== null && celsius !== null && celsius > this.threshold;
    if (active !== this.temperatureAlert) {
      this.temperatureAlert = active;
      this.events.emit('temperatureAlert', {
        active,
        celsius,
        threshold: this.threshold,
      });
    }
  }

  private diagnostic(frame: Buffer, outgoing = false): string {
    // El eco 0x82 también contiene contraseña y checksum derivado de ella.
    if (frame[3] === CM2000.write && (outgoing || frame.length === 14)) {
      return `${frame.subarray(0, 4).toString('hex')} ** ** ** ** ${frame.subarray(8, -1).toString('hex')} **`;
    }
    return frame.toString('hex').toUpperCase();
  }

  private send(
    command: number,
    data: Buffer = Buffer.alloc(0),
    timeoutMs: number = ESP32.timeoutMs,
  ): Promise<Buffer[]> {
    if (data.length + 3 > 255)
      return Promise.reject(new Error('Datos demasiado largos para A0.'));
    if (command !== CM2000.temperature) this.buffer = Buffer.alloc(0);
    const body = Buffer.concat([
      Buffer.from([0xa0, data.length + 3, CM2000.address, command]),
      data,
    ]);
    const checksum = -body.reduce((sum, byte) => sum + byte, 0) & 0xff;
    const tx = Buffer.concat([body, Buffer.from([checksum])]);
    this.events.emit('diagnostic', `TX: ${this.diagnostic(tx, true)}`);
    return new Promise<Buffer[]>((resolve, reject) => {
      const frames: Buffer[] = [];
      const invalidBefore = this.invalidFrames;
      let timer: ReturnType<typeof setTimeout> | undefined;
      let settled = false;
      let written = false;
      let complete = false;
      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        this.responses.off('frames', onFrames);
        this.responses.off('failure', onFailure);
        // Borrar copias que contienen la contraseña una vez completado el envío.
        if (command === CM2000.write) {
          tx.fill(0);
          body.fill(0);
          data.fill(0);
        }
        if (error) reject(error);
        else resolve(frames);
      };
      const onFailure = () => finish(new Error('Error de transporte RFID.'));
      const onFrames = (batch: Buffer[]) => {
        for (const frame of batch) {
          if (frame[2] !== CM2000.address || frame[3] !== command) continue;
          frames.push(frame);
          if (command !== CM2000.inventory || [4, 8, 10].includes(frame[1]))
            complete = true;
        }
        if (complete && written) {
          finish(
            this.invalidFrames !== invalidBefore
              ? new Error('Checksum inválido; operación no confirmada.')
              : undefined,
          );
        }
      };
      this.responses.on('frames', onFrames);
      this.responses.on('failure', onFailure);
      void this.serial
        .sendRfid(tx)
        .then(() => {
          if (settled) return;
          written = true;
          if (complete) {
            finish(
              this.invalidFrames !== invalidBefore
                ? new Error('Checksum inválido; operación no confirmada.')
                : undefined,
            );
            return;
          }
          timer = setTimeout(() => {
            // Sin IDs de transacción, una respuesta tardía no debe confirmar
            // otra configuración. Escritura se verifica por inventario;
            // temperatura no debe bloquear las lecturas EPC.
            if (command !== CM2000.write && command !== CM2000.temperature)
              this.unsafe = true;
            finish(
              new Error(
                command === CM2000.inventory
                  ? 'Inventario incompleto: no llegó el fin de ronda 0x89; reconectá el puerto.'
                  : `Sin respuesta a 0x${command.toString(16)}; operación no confirmada.`,
              ),
            );
          }, timeoutMs);
        })
        .catch(onFailure);
    });
  }

  private decode(data: Buffer): void {
    this.buffer = Buffer.concat([this.buffer, data]);
    const frames: Buffer[] = [];
    while (this.buffer.length) {
      const start = this.buffer.indexOf(0xa0);
      if (start < 0) {
        this.buffer = Buffer.alloc(0);
        break;
      }
      this.buffer = this.buffer.subarray(start);
      if (this.buffer.length < 2) break;
      const length = this.buffer[1] + 2;
      if (length < 5) {
        this.invalidFrames++;
        this.buffer = this.buffer.subarray(1);
        continue;
      }
      if (this.buffer.length < length) break;
      const frame = Buffer.from(this.buffer.subarray(0, length));
      if ((frame.reduce((sum, byte) => sum + byte, 0) & 0xff) !== 0) {
        this.invalidFrames++;
        this.buffer = this.buffer.subarray(1);
        continue;
      }
      this.buffer = this.buffer.subarray(length);
      this.events.emit('diagnostic', `RX: ${this.diagnostic(frame)}`);
      if (frame[2] !== CM2000.address) continue;
      const tag = this.extractReading(frame);
      if (tag) this.recordTag(tag);
      frames.push(frame);
    }
    if (frames.length) this.responses.emit('frames', frames);
  }
}
