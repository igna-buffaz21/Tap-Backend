import { Injectable } from '@nestjs/common';
import { QueryResult, QueryResultRow } from 'pg';
import { buildUpdateQuery } from '../../common/utils/sql-query-builder';
import { DatabaseService } from '../../database/database.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductStatusDto } from './dto/update-product-status.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';

const PRODUCT_TABLE = 'product';
const PRODUCT_STOCK_TABLE = 'product_stock';
const UPDATE_COLUMNS = [
  'category_id',
  'name',
  'description',
  'sku',
  'unit',
  'cost_price',
  'sale_price',
  'status',
] as const;

type ProductRow = Omit<Product, 'cost_price' | 'sale_price'> & {
  cost_price: number | string | null;
  sale_price: number | string | null;
};

interface QueryExecutor {
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: unknown[],
  ): Promise<QueryResult<T>>;
}

export interface ProductAccessFilter {
  allowedBranchIds?: number[];
}

@Injectable()
export class ProductsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(businessId: number, dto: CreateProductDto): Promise<Product> {
    return this.databaseService.withTransaction(async (client) => {
      const product = await this.createProduct(client, businessId, dto);

      if (dto.branch_id !== undefined) {
        await this.createProductStock(
          client,
          businessId,
          dto.branch_id,
          product.id,
          dto.minimum_quantity ?? 0,
        );
      }

      return product;
    });
  }

  async findAllForBusiness(businessId: number): Promise<Product[]> {
    const result = await this.databaseService.query<ProductRow>(
      `
        SELECT *
        FROM ${PRODUCT_TABLE}
        WHERE business_id = $1
        ORDER BY name ASC, id ASC
      `,
      [businessId],
    );

    return result.rows.map((row) => this.mapProduct(row));
  }

  async findByIdForBusiness(
    id: number,
    businessId: number,
  ): Promise<Product | null> {
    const result = await this.databaseService.query<ProductRow>(
      `
        SELECT *
        FROM ${PRODUCT_TABLE}
        WHERE id = $1
          AND business_id = $2
      `,
      [id, businessId],
    );

    return result.rows[0] ? this.mapProduct(result.rows[0]) : null;
  }

  async updateForBusiness(
    id: number,
    businessId: number,
    dto: UpdateProductDto | UpdateProductStatusDto,
  ): Promise<Product | null> {
    const builtQuery = buildUpdateQuery(PRODUCT_TABLE, dto, UPDATE_COLUMNS, id);

    if (!builtQuery) {
      return this.findByIdForBusiness(id, businessId);
    }

    builtQuery.query = builtQuery.query.replace(
      'WHERE id = $' + builtQuery.values.length,
      'WHERE id = $' +
        builtQuery.values.length +
        ' AND business_id = $' +
        (builtQuery.values.length + 1),
    );
    builtQuery.values.push(businessId);

    const result = await this.databaseService.query<ProductRow>(
      builtQuery.query,
      builtQuery.values,
    );

    return result.rows[0] ? this.mapProduct(result.rows[0]) : null;
  }

  async categoryBelongsToBusiness(
    categoryId: number,
    businessId: number,
  ): Promise<boolean> {
    const result = await this.databaseService.query(
      `
        SELECT 1
        FROM product_category
        WHERE id = $1
          AND business_id = $2
        LIMIT 1
      `,
      [categoryId, businessId],
    );

    return result.rowCount === 1;
  }

  async branchBelongsToBusiness(
    branchId: number,
    businessId: number,
  ): Promise<boolean> {
    const result = await this.databaseService.query(
      `
        SELECT 1
        FROM branch
        WHERE id = $1
          AND business_id = $2
        LIMIT 1
      `,
      [branchId, businessId],
    );

    return result.rowCount === 1;
  }

  async branchBelongsToBusinessAndAccess(
    branchId: number,
    businessId: number,
    accessFilter?: ProductAccessFilter,
  ): Promise<boolean> {
    const values: unknown[] = [branchId, businessId];
    const branchCondition = this.buildBranchAccessCondition(
      'id',
      values,
      accessFilter?.allowedBranchIds,
    );
    const result = await this.databaseService.query(
      `
        SELECT 1
        FROM branch
        WHERE id = $1
          AND business_id = $2
          ${branchCondition}
        LIMIT 1
      `,
      values,
    );

    return result.rowCount === 1;
  }

  private async createProduct(
    executor: QueryExecutor,
    businessId: number,
    dto: CreateProductDto,
  ): Promise<Product> {
    const result = await executor.query<ProductRow>(
      `
        INSERT INTO ${PRODUCT_TABLE} (
          business_id,
          category_id,
          name,
          description,
          sku,
          unit,
          cost_price,
          sale_price,
          status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `,
      [
        businessId,
        dto.category_id ?? null,
        dto.name,
        dto.description ?? null,
        dto.sku ?? null,
        dto.unit ?? 'unit',
        dto.cost_price ?? null,
        dto.sale_price ?? null,
        dto.status ?? 'ACTIVE',
      ],
    );

    return this.mapProduct(result.rows[0]);
  }

  private async createProductStock(
    executor: QueryExecutor,
    businessId: number,
    branchId: number,
    productId: number,
    minimumQuantity: number,
  ): Promise<void> {
    await executor.query(
      `
        INSERT INTO ${PRODUCT_STOCK_TABLE} (
          business_id,
          branch_id,
          product_id,
          quantity,
          minimum_quantity
        )
        VALUES ($1, $2, $3, 0, $4)
      `,
      [businessId, branchId, productId, minimumQuantity],
    );
  }

  private mapProduct(row: ProductRow): Product {
    return {
      ...row,
      cost_price: row.cost_price === null ? null : Number(row.cost_price),
      sale_price: row.sale_price === null ? null : Number(row.sale_price),
    };
  }

  private buildBranchAccessCondition(
    branchIdExpression: string,
    values: unknown[],
    allowedBranchIds?: number[],
  ): string {
    if (allowedBranchIds === undefined) {
      return '';
    }

    if (allowedBranchIds.length === 0) {
      return 'AND FALSE';
    }

    values.push(allowedBranchIds);

    return `AND ${branchIdExpression} = ANY($${values.length}::bigint[])`;
  }
}
