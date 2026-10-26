import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { ProductStockStats } from './entities/product-stock-stats.entity';
import { ProductStock } from './entities/product-stock.entity';

const TABLE_NAME = 'product_stock';

type ProductStockRow = Omit<ProductStock, 'quantity' | 'minimum_quantity'> & {
  quantity: number | string;
  minimum_quantity: number | string;
};

type ProductStockStatsRow = {
  total_products: number | string;
  low_stock_products: number | string;
  out_of_stock_products: number | string;
  stock_value: number | string;
  sale_value: number | string;
};

export interface ProductStockAccessFilter {
  allowedBranchIds?: number[];
}

@Injectable()
export class ProductStocksRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAllForBusiness(
    businessId: number,
    branchId?: number,
    productId?: number,
    accessFilter?: ProductStockAccessFilter,
  ): Promise<ProductStock[]> {
    const values: unknown[] = [businessId];
    const filters: string[] = ['business_id = $1'];

    if (branchId !== undefined) {
      values.push(branchId);
      filters.push('branch_id = $' + values.length);
    }

    if (productId !== undefined) {
      values.push(productId);
      filters.push('product_id = $' + values.length);
    }

    this.applyAllowedBranchFilter(filters, values, accessFilter);

    const result = await this.databaseService.query<ProductStockRow>(
      `
        SELECT *
        FROM ${TABLE_NAME}
        WHERE ${filters.join(' AND ')}
        ORDER BY branch_id ASC, product_id ASC, id ASC
      `,
      values,
    );

    return result.rows.map((row) => this.mapProductStock(row));
  }

  async getStatsForBusiness(
    businessId: number,
    branchId?: number,
    accessFilter?: ProductStockAccessFilter,
  ): Promise<ProductStockStats> {
    const values: unknown[] = [businessId];
    let stockBranchFilter = '';

    if (branchId !== undefined) {
      values.push(branchId);
      stockBranchFilter = 'AND ps.branch_id = $' + values.length;
    } else if (accessFilter?.allowedBranchIds !== undefined) {
      if (accessFilter.allowedBranchIds.length === 0) {
        stockBranchFilter = 'AND FALSE';
      } else {
        values.push(accessFilter.allowedBranchIds);
        stockBranchFilter = `AND ps.branch_id = ANY($${values.length}::bigint[])`;
      }
    }

    const result = await this.databaseService.query<ProductStockStatsRow>(
      `
        WITH product_totals AS (
          SELECT
            p.id,
            COALESCE(SUM(ps.quantity), 0) AS quantity,
            COALESCE(SUM(ps.minimum_quantity), 0) AS minimum_quantity,
            COALESCE(p.cost_price, 0) AS cost_price,
            COALESCE(p.sale_price, 0) AS sale_price
          FROM product p
          LEFT JOIN product_stock ps
            ON ps.product_id = p.id
            AND ps.business_id = p.business_id
            ${stockBranchFilter}
          WHERE p.business_id = $1
          GROUP BY p.id, p.cost_price, p.sale_price
        )
        SELECT
          COUNT(*) AS total_products,
          COUNT(*) FILTER (
            WHERE quantity > 0
              AND quantity <= minimum_quantity
          ) AS low_stock_products,
          COUNT(*) FILTER (WHERE quantity = 0) AS out_of_stock_products,
          COALESCE(SUM(quantity * cost_price), 0) AS stock_value,
          COALESCE(SUM(quantity * sale_price), 0) AS sale_value
        FROM product_totals
      `,
      values,
    );

    return this.mapProductStockStats(result.rows[0]);
  }

  async findByIdForBusiness(
    id: number,
    businessId: number,
    accessFilter?: ProductStockAccessFilter,
  ): Promise<ProductStock | null> {
    const values: unknown[] = [id, businessId];
    const filters = ['id = $1', 'business_id = $2'];

    this.applyAllowedBranchFilter(filters, values, accessFilter);

    const result = await this.databaseService.query<ProductStockRow>(
      `
        SELECT *
        FROM ${TABLE_NAME}
        WHERE ${filters.join(' AND ')}
      `,
      values,
    );

    return result.rows[0] ? this.mapProductStock(result.rows[0]) : null;
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
    accessFilter?: ProductStockAccessFilter,
  ): Promise<boolean> {
    const values: unknown[] = [branchId, businessId];
    const filters = ['id = $1', 'business_id = $2'];

    this.applyAllowedBranchFilter(filters, values, accessFilter, 'id');

    const result = await this.databaseService.query(
      `
        SELECT 1
        FROM branch
        WHERE ${filters.join(' AND ')}
        LIMIT 1
      `,
      values,
    );

    return result.rowCount === 1;
  }

  async productBelongsToBusiness(
    productId: number,
    businessId: number,
  ): Promise<boolean> {
    const result = await this.databaseService.query(
      `
        SELECT 1
        FROM product
        WHERE id = $1
          AND business_id = $2
        LIMIT 1
      `,
      [productId, businessId],
    );

    return result.rowCount === 1;
  }

  private mapProductStock(row: ProductStockRow): ProductStock {
    return {
      ...row,
      quantity: Number(row.quantity),
      minimum_quantity: Number(row.minimum_quantity),
    };
  }

  private mapProductStockStats(row: ProductStockStatsRow): ProductStockStats {
    return {
      total_products: Number(row.total_products),
      low_stock_products: Number(row.low_stock_products),
      out_of_stock_products: Number(row.out_of_stock_products),
      stock_value: Number(row.stock_value),
      sale_value: Number(row.sale_value),
    };
  }

  private applyAllowedBranchFilter(
    filters: string[],
    values: unknown[],
    accessFilter?: ProductStockAccessFilter,
    branchColumn = 'branch_id',
  ): void {
    if (accessFilter?.allowedBranchIds === undefined) {
      return;
    }

    if (accessFilter.allowedBranchIds.length === 0) {
      filters.push('FALSE');
      return;
    }

    values.push(accessFilter.allowedBranchIds);
    filters.push(`${branchColumn} = ANY($${values.length}::bigint[])`);
  }
}
