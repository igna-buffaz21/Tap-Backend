import { Module } from '@nestjs/common';
import { Esp32Controller } from './esp32.controller';
import { Cm2000Service } from './services/cm2000.service';
import { DoorService } from './services/door.service';
import { SerialService } from './services/serial.service';

@Module({
  controllers: [Esp32Controller],
  providers: [Cm2000Service, DoorService, SerialService],
  exports: [Cm2000Service, DoorService, SerialService],
})
export class Esp32Module {}
