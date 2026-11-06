import { Module } from '@nestjs/common';
import { Cm2000Service } from './services/cm2000.service';
import { DoorService } from './services/door.service';
import { SerialService } from './services/serial.service';

@Module({
  providers: [Cm2000Service, DoorService, SerialService],
  exports: [Cm2000Service, DoorService, SerialService],
})
export class Esp32Module {}
