import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ESP32 } from '../types/esp32.constants';
import { SerialService } from './serial.service';

@Injectable()
export class DoorService implements OnModuleDestroy {
  private confirmedState: 'open' | 'closed' | null = null;
  private readonly resetState = () => {
    this.confirmedState = null;
  };

  constructor(private readonly serial: SerialService) {
    this.serial.events.on('disconnected', this.resetState);
    this.serial.events.on('transportError', this.resetState);
  }

  onModuleDestroy(): void {
    this.serial.events.off('disconnected', this.resetState);
    this.serial.events.off('transportError', this.resetState);
  }

  get state() {
    return this.confirmedState;
  }

  async open(): Promise<void> {
    this.confirmedState = null;
    await this.serial.requestAck(ESP32.openDoor);
    this.confirmedState = 'open';
  }

  async close(): Promise<void> {
    this.confirmedState = null;
    await this.serial.requestAck(ESP32.closeDoor);
    this.confirmedState = 'closed';
  }
}
