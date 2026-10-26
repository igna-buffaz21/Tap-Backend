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
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryStatusDto } from './dto/update-product-category-status.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { ProductCategoriesService } from './product-categories.service';

@ApiTags('product-categories')
@ApiBearerAuth()
@RequirePermission('stock.manage')
@Controller('product-categories')
export class ProductCategoriesController {
  constructor(
    private readonly productCategoriesService: ProductCategoriesService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear categoria de producto' })
  @ApiBody({ type: CreateProductCategoryDto })
  create(
    @Body() createCategoryDto: CreateProductCategoryDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.productCategoriesService.createForBusiness(
      createCategoryDto,
      currentUser,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Listar categorias de producto' })
  findAll(@CurrentUser() currentUser: User) {
    return this.productCategoriesService.findAllForBusiness(currentUser);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener categoria de producto por id' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.productCategoriesService.findOneForBusiness(
      +id,
      currentUser,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar categoria de producto' })
  @ApiBody({ type: UpdateProductCategoryDto })
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateProductCategoryDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.productCategoriesService.updateForBusiness(
      +id,
      updateCategoryDto,
      currentUser,
    );
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Cambiar estado de categoria de producto' })
  @ApiBody({ type: UpdateProductCategoryStatusDto })
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateProductCategoryStatusDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.productCategoriesService.updateStatusForBusiness(
      +id,
      updateStatusDto,
      currentUser,
    );
  }
}
