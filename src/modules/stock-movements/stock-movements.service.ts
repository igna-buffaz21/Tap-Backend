import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { CreateBulkStockMovementDto } from './dto/create-bulk-stock-movement.dto';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import {
  StockMovement,
  StockMovementReason,
  StockMovementType,
} from './entities/stock-movement.entity';
import {
  BulkStockMovementInsufficientStockError,
  BulkStockMovementNoStockChangeError,
  BulkStockMovementPayload,
  StockMovementAccessFilter,
  StockMovementPage,
  StockMovementsRepository,
} from './stock-movements.repository';
import type { RolePermissionAccessScope } from '../auth/interfaces/auth-user.interface';

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedStockMovementsResponse {
  data: StockMovement[];
  pagination: Pagination;
}

interface StockAccess {
  businessId: number;
  accessScope: RolePermissionAccessScope;
  filter?: StockMovementAccessFilter;
}

const MOVEMENT_TYPES = ['IN', 'OUT', 'ADJUSTMENT'] as const;
const BULK_MOVEMENT_TYPES = ['IN', 'OUT'] as const;
const MOVEMENT_REASONS: StockMovementReason[] = [
  'PURCHASE',
  'SALE',
  'SALE_CANCELLATION',
  'INTERNAL_USE',
  'LOSS',
  'DAMAGE',
  'RETURN',
  'MANUAL_ADJUSTMENT',
  'OTHER',
];

@Injectable()
export class StockMovementsService {
  constructor(
    private readonly stockMovementsRepository: StockMovementsRepository,
  ) {}

  async createForBusiness(
    createMovementDto: CreateStockMovementDto,
    currentUser: User,
  ) {
    const access = this.resolveStockAccess(currentUser);
    const dto = this.normalizeCreateDto(createMovementDto);

    await this.assertBranchBelongsToBusiness(
      dto.branch_id,
      access.businessId,
      access.filter,
    );
    await this.assertProductBelongsToBusiness(
      dto.product_id,
      access.businessId,
    );

    const result = await this.stockMovementsRepository.createAndApply(
      access.businessId,
      dto,
      currentUser.id,
    );

    if ('insufficientStock' in result) {
      throw new BadRequestException('Stock cannot be negative');
    }

    if ('noStockChange' in result) {
      throw new BadRequestException('Stock movement must change stock');
    }

    return result.movement;
  }

  async createBulkForBusiness(
    createBulkMovementDto: CreateBulkStockMovementDto,
    currentUser: User,
  ) {
    const access = this.resolveStockAccess(currentUser);
    const payload = this.normalizeBulkCreateDto(createBulkMovementDto);

    await this.assertBranchBelongsToBusiness(
      payload.branch_id,
      access.businessId,
      access.filter,
    );

    for (const productId of new Set(
      payload.items.map((item) => item.product_id),
    )) {
      await this.assertProductBelongsToBusiness(productId, access.businessId);
    }

    try {
      const movements = await this.stockMovementsRepository.createBulkAndApply(
        access.businessId,
        payload,
        currentUser.id,
      );

      return {
        count: movements.length,
        movements,
      };
    } catch (error) {
      if (error instanceof BulkStockMovementInsufficientStockError) {
        throw new BadRequestException(
          `Stock cannot be negative for product ${error.productId}`,
        );
      }

      if (error instanceof BulkStockMovementNoStockChangeError) {
        throw new BadRequestException(
          `Stock movement must change stock for product ${error.productId}`,
        );
      }

      throw error;
    }
  }

  async findAllForBusiness(
    currentUser: User,
    branchIdValue?: unknown,
    productIdValue?: unknown,
    userIdValue?: unknown,
    categoryIdValue?: unknown,
    typeValue?: unknown,
    pageValue?: unknown,
    limitValue?: unknown,
  ) {
    const access = this.resolveStockAccess(currentUser);
    const branchId = this.parseOptionalPositiveInteger(
      branchIdValue,
      'branchId',
    );
    const productId = this.parseOptionalPositiveInteger(
      productIdValue,
      'productId',
    );
    const userId = this.parseOptionalPositiveInteger(userIdValue, 'userId');
    const categoryId = this.parseOptionalPositiveInteger(
      categoryIdValue,
      'categoryId',
    );
    const type = this.normalizeOptionalMovementType(typeValue);
    const { page, limit, offset } = this.parsePagination(
      pageValue,
      limitValue,
      100,
      10,
    );

    if (branchId !== undefined) {
      await this.assertBranchBelongsToBusiness(
        branchId,
        access.businessId,
        access.filter,
      );
    }

    if (productId !== undefined) {
      await this.assertProductBelongsToBusiness(productId, access.businessId);
    }

    if (userId !== undefined) {
      await this.assertUserBelongsToBusiness(userId, access.businessId);
    }

    if (categoryId !== undefined) {
      await this.assertCategoryBelongsToBusiness(categoryId, access.businessId);
    }

    const result = await this.stockMovementsRepository.findAllForBusiness(
      access.businessId,
      {
        branchId,
        productId,
        userId,
        categoryId,
        type,
      },
      { limit, offset },
      access.filter,
    );

    return this.buildPaginatedResponse(result, page, limit);
  }

