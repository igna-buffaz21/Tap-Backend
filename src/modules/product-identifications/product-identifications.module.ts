import { Module } from '@nestjs/common';
import { ProductIdentificationsController } from './product-identifications.controller';
import { ProductIdentificationsRepository } from './product-identifications.repository';
import { ProductIdentificationsService } from './product-identifications.service';

@Module({
  controllers: [ProductIdentificationsController],
  providers: [ProductIdentificationsService, ProductIdentificationsRepository],
  exports: [ProductIdentificationsService],
})
export class ProductIdentificationsModule {}
