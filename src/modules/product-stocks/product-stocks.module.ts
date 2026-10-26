import { Module } from '@nestjs/common';
import { ProductStocksController } from './product-stocks.controller';
import { ProductStocksRepository } from './product-stocks.repository';
import { ProductStocksService } from './product-stocks.service';

@Module({
  controllers: [ProductStocksController],
  providers: [ProductStocksService, ProductStocksRepository],
})
export class ProductStocksModule {}
