import { Module } from '@nestjs/common';
import { SaleItemsRepository } from './sale-items.repository';

@Module({
  providers: [SaleItemsRepository],
  exports: [SaleItemsRepository],
})
export class SaleItemsModule {}