  async findOneForBusiness(id: number, currentUser: User) {
    const movementId = this.parsePositiveInteger(id, 'id');
    const access = this.resolveStockAccess(currentUser);
    const movement = await this.stockMovementsRepository.findByIdForBusiness(
      movementId,
      access.businessId,
      access.filter,
    );

    if (!movement) {
      throw new NotFoundException('Stock movement not found for business');
    }

    return movement;
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

    const filter =
      accessScope === 'business'
        ? undefined
        : {
            allowedBranchIds: authorization.branchIds,
            createdByUserId: authorization.userId,
            ownOnly: accessScope === 'own',
          };

    return {
      businessId: this.requireBusinessUserBusinessId(authorization.businessId),
      accessScope,
      filter,
    };
  }

  private requireBusinessUserBusinessId(businessId: unknown): number {
    if (businessId === undefined || businessId === null || businessId === '') {
      throw new ForbiddenException('User must belong to a business');
    }

    return this.parsePositiveInteger(businessId, 'businessId');
  }

  private async assertBranchBelongsToBusiness(
    branchIdValue: unknown,
    businessId: number,
    accessFilter?: StockMovementAccessFilter,
  ): Promise<void> {
    const branchId = this.parsePositiveInteger(branchIdValue, 'branch_id');
    const belongs =
      await this.stockMovementsRepository.branchBelongsToBusinessAndAccess(
        branchId,
        businessId,
        accessFilter
          ? { allowedBranchIds: accessFilter.allowedBranchIds }
          : undefined,
      );

    if (!belongs) {
      throw new ForbiddenException('Branch does not belong to business');
    }
  }

  private async assertProductBelongsToBusiness(
    productIdValue: unknown,
    businessId: number,
  ): Promise<void> {
    const productId = this.parsePositiveInteger(productIdValue, 'product_id');
    const belongs =
      await this.stockMovementsRepository.productBelongsToBusiness(
        productId,
        businessId,
      );

    if (!belongs) {
      throw new ForbiddenException('Product does not belong to business');
    }
  }

  private async assertUserBelongsToBusiness(
    userIdValue: unknown,
    businessId: number,
  ): Promise<void> {
    const userId = this.parsePositiveInteger(userIdValue, 'userId');
    const belongs = await this.stockMovementsRepository.userBelongsToBusiness(
      userId,
      businessId,
    );

    if (!belongs) {
      throw new ForbiddenException('User does not belong to business');
    }
  }

  private async assertCategoryBelongsToBusiness(
    categoryIdValue: unknown,
    businessId: number,
  ): Promise<void> {
    const categoryId = this.parsePositiveInteger(categoryIdValue, 'categoryId');
    const belongs =
      await this.stockMovementsRepository.categoryBelongsToBusiness(
        categoryId,
        businessId,
      );

    if (!belongs) {
      throw new ForbiddenException('Category does not belong to business');
    }
  }

  private normalizeCreateDto(
    dto: CreateStockMovementDto,
  ): CreateStockMovementDto {
    if (Object.prototype.hasOwnProperty.call(dto, 'new_quantity')) {
      throw new BadRequestException('new_quantity is calculated by backend');
    }

    const type = this.normalizeMovementType(dto.type);
    const normalizedDto: CreateStockMovementDto = {
      branch_id: this.parsePositiveInteger(dto.branch_id, 'branch_id'),
      product_id: this.parsePositiveInteger(dto.product_id, 'product_id'),
      type,
      reason: this.normalizeOptionalMovementReason(dto.reason),
      notes: this.normalizeOptionalString(dto.notes, 'notes'),
      unit_cost: this.parseOptionalNonNegativeNumber(
        dto.unit_cost,
        'unit_cost',
      ),
    };

    if (type === 'ADJUSTMENT') {
      normalizedDto.quantity = this.parseNonNegativeNumber(
        dto.quantity,
        'quantity',
      );

      return normalizedDto;
    }

    normalizedDto.quantity = this.parsePositiveNumber(dto.quantity, 'quantity');

    return normalizedDto;
  }

  private normalizeBulkCreateDto(
    dto: CreateBulkStockMovementDto,
  ): BulkStockMovementPayload {
    const type = this.normalizeBulkMovementType(dto.type);
    const items = this.normalizeBulkItems(dto.items);

    return {
      branch_id: this.parsePositiveInteger(dto.branchId, 'branchId'),
      type,
      reason: this.normalizeOptionalMovementReason(dto.reason),
      notes: this.normalizeOptionalString(dto.notes, 'notes'),
      items,
    };
  }

