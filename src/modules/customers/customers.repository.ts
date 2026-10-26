import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { buildUpdateQuery } from '../../common/utils/sql-query-builder';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer, CustomerStatus } from './entities/customer.entity';

@Injectable()
export class CustomersRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(businessId: number, dto: CreateCustomerDto): Promise<Customer> {
    const result = await this.databaseService.query<Customer>(
      'INSERT INTO customer (business_id, name, phone, email) VALUES ($1, $2, $3, $4) RETURNING *',
      [businessId, dto.name, dto.phone, dto.email],
    );
    return result.rows[0];
  }

  async businessExists(businessId: number): Promise<boolean> {
    const result = await this.databaseService.query(
      'SELECT 1 FROM business WHERE id = $1',
      [businessId],
    );
    return result.rowCount === 1;
  }

  async getStatsForBusiness(businessId: number) {
    const result = await this.databaseService.query<{
      total_customers: string;
      new_customers_this_month: string;
    }>(
      `SELECT COUNT(*) AS total_customers,
       COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW())) AS new_customers_this_month
       FROM customer WHERE business_id = $1 AND status = 'ACTIVE'`,
      [businessId],
    );
    return result.rows[0];
  }

  async findPageForBusiness(
    businessId: number,
    limit: number,
    offset: number,
    search: string | null,
    status: CustomerStatus,
  ) {
    const conditions =
      'business_id = $1 AND status = $2 AND ($3::text IS NULL OR name ILIKE $3 OR email ILIKE $3 OR phone ILIKE $3)';
    const values = [businessId, status, search];
    const count = await this.databaseService.query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM customer WHERE ${conditions}`,
      values,
    );
    const result = await this.databaseService.query<Customer>(
      `SELECT * FROM customer WHERE ${conditions} ORDER BY name ASC, id ASC LIMIT $4 OFFSET $5`,
      [...values, limit, offset],
    );
    return { data: result.rows, total: Number(count.rows[0].total) };
  }

  async findByIdForBusiness(
    id: number,
    businessId: number,
  ): Promise<Customer | null> {
    const result = await this.databaseService.query<Customer>(
      'SELECT * FROM customer WHERE id = $1 AND business_id = $2',
      [id, businessId],
    );
    return result.rows[0] ?? null;
  }

  async findByPhonesForBusiness(
    phones: string[],
    businessId: number,
  ): Promise<Customer | null> {
    const result = await this.databaseService.query<Customer>(
      'SELECT * FROM customer WHERE business_id = $1 AND phone = ANY($2::text[]) ORDER BY id LIMIT 1',
      [businessId, phones],
    );
    return result.rows[0] ?? null;
  }

  async updateForBusiness(
    id: number,
    businessId: number,
    dto: UpdateCustomerDto,
  ): Promise<Customer | null> {
    const built = buildUpdateQuery(
      'customer',
      dto,
      ['name', 'phone', 'email'],
      id,
    );
    if (!built) return this.findByIdForBusiness(id, businessId);
    built.query = built.query.replace(
      'WHERE id = $' + built.values.length,
      'WHERE id = $' +
        built.values.length +
        ' AND business_id = $' +
        (built.values.length + 1),
    );
    built.values.push(businessId);
    const result = await this.databaseService.query<Customer>(
      built.query,
      built.values,
    );
    return result.rows[0] ?? null;
  }

  async updateStatusForBusiness(
    id: number,
    businessId: number,
    status: CustomerStatus,
  ): Promise<Customer | null> {
    const result = await this.databaseService.query<Customer>(
      'UPDATE customer SET status = $3, updated_at = NOW() WHERE id = $1 AND business_id = $2 RETURNING *',
      [id, businessId, status],
    );
    return result.rows[0] ?? null;
  }
}
