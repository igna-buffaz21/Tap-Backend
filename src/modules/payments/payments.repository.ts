import { Injectable } from '@nestjs/common';
import type { PoolClient } from 'pg';
import { DatabaseService } from '../../database/database.service';
import { Payment } from './entities/payment.entity';

export interface PaymentAccessFilter {
  allowedBranchIds?: number[];
  createdByUserId?: number;
}
export interface PaymentAccess {
  businessId: number;
  userId: number;
  filter: PaymentAccessFilter;
}
export interface PaymentTarget {
  sale_id: number;
}
export interface PaymentTargetSummary {
  total_price: number;
  status: string;
}
export interface PaymentRecord extends PaymentTarget {
  amount: number;
  status: string;
}
export interface PaymentTransaction {
  lockTarget(target: PaymentTarget): Promise<PaymentTargetSummary | null>;
  paidAmount(target: PaymentTarget): Promise<number>;
  findPayment(id: number): Promise<Payment | null>;
  insert(record: PaymentRecord): Promise<Payment>;
  update(id: number, amount: number, status: string): Promise<Payment>;
  remove(id: number): Promise<boolean>;
}

const PAYMENT_SELECT = `SELECT p.* FROM payment p INNER JOIN sale s ON s.id = p.sale_id`;

@Injectable()
export class PaymentsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  withTransaction<T>(
    access: PaymentAccess,
    work: (transaction: PaymentTransaction) => Promise<T>,
  ): Promise<T> {
    return this.databaseService.withTransaction((client) =>
      work(this.inTransaction(client, access)),
    );
  }

  inTransaction(client: PoolClient, access: PaymentAccess): PaymentTransaction {
    return {
      lockTarget: (target) => this.lockTarget(client, access, target),
      paidAmount: (target) => this.paidAmount(client, access, target),
      findPayment: (id) =>
        this.findPayment(access.businessId, access.filter, id, client),
      insert: (record) => this.insert(client, access, record),
      update: (id, amount, status) =>
        this.update(client, access, id, amount, status),
      remove: (id) => this.remove(client, access, id),
    };
  }

  async findAllForBusiness(
    businessId: number,
    accessFilter?: PaymentAccessFilter,
  ): Promise<Payment[]> {
    const { conditions, values } = this.paymentConditions(
      businessId,
      accessFilter,
    );
    const result = await this.databaseService.query<Payment>(
      `${PAYMENT_SELECT} WHERE ${conditions.join(' AND ')} ORDER BY p.id ASC`,
      values,
    );
    return result.rows.map((row) => this.mapPayment(row));
  }

  findByIdForBusiness(
    id: number,
    businessId: number,
    accessFilter?: PaymentAccessFilter,
  ): Promise<Payment | null> {
    return this.findPayment(businessId, accessFilter, id);
  }

  private async findPayment(
    businessId: number,
    accessFilter: PaymentAccessFilter | undefined,
    id: number,
    client?: PoolClient,
  ): Promise<Payment | null> {
    const { conditions, values } = this.paymentConditions(
      businessId,
      accessFilter,
    );
    values.push(id);
    conditions.push(`p.id = $${values.length}`);
    const query = `${PAYMENT_SELECT} WHERE ${conditions.join(' AND ')} ${client ? 'FOR UPDATE OF p' : ''}`;
    const result = client
      ? await client.query<Payment>(query, values)
      : await this.databaseService.query<Payment>(query, values);
    return result.rows[0] ? this.mapPayment(result.rows[0]) : null;
  }

  private async lockTarget(
    client: PoolClient,
    access: PaymentAccess,
    target: PaymentTarget,
  ): Promise<PaymentTargetSummary | null> {
    const { conditions, values } = this.paymentConditions(
      access.businessId,
      access.filter,
    );
    values.push(target.sale_id);
    conditions.push('s.id = $' + values.length);
    const result = await client.query<PaymentTargetSummary>(
      'SELECT s.total_amount AS total_price, s.status FROM sale s WHERE ' +
        conditions.join(' AND ') +
        ' FOR UPDATE OF s',
      values,
    );
    const row = result.rows[0];
    return row ? { ...row, total_price: Number(row.total_price) } : null;
  }

  private async paidAmount(
    client: PoolClient,
    access: PaymentAccess,
    target: PaymentTarget,
  ): Promise<number> {
    const { conditions, values } = this.paymentConditions(
      access.businessId,
      access.filter,
    );
    values.push(target.sale_id);
    conditions.push('s.id = $' + values.length);
    const result = await client.query<{ amount: string }>(
      'SELECT COALESCE(SUM(p.amount), 0) AS amount FROM payment p INNER JOIN sale s ON s.id = p.sale_id WHERE ' +
        conditions.join(' AND ') +
        " AND p.status = 'COMPLETED'",
      values,
    );
    return Number(result.rows[0].amount);
  }

  private async insert(
    client: PoolClient,
    access: PaymentAccess,
    record: PaymentRecord,
  ): Promise<Payment> {
    const { conditions, values } = this.paymentConditions(
      access.businessId,
      access.filter,
    );
    values.push(record.sale_id);
    conditions.push('s.id = $' + values.length);
    values.push(record.amount, record.status);
    const result = await client.query<Payment>(
      'INSERT INTO payment (sale_id, amount, status) SELECT s.id, $' +
        (values.length - 1) +
        ', $' +
        values.length +
        ' FROM sale s WHERE ' +
        conditions.join(' AND ') +
        ' RETURNING *',
      values,
    );
    return this.mapPayment(result.rows[0]);
  }

  private async update(
    client: PoolClient,
    access: PaymentAccess,
    id: number,
    amount: number,
    status: string,
  ): Promise<Payment> {
    const { conditions, values } = this.paymentConditions(
      access.businessId,
      access.filter,
    );
    values.push(id);
    conditions.push(`p.id = $${values.length}`);
    values.push(amount, status);
    const result = await client.query<Payment>(
      `UPDATE payment SET amount = $${values.length - 1}, status = $${values.length}, updated_at = NOW()
       WHERE id IN (SELECT p.id FROM payment p
         INNER JOIN sale s ON s.id = p.sale_id
         WHERE ${conditions.join(' AND ')})
       RETURNING id, sale_id, amount, status, created_at, updated_at`,
      values,
    );
    return this.mapPayment(result.rows[0]);
  }

  private async remove(
    client: PoolClient,
    access: PaymentAccess,
    id: number,
  ): Promise<boolean> {
    const { conditions, values } = this.paymentConditions(
      access.businessId,
      access.filter,
    );
    values.push(id);
    conditions.push(`p.id = $${values.length}`);
    const result = await client.query(
      `DELETE FROM payment WHERE id IN (SELECT p.id FROM payment p
         INNER JOIN sale s ON s.id = p.sale_id
         WHERE ${conditions.join(' AND ')})`,
      values,
    );
    return result.rowCount === 1;
  }

  private paymentConditions(
    businessId: number,
    accessFilter?: PaymentAccessFilter,
  ) {
    const values: unknown[] = [businessId];
    const conditions = ['s.business_id = $1'];
    if (accessFilter?.allowedBranchIds !== undefined) {
      values.push(accessFilter.allowedBranchIds);
      conditions.push(`s.branch_id = ANY($${values.length}::bigint[])`);
    }
    if (accessFilter?.createdByUserId !== undefined) {
      values.push(accessFilter.createdByUserId);
      conditions.push(`s.created_by = $${values.length}`);
    }
    return { conditions, values };
  }

  private mapPayment(row: Payment): Payment {
    return {
      ...row,
      id: Number(row.id),
      sale_id: Number(row.sale_id),
      amount: Number(row.amount),
    };
  }
}