  private normalizeBulkItems(
    itemsValue: unknown,
  ): BulkStockMovementPayload['items'] {
    if (!Array.isArray(itemsValue) || itemsValue.length === 0) {
      throw new BadRequestException('items must be a non-empty array');
    }

    return itemsValue.map((item, index) => {
      if (typeof item !== 'object' || item === null) {
        throw new BadRequestException(`items[${index}] must be an object`);
      }

      const values = item as Record<string, unknown>;
      const unitCostValue = Object.prototype.hasOwnProperty.call(
        values,
        'unitCost',
      )
        ? values.unitCost
        : values.unit_cost;

      return {
        product_id: this.parsePositiveInteger(
          values.productId,
          `items[${index}].productId`,
        ),
        quantity: this.parsePositiveNumber(
          values.quantity,
          `items[${index}].quantity`,
        ),
        unit_cost: this.parseOptionalNonNegativeNumber(
          unitCostValue,
          `items[${index}].unitCost`,
        ),
      };
    });
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

  private parseOptionalPositiveInteger(
    value: unknown,
    field: string,
  ): number | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    return this.parsePositiveInteger(value, field);
  }

  private parsePagination(
    pageValue: unknown,
    limitValue: unknown,
    maxLimit: number,
    defaultLimit: number,
  ): { page: number; limit: number; offset: number } {
    const page =
      pageValue === undefined || pageValue === null || pageValue === ''
        ? 1
        : this.parsePositiveInteger(pageValue, 'page');
    const limit =
      limitValue === undefined || limitValue === null || limitValue === ''
        ? defaultLimit
        : this.parsePositiveInteger(limitValue, 'limit');

    if (limit > maxLimit) {
      throw new BadRequestException(
        `limit must be less than or equal to ${maxLimit}`,
      );
    }

    return {
      page,
      limit,
      offset: (page - 1) * limit,
    };
  }

  private buildPaginatedResponse(
    result: StockMovementPage,
    page: number,
    limit: number,
  ): PaginatedStockMovementsResponse {
    return {
      data: result.movements,
      pagination: this.buildPagination(page, limit, result.total),
    };
  }

  private buildPagination(
    page: number,
    limit: number,
    total: number,
  ): Pagination {
    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  private parsePositiveNumber(value: unknown, field: string): number {
    const parsed = Number(value);

    if (
      value === undefined ||
      value === null ||
      value === '' ||
      !Number.isFinite(parsed) ||
      parsed <= 0
    ) {
      throw new BadRequestException(`${field} must be a positive number`);
    }

    return parsed;
  }

  private parseNonNegativeNumber(value: unknown, field: string): number {
    const parsed = Number(value);

    if (
      value === undefined ||
      value === null ||
      value === '' ||
      !Number.isFinite(parsed) ||
      parsed < 0
    ) {
      throw new BadRequestException(`${field} must be a non-negative number`);
    }

    return parsed;
  }

  private parseOptionalNonNegativeNumber(
    value: unknown,
    field: string,
  ): number | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    return this.parseNonNegativeNumber(value, field);
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

  private normalizeMovementType(value: unknown): 'IN' | 'OUT' | 'ADJUSTMENT' {
    if (typeof value !== 'string') {
      throw new BadRequestException('type must be a string');
    }

    const type = value.trim().toUpperCase();

    if (!MOVEMENT_TYPES.includes(type as (typeof MOVEMENT_TYPES)[number])) {
      throw new BadRequestException('type must be IN, OUT or ADJUSTMENT');
    }

    return type as 'IN' | 'OUT' | 'ADJUSTMENT';
  }

  private normalizeOptionalMovementType(
    value: unknown,
  ): StockMovementType | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    return this.normalizeMovementType(value);
  }

  private normalizeBulkMovementType(value: unknown): 'IN' | 'OUT' {
    if (typeof value !== 'string') {
      throw new BadRequestException('type must be a string');
    }

    const type = value.trim().toUpperCase();

    if (
      !BULK_MOVEMENT_TYPES.includes(
        type as (typeof BULK_MOVEMENT_TYPES)[number],
      )
    ) {
      throw new BadRequestException('type must be IN or OUT');
    }

    return type as 'IN' | 'OUT';
  }

  private normalizeOptionalMovementReason(
    value: unknown,
  ): StockMovementReason | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException('reason must be a string or null');
    }

    const reason = value.trim().toUpperCase();

    if (!MOVEMENT_REASONS.includes(reason as StockMovementReason)) {
      throw new BadRequestException('Invalid stock movement reason');
    }

    return reason as StockMovementReason;
  }
}
