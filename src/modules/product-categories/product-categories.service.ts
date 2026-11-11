import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryStatusDto } from './dto/update-product-category-status.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { ProductCategoriesRepository } from './product-categories.repository';

const STATUSES = ['ACTIVE', 'INACTIVE'] as const;

@Injectable()
export class ProductCategoriesService {
  constructor(
    private readonly productCategoriesRepository: ProductCategoriesRepository,
  ) {}

  async createForBusiness(
    createCategoryDto: CreateProductCategoryDto,
    currentUser: User,
  ) {
    const businessId = this.resolveStockAccess(currentUser);
    const dto = this.normalizeCreateDto(createCategoryDto);

    try {
      return await this.productCategoriesRepository.create(businessId, dto);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(
          'Product category name already exists for business',
        );
      }

      throw error;
    }
  }

  findAllForBusiness(currentUser: User) {
    const businessId = this.resolveStockAccess(currentUser);

    return this.productCategoriesRepository.findAllForBusiness(businessId);
  }

  async findOneForBusiness(
    id: number,
    currentUser: User,
  ) {
    const categoryId = this.parsePositiveInteger(id, 'id');
    const businessId = this.resolveStockAccess(currentUser);
    const category =
      await this.productCategoriesRepository.findByIdForBusiness(
        categoryId,
        businessId,
      );

    if (!category) {
      throw new NotFoundException('Product category not found for business');
    }

    return category;
  }

  async updateForBusiness(
    id: number,
    updateCategoryDto: UpdateProductCategoryDto,
    currentUser: User,
  ) {
    const categoryId = this.parsePositiveInteger(id, 'id');
    const businessId = this.resolveStockAccess(currentUser);
    const dto = this.normalizeUpdateDto(updateCategoryDto);

    try {
      const category = await this.productCategoriesRepository.updateForBusiness(
        categoryId,
        businessId,
        dto,
      );

      if (!category) {
        throw new NotFoundException('Product category not found for business');
      }

      return category;
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(
          'Product category name already exists for business',
        );
      }

      throw error;
    }
  }

  async updateStatusForBusiness(
    id: number,
    updateStatusDto: UpdateProductCategoryStatusDto,
    currentUser: User,
  ) {
    const categoryId = this.parsePositiveInteger(id, 'id');
    const businessId = this.resolveStockAccess(currentUser);
    const dto = {
      status: this.normalizeRequiredStatus(updateStatusDto.status),
    };
    const category = await this.productCategoriesRepository.updateForBusiness(
      categoryId,
      businessId,
      dto,
    );

    if (!category) {
      throw new NotFoundException('Product category not found for business');
    }

    return category;
  }

  private resolveStockAccess(currentUser: User): number {
    const authorization = currentUser.authorization;

    if (!authorization) {
      throw new ForbiddenException('Authorization context is required');
    }

    return this.requireBusinessUserBusinessId(authorization.businessId);
  }

  private requireBusinessUserBusinessId(businessId: unknown): number {
    if (businessId === undefined || businessId === null || businessId === '') {
      throw new ForbiddenException('User must belong to a business');
    }

    return this.parsePositiveInteger(businessId, 'businessId');
  }

  private normalizeCreateDto(
    dto: CreateProductCategoryDto,
  ): CreateProductCategoryDto {
    return {
      name: this.normalizeRequiredString(dto.name, 'name'),
      description: this.normalizeOptionalString(dto.description, 'description'),
      status: this.normalizeOptionalStatus(dto.status),
    };
  }

  private normalizeUpdateDto(
    dto: UpdateProductCategoryDto,
  ): UpdateProductCategoryDto {
    return {
      name:
        dto.name === undefined
          ? undefined
          : this.normalizeRequiredString(dto.name, 'name'),
      description: Object.prototype.hasOwnProperty.call(dto, 'description')
        ? this.normalizeOptionalString(dto.description, 'description')
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

  private normalizeOptionalString(value: unknown, field: string): string | null {
    if (value === undefined || value === null) {
      return null;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException(`${field} must be a string or null`);
    }

    return value.trim() || null;
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

    const status = value.trim().toUpperCase();

    if (!STATUSES.includes(status as (typeof STATUSES)[number])) {
      throw new BadRequestException('status must be active or inactive');
    }

    return status;
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
