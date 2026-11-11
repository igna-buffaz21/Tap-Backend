import { Injectable } from '@nestjs/common';
import { buildUpdateQuery } from '../../common/utils/sql-query-builder';
import { DatabaseService } from '../../database/database.service';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryStatusDto } from './dto/update-product-category-status.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { ProductCategory } from './entities/product-category.entity';

const TABLE_NAME = 'product_category';
const UPDATE_COLUMNS = ['name', 'description', 'status'] as const;

@Injectable()
export class ProductCategoriesRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(
    businessId: number,
    dto: CreateProductCategoryDto,
  ): Promise<ProductCategory> {
    const result = await this.databaseService.query<ProductCategory>(
      `
        INSERT INTO ${TABLE_NAME} (
          business_id,
          name,
          description,
          status
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `,
      [businessId, dto.name, dto.description ?? null, dto.status ?? 'ACTIVE'],
    );

    return result.rows[0];
  }

  async findAllForBusiness(businessId: number): Promise<ProductCategory[]> {
    const result = await this.databaseService.query<ProductCategory>(
      `
        SELECT *
        FROM ${TABLE_NAME}
        WHERE business_id = $1
        ORDER BY name ASC, id ASC
      `,
      [businessId],
    );

    return result.rows;
  }

  async findByIdForBusiness(
    id: number,
    businessId: number,
  ): Promise<ProductCategory | null> {
    const result = await this.databaseService.query<ProductCategory>(
      `
        SELECT *
        FROM ${TABLE_NAME}
        WHERE id = $1
          AND business_id = $2
      `,
      [id, businessId],
    );

    return result.rows[0] ?? null;
  }

  async updateForBusiness(
    id: number,
    businessId: number,
    dto: UpdateProductCategoryDto | UpdateProductCategoryStatusDto,
  ): Promise<ProductCategory | null> {
    const builtQuery = buildUpdateQuery(TABLE_NAME, dto, UPDATE_COLUMNS, id);

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

    const result = await this.databaseService.query<ProductCategory>(
      builtQuery.query,
      builtQuery.values,
    );

    return result.rows[0] ?? null;
  }

}
