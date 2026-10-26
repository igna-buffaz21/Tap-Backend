import { Module } from '@nestjs/common';
import { SaleItemsModule } from '../sale-items/sale-items.module';
import { StockMovementsModule } from '../stock-movements/stock-movements.module';
import { SalesController } from './sales.controller';
import { SalesRepository } from './sales.repository';
import { SalesService } from './sales.service';

@Module({
  imports: [SaleItemsModule, StockMovementsModule],
  controllers: [SalesController],
  providers: [SalesService, SalesRepository],
})
export class SalesModule {}
