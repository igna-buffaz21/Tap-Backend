import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { SerialPort } from 'serialport';
import { ESP32 } from '../types/esp32.constants';

@Injectable()
export class SerialService implements OnModuleDestroy {
  readonly events = new EventEmitter();
  private port: SerialPort | null = null;
  private connecting: Promise<void> | null = null;
  private closing = false;
  private ready = false;
  private buffer: Buffer = Buffer.alloc(0);
  private queueFinished: Promise<unknown> = Promise.resolve();

  listPorts() {
    return SerialPort.list();
  }

  get isConnected(): boolean {
    return this.ready && !!this.port?.isOpen;
  }

  async connect(path: string): Promise<void> {
    if (!path.trim()) throw new Error('El puerto serial es obligatorio.');
    if (this.closing) throw new Error('El puerto se está cerrando.');
    if (this.port) {
      if (this.port.path !== path)
        throw new Error('Ya hay otro puerto seleccionado.');
      if (this.connecting) return this.connecting;
      if (this.isConnected) return;
      throw new Error('Cerrá la conexión anterior antes de reconectar.');
    }
    const port = new SerialPort({
      path,
      baudRate: ESP32.baudRate,
      autoOpen: false,
    });
    this.port = port;
    this.buffer = Buffer.alloc(0);
    let connectionFailed = false;
    port.on('data', (data: Buffer) => this.decode(data));
    port.on('error', () => {
      connectionFailed = true;
      this.ready = false;
      // No publicar mensajes del driver: podrían incluir el comando/contraseña.
      this.events.emit('transportError', new Error('Error del puerto serial.'));
    });
    port.on('close', () => {
      this.ready = false;
      this.buffer = Buffer.alloc(0);
      this.events.emit('disconnected');
    });
    this.connecting = (async () => {
      await new Promise<void>((resolve, reject) =>
        port.open((error) => (error ? reject(error) : resolve())),
      );
      await new Promise<void>((resolve, reject) =>
        port.set({ dtr: false, rts: false }, (error) =>
          error ? reject(error) : resolve(),
        ),
      );
      await delay(ESP32.startupMs);
      if (!port.isOpen || connectionFailed)
        throw new Error('El puerto se desconectó durante el inicio.');
      this.ready = true;
      this.events.emit('connected');
    })();
    try {
      await this.connecting;
    } catch {
      if (port.isOpen)
        await new Promise<void>((resolve) => port.close(() => resolve()));
      this.port = null;
      throw new Error('No se pudo preparar la conexión serial.');
    } finally {
      this.connecting = null;
    }
  }

  async disconnect(): Promise<void> {
    this.closing = true;
    try {
      await this.connecting?.catch(() => undefined);
      this.ready = false;
      this.events.emit('disconnected');
      await this.queueFinished;
      const port = this.port;
      if (port?.isOpen) {
        await new Promise<void>((resolve, reject) =>
          port.close((error) => (error ? reject(error) : resolve())),
        );
      }
      this.port = null;
      this.buffer = Buffer.alloc(0);
    } finally {
      this.closing = false;
    }
  }

  onModuleDestroy() {
    return this.disconnect();
  }

  sendRfid(data: Buffer): Promise<void> {
    return this.enqueue(async () => {
      for (let offset = 0; offset < data.length; offset += ESP32.maxPayload) {
        await this.writeFrame(
          ESP32.rfidTx,
          data.subarray(offset, offset + ESP32.maxPayload),
        );
      }
    });
  }

  // envia un comando al esp32 y espera un ACK con el mismo comando.
  requestAck(command: number): Promise<void> {
    return this.enqueue(
      () =>
        new Promise<void>((resolve, reject) => {
          const finish = (error?: Error) => {
            clearTimeout(timer);
            this.events.off('frame', onFrame);
            this.events.off('transportError', onError);
            this.events.off('disconnected', onClose);
            if (error) reject(error);
            else resolve();
          };
          const onFrame = (type: number, data: Buffer) => {
            if (type === ESP32.ack && data.length === 1 && data[0] === command)
              finish();
          };
          const onError = () =>
            finish(new Error('Error serial esperando ACK de puerta.'));
          const onClose = () =>
            finish(new Error('Conexión cerrada esperando ACK de puerta.'));
          const timer = setTimeout(() => {
            this.ready = false; // Un ACK tardío no puede confirmar una orden posterior.
            finish(
              new Error(
                'Sin ACK de puerta; reconectá antes de enviar otra orden.',
              ),
            );
            this.events.emit(
              'transportError',
              new Error('Timeout del ACK de puerta.'),
            );
          }, ESP32.timeoutMs);
          this.events.on('frame', onFrame);
          this.events.on('transportError', onError);
          this.events.on('disconnected', onClose);
          void this.writeFrame(command, Buffer.alloc(0)).catch(() => onError());
        }),
    );
  }

  // esta funcion pone las operaciones en cola para que se ejecuten secuencialmente
  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const previousOperationsFinished = this.queueFinished;

    const operationResult = previousOperationsFinished.then(operation);

    this.queueFinished = operationResult.catch(() => undefined);

    return operationResult;
  }

  private async writeFrame(type: number, data: Buffer): Promise<void> {
    const port = this.port;
    if (!this.isConnected || this.closing || !port)
      throw new Error('Puerto serial desconectado.');
    if (data.length > ESP32.maxPayload)
      throw new Error('Trama A5 demasiado larga.');
    let checksum = type ^ data.length;
    for (const byte of data) checksum ^= byte;
    const frame = Buffer.concat([
      Buffer.from([ESP32.start, type, data.length]),
      data,
      Buffer.from([checksum]),
    ]);
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.ready = false;
        this.events.emit(
          'transportError',
          new Error('Timeout de escritura serial.'),
        );
        reject(new Error('Timeout de escritura serial; reconectá el puerto.'));
      }, ESP32.writeTimeoutMs);
      port.write(frame, (error) => {
        if (error) {
          clearTimeout(timer);
          this.ready = false;
          reject(new Error('No se pudo enviar la trama serial.'));
          return;
        }
        port.drain((drainError) => {
          clearTimeout(timer);
          if (drainError) {
            this.ready = false;
            reject(new Error('No se pudo completar el envío serial.'));
          } else resolve();
        });
      });
    });
  }

  private decode(data: Buffer): void {
    this.buffer = Buffer.concat([this.buffer, data]);
    while (this.buffer.length >= 4) {
      if (this.buffer[0] !== ESP32.start || this.buffer[2] > ESP32.maxPayload) {
        this.buffer = this.buffer.subarray(1);
        continue;
      }
      const length = this.buffer[2] + 4;
      if (this.buffer.length < length) break;
      const frame = this.buffer.subarray(0, length);
      let checksum = 0;
      for (const byte of frame.subarray(1)) checksum ^= byte;
      if (checksum !== 0) {
        this.buffer = this.buffer.subarray(1);
        continue;
      }
      this.buffer = this.buffer.subarray(length);
      const payload = Buffer.from(frame.subarray(3, -1));
      this.events.emit('frame', frame[1], payload);
      if (frame[1] === ESP32.rfidRx) this.events.emit('rfid', payload);
    }
  }
}
