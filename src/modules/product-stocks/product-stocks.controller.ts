import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ProductStocksService } from './product-stocks.service';

@ApiTags('product-stocks')
@ApiBearerAuth()
@Controller('product-stocks')
export class ProductStocksController {
  constructor(private readonly productStocksService: ProductStocksService) {}

  @Get()
  @ApiOperation({ summary: 'Listar stock de productos por sucursal' })
  @ApiQuery({ name: 'branchId', required: false, example: 2 })
  @ApiQuery({ name: 'productId', required: false, example: 12 })
  findAll(
    @CurrentUser() currentUser: User,
    @Query('branchId') branchId?: string,
    @Query('productId') productId?: string,
  ) {
    return this.productStocksService.findAllForBusiness(
      currentUser,
      branchId,
      productId,
    );
  }

  @Get('stats/cards')
  @ApiOperation({ summary: 'Obtener stats principales de stock' })
  @ApiQuery({ name: 'branchId', required: false, example: 2 })
  getStats(
    @CurrentUser() currentUser: User,
    @Query('branchId') branchId?: string,
  ) {
    return this.productStocksService.getStatsForBusiness(
      currentUser,
      branchId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener stock de producto por id' })
  findOne(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.productStocksService.findOneForBusiness(+id, currentUser);
  }
}
