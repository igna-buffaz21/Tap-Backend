import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerStatusDto } from './dto/update-customer-status.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@ApiTags('customers')
@ApiBearerAuth()
@RequirePermission('customer.manage')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @ApiOperation({ summary: 'Crear cliente' })
  @ApiQuery({
    name: 'businessId',
    required: false,
    example: 1,
    description:
      'Requerido para superadmin. Usuarios de negocio usan automaticamente su negocio.',
  })
  @ApiBody({ type: CreateCustomerDto })
  create(
    @Body() createCustomerDto: CreateCustomerDto,
    @CurrentUser() currentUser: User,
    @Query('businessId') businessId?: string,
  ) {
    return this.customersService.createForBusiness(
      createCustomerDto,
      currentUser,
      businessId,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Listar clientes' })
  findAll(
    @CurrentUser() currentUser: User,
    @Query('businessId') businessId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.customersService.findAllForBusiness(
      currentUser,
      businessId,
      page,
      limit,
      search,
      status,
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadisticas de clientes' })
  @ApiQuery({
    name: 'businessId',
    required: false,
    example: 1,
    description:
      'Requerido para superadmin. Usuarios de negocio usan automaticamente su negocio.',
  })
  getStats(
    @CurrentUser() currentUser: User,
    @Query('businessId') businessId?: string,
  ) {
    return this.customersService.getStatsForBusiness(currentUser, businessId);
  }

  @Get('by-phone')
  @ApiOperation({ summary: 'Buscar cliente por telefono' })
  @ApiQuery({
    name: 'businessId',
    required: false,
    example: 1,
    description:
      'Requerido para superadmin. Usuarios de negocio usan automaticamente su negocio.',
  })
  @ApiQuery({
    name: 'phone',
    required: true,
    example: '543534133580',
    description:
      'Telefono a buscar. Se normaliza, por ejemplo +5493534133580 queda 543534133580.',
  })
  findByPhone(
    @CurrentUser() currentUser: User,
    @Query('phone') phone: string,
    @Query('businessId') businessId?: string,
  ) {
    return this.customersService.findByPhoneForBusiness(
      phone,
      currentUser,
      businessId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener cliente por id' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
    @Query('businessId') businessId?: string,
  ) {
    return this.customersService.findOneForBusiness(
      +id,
      currentUser,
      businessId,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar cliente' })
  @ApiBody({ type: UpdateCustomerDto })
  @ApiQuery({
    name: 'businessId',
    required: false,
    example: 1,
    description:
      'Requerido para superadmin. Usuarios de negocio usan automaticamente su negocio.',
  })
  update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
    @CurrentUser() currentUser: User,
    @Query('businessId') businessId?: string,
  ) {
    return this.customersService.updateForBusiness(
      +id,
      updateCustomerDto,
      currentUser,
      businessId,
    );
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Activar o desactivar cliente' })
  @ApiBody({ type: UpdateCustomerStatusDto })
  @ApiQuery({
    name: 'businessId',
    required: false,
    example: 1,
    description:
      'Requerido para superadmin. Usuarios de negocio usan automaticamente su negocio.',
  })
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateCustomerStatusDto,
    @CurrentUser() currentUser: User,
    @Query('businessId') businessId?: string,
  ) {
    return this.customersService.updateStatusForBusiness(
      +id,
      updateStatusDto,
      currentUser,
      businessId,
    );
  }
}
