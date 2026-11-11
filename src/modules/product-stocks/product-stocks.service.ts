import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import {
  ProductStockAccessFilter,
  ProductStocksRepository,
} from './product-stocks.repository';

interface StockAccess {
  businessId: number;
  filter?: ProductStockAccessFilter;
}

@Injectable()
export class ProductStocksService {
  constructor(
    private readonly productStocksRepository: ProductStocksRepository,
  ) {}

  async findAllForBusiness(
    currentUser: User,
    branchIdValue?: unknown,
    productIdValue?: unknown,
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

    return this.productStocksRepository.findAllForBusiness(
      access.businessId,
      branchId,
      productId,
      access.filter,
    );
  }

  async getStatsForBusiness(currentUser: User, branchIdValue?: unknown) {
    const access = this.resolveStockAccess(currentUser);
    const branchId = this.parseOptionalPositiveInteger(
      branchIdValue,
      'branchId',
    );

    if (branchId !== undefined) {
      await this.assertBranchBelongsToBusiness(
        branchId,
        access.businessId,
        access.filter,
      );
    }

    return this.productStocksRepository.getStatsForBusiness(
      access.businessId,
      branchId,
      access.filter,
    );
  }

  async findOneForBusiness(id: number, currentUser: User) {
    const productStockId = this.parsePositiveInteger(id, 'id');
    const access = this.resolveStockAccess(currentUser);
    const productStock = await this.productStocksRepository.findByIdForBusiness(
      productStockId,
      access.businessId,
      access.filter,
    );

    if (!productStock) {
      throw new NotFoundException('Product stock not found for business');
    }

    return productStock;
  }

  private resolveStockAccess(currentUser: User): StockAccess {
    const authorization = currentUser.authorization;

    if (!authorization) {
      throw new ForbiddenException('Authorization context is required');
    }

    return {
      businessId: this.requireBusinessUserBusinessId(authorization.businessId),
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
    accessFilter?: ProductStockAccessFilter,
  ): Promise<void> {
    const branchId = this.parsePositiveInteger(branchIdValue, 'branch_id');
    const belongs =
      await this.productStocksRepository.branchBelongsToBusinessAndAccess(
        branchId,
        businessId,
        accessFilter,
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
    const belongs = await this.productStocksRepository.productBelongsToBusiness(
      productId,
      businessId,
    );

    if (!belongs) {
      throw new ForbiddenException('Product does not belong to business');
    }
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
}
