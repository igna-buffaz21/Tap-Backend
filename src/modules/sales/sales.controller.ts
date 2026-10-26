import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { User } from '../users/entities/user.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SalesService } from './sales.service';

@ApiTags('sales')
@ApiBearerAuth()
@RequirePermission('stock.manage')
@ApiQuery({
  name: 'businessId',
  required: false,
  description:
    'Requerido para superadmin. Usuarios de negocio usan el negocio del token.',
})
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear venta',
    description:
      'Registra la venta como COMPLETED y calcula los importes desde sus líneas. Con payment registra el cobro total y su ingreso de caja en la misma transacción.',
  })
  @ApiBody({ type: CreateSaleDto })
  create(
    @Body() createSaleDto: CreateSaleDto,
    @CurrentUser() currentUser: User,
    @Query('businessId') businessId?: string,
  ) {
    return this.salesService.createForBusiness(
      createSaleDto,
      currentUser,
      businessId,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Listar ventas',
    description:
      'Devuelve { data, pagination: { page, limit, total, totalPages } } con las cabeceras de venta ordenadas de la más reciente a la más antigua. Cada venta incluye created_by (ID del usuario) y created_by_user_name (nombre, o null si no hay un usuario asociado dentro del alcance permitido).',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Página (por defecto 1).',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Ventas por página (por defecto 10, máximo 100).',
  })
  findAll(
    @CurrentUser() currentUser: User,
    @Query('businessId') businessId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.salesService.findAllForBusiness(
      currentUser,
      businessId,
      page,
      limit,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener venta por id' })
  @ApiParam({ name: 'id', example: 1 })
  findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
    @Query('businessId') businessId?: string,
  ) {
    return this.salesService.findOneForBusiness(+id, currentUser, businessId);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Anular venta' })
  @ApiParam({ name: 'id', example: 1 })
  cancel(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
    @Query('businessId') businessId?: string,
  ) {
    return this.salesService.cancelForBusiness(+id, currentUser, businessId);
  }
}
