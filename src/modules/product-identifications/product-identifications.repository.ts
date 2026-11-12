import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateProductIdentificationDto } from './types/dto/create-product-identification.dto';
import { FindProductIdentificationsDto } from './types/dto/find-product-identifications.dto';
import { UpdateProductIdentificationDto } from './types/dto/update-product-identification.dto';
import type {
  IdentifiedProduct,
  ProductIdentification,
} from './types/product-identification.types';

@Injectable()
export class ProductIdentificationsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findProductsByRfidValuesForBusiness(
    businessId: number,
    values: string[],
  ): Promise<IdentifiedProduct[]> {
    const result = await this.databaseService.query<IdentifiedProduct>(
      `SELECT i.value AS identification_value, p.*
       FROM product_identification i
       JOIN product p ON p.id = i.product_id AND p.business_id = i.business_id
       WHERE i.business_id = $1 AND i.type = 'RFID_UHF'
         AND i.value = ANY($2::varchar[])`,
      [businessId, values],
    );
    return result.rows;
  }

  async createForBusiness(
    businessId: number,
    dto: CreateProductIdentificationDto,
  ) {
    // Validate ownership in the same statement that assigns the identifier.
    const result = await this.databaseService.query<ProductIdentification>(
      `INSERT INTO product_identification (business_id, product_id, type, value)
       SELECT p.business_id, p.id, $3, $4
       FROM product p
       WHERE p.business_id = $1 AND p.id = $2
       RETURNING *`,
      [businessId, dto.product_id, dto.type, dto.value],
    );
    return result.rows[0] ?? null;
  }

  async findAllForBusiness(
    businessId: number,
    filters: FindProductIdentificationsDto,
  ) {
    const result = await this.databaseService.query<ProductIdentification>(
      `SELECT i.* FROM product_identification i
       JOIN product p ON p.id = i.product_id AND p.business_id = i.business_id
       WHERE i.business_id = $1
         AND ($2::bigint IS NULL OR i.product_id = $2)
         AND ($3::varchar IS NULL OR i.type = $3)
         AND ($4::varchar IS NULL OR i.value = $4)
       ORDER BY i.id ASC`,
      [
        businessId,
        filters.product_id ?? null,
        filters.type ?? null,
        filters.value ?? null,
      ],
    );
    return result.rows;
  }

  async findByIdForBusiness(id: number, businessId: number) {
    const result = await this.databaseService.query<ProductIdentification>(
      `SELECT i.* FROM product_identification i
       JOIN product p ON p.id = i.product_id AND p.business_id = i.business_id
       WHERE i.id = $1 AND i.business_id = $2`,
      [id, businessId],
    );
    return result.rows[0] ?? null;
  }

  async updateForBusiness(
    id: number,
    businessId: number,
    dto: UpdateProductIdentificationDto,
    current: Pick<ProductIdentification, 'type' | 'value'>,
  ) {
    const result = await this.databaseService.query<ProductIdentification>(
      `UPDATE product_identification i
       SET product_id = COALESCE($3::bigint, i.product_id),
           type = COALESCE($4::varchar, i.type),
           value = COALESCE($5::varchar, i.value)
       FROM product p
       WHERE i.id = $1 AND i.business_id = $2
         AND i.type = $6 AND i.value = $7
         AND p.id = i.product_id AND p.business_id = i.business_id
         AND EXISTS (
           SELECT 1 FROM product target
           WHERE target.id = COALESCE($3::bigint, i.product_id)
             AND target.business_id = $2
         )
       RETURNING i.*`,
      [
        id,
        businessId,
        dto.product_id ?? null,
        dto.type ?? null,
        dto.value ?? null,
        current.type,
        current.value,
      ],
    );
    return result.rows[0] ?? null;
  }

  async removeForBusiness(id: number, businessId: number) {
    const result = await this.databaseService.query(
      `DELETE FROM product_identification i USING product p
       WHERE i.id = $1 AND i.business_id = $2
         AND p.id = i.product_id AND p.business_id = i.business_id
       RETURNING i.id`,
      [id, businessId],
    );
    return result.rowCount === 1;
  }
}
