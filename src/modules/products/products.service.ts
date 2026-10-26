import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductStatusDto } from './dto/update-product-status.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductAccessFilter, ProductsRepository } from './products.repository';
import type { RolePermissionAccessScope } from '../auth/interfaces/auth-user.interface';

const STATUSES = ['active', 'inactive'] as const;
const UNITS = ['unit', 'kg', 'g', 'l', 'ml', 'box', 'pack'] as const;

interface StockAccess {
  businessId: number;
  accessScope: RolePermissionAccessScope;
  filter?: ProductAccessFilter;
}

@Injectable()
export class ProductsService {
  constructor(private readonly productsRepository: ProductsRepository) {}

  async createForBusiness(
    createProductDto: CreateProductDto,
    currentUser: User,
  ) {
    const access = this.resolveStockAccess(currentUser);
    const dto = this.normalizeCreateDto(createProductDto);

    await this.assertCategoryBelongsToBusiness(
      dto.category_id,
      access.businessId,
    );
    await this.assertInitialStockBranchBelongsToBusiness(
      dto,
      access.businessId,
      access.filter,
    );

    try {
      return await this.productsRepository.create(access.businessId, dto);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Product sku already exists for business');
      }

      throw error;
    }
  }

  findAllForBusiness(currentUser: User) {
    const access = this.resolveStockAccess(currentUser);

    return this.productsRepository.findAllForBusiness(access.businessId);
  }

  async findOneForBusiness(id: number, currentUser: User) {
    const productId = this.parsePositiveInteger(id, 'id');
    const access = this.resolveStockAccess(currentUser);
    const product = await this.productsRepository.findByIdForBusiness(
      productId,
      access.businessId,
    );

    if (!product) {
      throw new NotFoundException('Product not found for business');
    }

    return product;
  }

  async updateForBusiness(
    id: number,
    updateProductDto: UpdateProductDto,
    currentUser: User,
  ) {
    const productId = this.parsePositiveInteger(id, 'id');
    const access = this.resolveStockAccess(currentUser);
    const dto = this.normalizeUpdateDto(updateProductDto);

    await this.assertCategoryBelongsToBusiness(
      dto.category_id,
      access.businessId,
    );

    try {
      const product = await this.productsRepository.updateForBusiness(
        productId,
        access.businessId,
        dto,
      );

      if (!product) {
        throw new NotFoundException('Product not found for business');
      }

      return product;
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Product sku already exists for business');
      }

      throw error;
    }
  }

  async updateStatusForBusiness(
    id: number,
    updateStatusDto: UpdateProductStatusDto,
    currentUser: User,
  ) {
    const productId = this.parsePositiveInteger(id, 'id');
    const access = this.resolveStockAccess(currentUser);
    const product = await this.productsRepository.updateForBusiness(
      productId,
      access.businessId,
      {
        status: this.normalizeRequiredStatus(updateStatusDto.status),
      },
    );

    if (!product) {
      throw new NotFoundException('Product not found for business');
    }

    return product;
  }

  private resolveStockAccess(currentUser: User): StockAccess {
    const authorization = currentUser.authorization;

    if (!authorization) {
      throw new ForbiddenException('Authorization context is required');
    }

    const accessScope = authorization.permissions['stock.manage'];

    if (!accessScope) {
      throw new ForbiddenException('Missing permission stock.manage');
    }

    return {
      businessId: this.requireBusinessUserBusinessId(authorization.businessId),
      accessScope,
      filter:
        accessScope === 'business'
          ? undefined
          : { allowedBranchIds: authorization.branchIds },
    };
  }

  private requireBusinessUserBusinessId(businessId: unknown): number {
    if (businessId === undefined || businessId === null || businessId === '') {
      throw new ForbiddenException('User must belong to a business');
    }

    return this.parsePositiveInteger(businessId, 'businessId');
  }

  private async assertCategoryBelongsToBusiness(
    categoryIdValue: unknown,
    businessId: number,
  ): Promise<void> {
    if (
      categoryIdValue === undefined ||
      categoryIdValue === null ||
      categoryIdValue === ''
    ) {
      return;
    }

    const categoryId = this.parsePositiveInteger(
      categoryIdValue,
      'category_id',
    );
    const belongs = await this.productsRepository.categoryBelongsToBusiness(
      categoryId,
      businessId,
    );

    if (!belongs) {
      throw new ForbiddenException(
        'Product category does not belong to business',
      );
    }
  }

  private async assertInitialStockBranchBelongsToBusiness(
    dto: CreateProductDto,
    businessId: number,
    accessFilter?: ProductAccessFilter,
  ): Promise<void> {
    if (
      dto.branch_id === undefined &&
      dto.minimum_quantity !== undefined &&
      dto.minimum_quantity !== null
    ) {
      throw new BadRequestException(
        'branch_id is required for minimum_quantity',
      );
    }

    if (dto.branch_id === undefined) {
      return;
    }

    const belongs =
      await this.productsRepository.branchBelongsToBusinessAndAccess(
        dto.branch_id,
        businessId,
        accessFilter,
      );

    if (!belongs) {
      throw new ForbiddenException('Branch does not belong to business');
    }
  }

  private normalizeCreateDto(dto: CreateProductDto): CreateProductDto {
    return {
      category_id: this.normalizeOptionalPositiveInteger(
        dto.category_id,
        'category_id',
      ),
      name: this.normalizeRequiredString(dto.name, 'name'),
      description: this.normalizeOptionalString(dto.description, 'description'),
      sku: this.normalizeOptionalString(dto.sku, 'sku'),
      unit: this.normalizeOptionalUnit(dto.unit),
      cost_price: this.normalizeOptionalNonNegativeNumber(
        dto.cost_price,
        'cost_price',
      ),
      sale_price: this.normalizeOptionalNonNegativeNumber(
        dto.sale_price,
        'sale_price',
      ),
      branch_id: this.normalizeOptionalPositiveIntegerAsUndefined(
        dto.branch_id,
        'branch_id',
      ),
      minimum_quantity: this.normalizeOptionalNonNegativeNumberAsUndefined(
        dto.minimum_quantity,
        'minimum_quantity',
      ),
      status: this.normalizeOptionalStatus(dto.status),
    };
  }

  private normalizeUpdateDto(dto: UpdateProductDto): UpdateProductDto {
    return {
      category_id: Object.prototype.hasOwnProperty.call(dto, 'category_id')
        ? this.normalizeOptionalPositiveInteger(dto.category_id, 'category_id')
        : undefined,
      name:
        dto.name === undefined
          ? undefined
          : this.normalizeRequiredString(dto.name, 'name'),
      description: Object.prototype.hasOwnProperty.call(dto, 'description')
        ? this.normalizeOptionalString(dto.description, 'description')
        : undefined,
      sku: Object.prototype.hasOwnProperty.call(dto, 'sku')
        ? this.normalizeOptionalString(dto.sku, 'sku')
        : undefined,
      unit:
        dto.unit === undefined
          ? undefined
          : this.normalizeRequiredUnit(dto.unit),
      cost_price: Object.prototype.hasOwnProperty.call(dto, 'cost_price')
        ? this.normalizeOptionalNonNegativeNumber(dto.cost_price, 'cost_price')
        : undefined,
      sale_price: Object.prototype.hasOwnProperty.call(dto, 'sale_price')
        ? this.normalizeOptionalNonNegativeNumber(dto.sale_price, 'sale_price')
        : undefined,
    };
  }

  private parsePositiveInteger(value: unknown, field: string): number {
    const parsed = Number(value);

    if (
      value === undefined ||
      value === null ||
      value === '' ||
      !Number.isInteger(parsed) ||
      parsed <= 0
    ) {
      throw new BadRequestException(`${field} must be a positive integer`);
    }

    return parsed;
  }

  private normalizeOptionalPositiveInteger(
    value: unknown,
    field: string,
  ): number | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    return this.parsePositiveInteger(value, field);
  }

  private normalizeRequiredString(value: unknown, field: string): string {
    if (typeof value !== 'string') {
      throw new BadRequestException(`${field} must be a string`);
    }

    const normalized = value.trim();

    if (!normalized) {
      throw new BadRequestException(`${field} is required`);
    }

    return normalized;
  }

  private normalizeOptionalString(
    value: unknown,
    field: string,
  ): string | null {
    if (value === undefined || value === null) {
      return null;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException(`${field} must be a string or null`);
    }

    return value.trim() || null;
  }

  private normalizeOptionalNonNegativeNumber(
    value: unknown,
    field: string,
  ): number | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed < 0) {
      throw new BadRequestException(`${field} must be a non-negative number`);
    }

    return parsed;
  }

  private normalizeOptionalPositiveIntegerAsUndefined(
    value: unknown,
    field: string,
  ): number | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    return this.parsePositiveInteger(value, field);
  }

  private normalizeOptionalNonNegativeNumberAsUndefined(
    value: unknown,
    field: string,
  ): number | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed < 0) {
      throw new BadRequestException(`${field} must be a non-negative number`);
    }

    return parsed;
  }

  private normalizeOptionalStatus(value: unknown): string | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    return this.normalizeRequiredStatus(value);
  }

  private normalizeRequiredStatus(value: unknown): string {
    if (typeof value !== 'string') {
      throw new BadRequestException('status must be a string');
    }

    const status = value.trim().toLowerCase();

    if (!STATUSES.includes(status as (typeof STATUSES)[number])) {
      throw new BadRequestException('status must be active or inactive');
    }

    return status;
  }

  private normalizeOptionalUnit(value: unknown): string | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    return this.normalizeRequiredUnit(value);
  }

  private normalizeRequiredUnit(value: unknown): string {
    if (typeof value !== 'string') {
      throw new BadRequestException('unit must be a string');
    }

    const unit = value.trim().toLowerCase();

    if (!UNITS.includes(unit as (typeof UNITS)[number])) {
      throw new BadRequestException(
        'unit must be unit, kg, g, l, ml, box or pack',
      );
    }

    return unit;
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    );
  }
}
