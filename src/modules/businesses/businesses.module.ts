import { Module } from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { BusinessesController } from './businesses.controller';
import { BusinessesRepository } from './businesses.repository';

@Module({
  controllers: [BusinessesController],
  providers: [BusinessesService, BusinessesRepository],
})
export class BusinessesModule {}
