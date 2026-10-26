import { Injectable } from '@nestjs/common';
import { QueryResult, QueryResultRow } from 'pg';
import { SaleItem } from './entities/sale-item.entity';

interface QueryExecutor {
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: unknown[],
  ): Promise<QueryResult<T>>;
}

export interface CreateSaleItemRecord {
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

type SaleItemRow = Omit<SaleItem, 'quantity' | 'unit_price' | 'subtotal'> & {
  quantity: number | string;
  unit_price: number | string;
  subtotal: number | string;
};

@Injectable()
export class SaleItemsRepository {
  async createMany(
    executor: QueryExecutor,
    saleId: number,
    items: CreateSaleItemRecord[],
  ): Promise<SaleItem[]> {
    const result: SaleItem[] = [];

    for (const item of items) {
      const inserted = await executor.query<SaleItemRow>(
        `
          INSERT INTO sale_item (
            sale_id,
            product_id,
            quantity,
            unit_price,
            subtotal
          )
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `,
        [
          saleId,
          item.product_id,
          item.quantity,
          item.unit_price,
          item.subtotal,
        ],
      );

      result.push(this.mapSaleItem(inserted.rows[0]));
    }

    return result;
  }

  private mapSaleItem(row: SaleItemRow): SaleItem {
    return {
      ...row,
      quantity: Number(row.quantity),
      unit_price: Number(row.unit_price),
      subtotal: Number(row.subtotal),
    };
  }
}
