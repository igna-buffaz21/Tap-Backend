import { Module } from '@nestjs/common';
import type { DynamicModule } from '@nestjs/common';
import { ProductIdentificationsModule } from '../product-identifications/product-identifications.module';
import { Esp32Controller } from './esp32.controller';
import { Cm2000Service } from './services/cm2000.service';
import { DoorService } from './services/door.service';
import { SerialService } from './services/serial.service';

@Module({
  providers: [Cm2000Service, DoorService, SerialService],
  exports: [Cm2000Service, DoorService, SerialService],
})
export class Esp32Module {
  // Console scripts use the hardware module without HTTP or database dependencies.
  static forApi(): DynamicModule {
    return {
      module: Esp32Module,
      imports: [ProductIdentificationsModule],
      controllers: [Esp32Controller],
    };
  }
}
