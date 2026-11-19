import { ConflictException, Injectable, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter } from 'node:events';
import { ESP32 } from '../types/esp32.constants';
import { SerialService } from './serial.service';

@Injectable()
export class SensorService implements OnModuleDestroy {
  readonly events = new EventEmitter();
  private detected: boolean | null = null;
  private detectedSince: number | null = null;
  private consumed = false;
  private confirmationTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly onFrame = (type: number, data: Buffer) => {
    if (
      type !== ESP32.sensor ||
      data.length !== 1 ||
      (data[0] !== 0 && data[0] !== 1)
    )
      return;
    const detected = data[0] === 1;
    if (this.detected !== detected) {
      this.detected = detected;
      this.detectedSince = detected ? performance.now() : null;
      this.consumed = false;
      clearTimeout(this.confirmationTimer);
      if (detected) {
        this.confirmationTimer = setTimeout(() => {
          this.events.emit('status');
        }, 1000);
      }
      this.events.emit('change', detected);
      this.events.emit('status');
    }
  };

  private readonly resetState = () => {
    clearTimeout(this.confirmationTimer);
    this.detectedSince = null;
    this.consumed = false;
    if (this.detected !== null) {
      this.detected = null;
      this.events.emit('change', null);
    }
    this.events.emit('status');
  };

  constructor(private readonly serial: SerialService) {
    serial.events.on('frame', this.onFrame);
    serial.events.on('disconnected', this.resetState);
    serial.events.on('transportError', this.resetState);
  }

  // Último estado recibido: true = objeto, false = sin objeto, null = desconocido.
  get state(): boolean | null {
    return this.detected;
  }

  get confirmed(): boolean {
    return (
      this.detected === true &&
      this.detectedSince !== null &&
      performance.now() - this.detectedSince >= 1000
    );
  }

  get ready(): boolean {
    return this.confirmed && !this.consumed;
  }

  consumeDetection(): void {
    if (!this.ready)
      throw new ConflictException(
        'No hay una nueva detección estable del sensor.',
      );
    this.consumed = true;
    this.events.emit('status');
  }

  waitForObject(signal: AbortSignal, requireClear = false): Promise<void> {
    return new Promise((resolve, reject) => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      let armed = !requireClear || this.state === false;
      const cleanup = () => {
        clearTimeout(timer);
        this.events.off('change', onChange);
        signal.removeEventListener('abort', onAbort);
      };
      const onAbort = () => {
        cleanup();
        reject(signal.reason);
      };
      const onChange = (state: boolean | null) => {
        clearTimeout(timer);
        if (state === false) armed = true;
        if (state !== true || !armed) return;
        timer = setTimeout(() => {
          cleanup();
          resolve();
        }, 1000);
      };
      this.events.on('change', onChange);
      signal.addEventListener('abort', onAbort, { once: true });
      if (signal.aborted) onAbort();
      else onChange(this.state);
    });
  }

  onModuleDestroy(): void {
    clearTimeout(this.confirmationTimer);
    this.serial.events.off('frame', this.onFrame);
    this.serial.events.off('disconnected', this.resetState);
    this.serial.events.off('transportError', this.resetState);
  }
}
