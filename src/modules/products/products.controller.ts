import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { User } from '../users/entities/user.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductStatusDto } from './dto/update-product-status.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@ApiTags('products')
@ApiBearerAuth()
@RequirePermission('stock.manage')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear producto' })
  @ApiBody({ type: CreateProductDto })
  create(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.productsService.createForBusiness(
      createProductDto,
      currentUser,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Listar productos' })
  findAll(@CurrentUser() currentUser: User) {
    return this.productsService.findAllForBusiness(currentUser);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener producto por id' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.productsService.findOneForBusiness(+id, currentUser);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar producto' })
  @ApiBody({ type: UpdateProductDto })
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.productsService.updateForBusiness(
      +id,
      updateProductDto,
      currentUser,
    );
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Cambiar estado de producto' })
  @ApiBody({ type: UpdateProductStatusDto })
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateProductStatusDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.productsService.updateStatusForBusiness(
      +id,
      updateStatusDto,
      currentUser,
    );
  }
}
