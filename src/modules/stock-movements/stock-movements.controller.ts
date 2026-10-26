import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { User } from '../users/entities/user.entity';
import { CreateBulkStockMovementDto } from './dto/create-bulk-stock-movement.dto';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { StockMovementsService } from './stock-movements.service';

@ApiTags('stock-movements')
@ApiBearerAuth()
@RequirePermission('stock.manage')
@Controller('stock-movements')
export class StockMovementsController {
  constructor(private readonly stockMovementsService: StockMovementsService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear movimiento de stock',
    description:
      'Actualiza product_stock y crea stock_movement en la misma transaccion.',
  })
  @ApiBody({ type: CreateStockMovementDto })
  create(
    @Body() createMovementDto: CreateStockMovementDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.stockMovementsService.createForBusiness(
      createMovementDto,
      currentUser,
    );
  }

  @Post('bulk')
  @ApiOperation({
    summary: 'Crear movimientos de stock masivos',
    description:
      'Aplica entradas o salidas de mercaderia para varios productos en una misma transaccion.',
  })
  @ApiBody({ type: CreateBulkStockMovementDto })
  createBulk(
    @Body() createBulkMovementDto: CreateBulkStockMovementDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.stockMovementsService.createBulkForBusiness(
      createBulkMovementDto,
      currentUser,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Listar movimientos de stock' })
  @ApiQuery({ name: 'branchId', required: false, example: 2 })
  @ApiQuery({ name: 'productId', required: false, example: 12 })
  @ApiQuery({ name: 'userId', required: false, example: 7 })
  @ApiQuery({ name: 'categoryId', required: false, example: 4 })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['IN', 'OUT', 'ADJUSTMENT'],
    example: 'IN',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  findAll(
    @CurrentUser() currentUser: User,
    @Query('branchId') branchId?: string,
    @Query('productId') productId?: string,
    @Query('userId') userId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('type') type?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.stockMovementsService.findAllForBusiness(
      currentUser,
      branchId,
      productId,
      userId,
      categoryId,
      type,
      page,
      limit,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener movimiento de stock por id' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.stockMovementsService.findOneForBusiness(
      +id,
      currentUser,
    );
  }
}
