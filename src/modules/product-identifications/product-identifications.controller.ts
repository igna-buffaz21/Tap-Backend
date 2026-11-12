import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ProductIdentificationsService } from './product-identifications.service';
import { CreateProductIdentificationDto } from './types/dto/create-product-identification.dto';
import { FindProductIdentificationsDto } from './types/dto/find-product-identifications.dto';
import { UpdateProductIdentificationDto } from './types/dto/update-product-identification.dto';

@ApiTags('product-identifications')
@ApiBearerAuth()
@Controller('product-identifications')
export class ProductIdentificationsController {
  constructor(private readonly service: ProductIdentificationsService) {}

  @Post()
  @ApiOperation({
    summary: 'Asignar un identificador a un producto del negocio',
  })
  create(
    @Body() dto: CreateProductIdentificationDto,
    @CurrentUser() user: User,
  ) {
    return this.service.createForBusiness(dto, user);
  }

  @Get()
  @ApiOperation({
    summary:
      'Listar identificadores con filtros opcionales por producto, tipo y valor',
  })
  findAll(
    @Query() filters: FindProductIdentificationsDto,
    @CurrentUser() user: User,
  ) {
    return this.service.findAllForBusiness(filters, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un identificador del negocio por id' })
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.findOneForBusiness(id, user);
  }

  @Patch(':id')
  @ApiOperation({
    summary:
      'Editar un identificador o reasignarlo a otro producto del negocio',
  })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductIdentificationDto,
    @CurrentUser() user: User,
  ) {
    return this.service.updateForBusiness(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar la asignación de un identificador' })
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.removeForBusiness(id, user);
  }
}
