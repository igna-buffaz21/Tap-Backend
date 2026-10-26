import { Injectable } from '@nestjs/common';
import { QueryResult, QueryResultRow } from 'pg';
import type { PoolClient } from 'pg';
import { DatabaseService } from '../../database/database.service';
import {
  CreateSaleItemRecord,
  SaleItemsRepository,
} from '../sale-items/sale-items.repository';
import {
  SaleStockAvailabilityItem,
  StockMovementsRepository,
} from '../stock-movements/stock-movements.repository';
import { Sale } from './entities/sale.entity';

interface QueryExecutor {
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: unknown[],
  ): Promise<QueryResult<T>>;
}

export interface SaleAccessFilter {
  allowedBranchIds?: number[];
  createdByUserId?: number;
}

export interface SalePagination {
  limit: number;
  offset: number;
}

export interface SalePage {
  sales: Array<Omit<Sale, 'items'> & { created_by_user_name: string | null }>;
  total: number;
}

export interface CreateSaleRecord {
  branch_id: number;
  customer_id: number | null;
  discount_amount: number;
  notes: string | null;
  items: CreateSaleItemRecord[];
}

export interface SaleProductPrice {
  id: number;
  sale_price: number | null;
}

export class SaleInsufficientStockError extends Error {
  constructor(
    readonly productId: number,
    readonly availableQuantity: number,
    readonly requestedQuantity: number,
  ) {
    super('Insufficient stock for sale');
  }
}

export type CancelSaleResult =
  | { status: 'not_found' }
  | { status: 'already_cancelled' }
  | { status: 'cancelled'; sale: Sale };

type SaleRow = Omit<
  Sale,
  'subtotal' | 'discount_amount' | 'total_amount' | 'items'
> & {
  subtotal: number | string;
  discount_amount: number | string;
  total_amount: number | string;
};

@Injectable()
export class SalesRepository {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly saleItemsRepository: SaleItemsRepository,
    private readonly stockMovementsRepository: StockMovementsRepository,
  ) {}

  withTransaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
    return this.databaseService.withTransaction(work);
  }

  async findBranchStockSettings(
    client: PoolClient,
    branchId: number,
    businessId: number,
  ) {
    const result = await client.query<{ sales_stock_enabled: boolean }>(
      `SELECT sales_stock_enabled FROM branch
       WHERE id = $1 AND business_id = $2 FOR SHARE`,
      [branchId, businessId],
    );
    return result.rows[0] ?? null;
  }

  validateStock(
    client: PoolClient,
    businessId: number,
    branchId: number,
    items: SaleStockAvailabilityItem[],
  ) {
    return this.stockMovementsRepository.validateSaleStockAvailabilityInTransaction(
      client,
      businessId,
      branchId,
      items,
    );
  }

  applyStockMovement(
    ...args: Parameters<
      StockMovementsRepository['createBulkAndApplyInTransaction']
    >
  ) {
    return this.stockMovementsRepository.createBulkAndApplyInTransaction(
      ...args,
    );
  }

  async hasSaleStockMovement(
    client: PoolClient,
    businessId: number,
    sale: Sale,
  ): Promise<boolean> {
    const result = await client.query<{ has_stock_movement: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM stock_movement
         WHERE business_id = $1 AND branch_id = $2
           AND type = 'OUT' AND reason = 'SALE' AND notes = $3
       ) AS has_stock_movement`,
      [businessId, Number(sale.branch_id), `Venta #${sale.id}`],
    );
    return result.rows[0].has_stock_movement;
  }

  async createInTransaction(
    client: PoolClient,
    businessId: number,
    createdByUserId: number,
    sale: CreateSaleRecord,
  ): Promise<Sale> {
    // Calculamos el subtotal desde los items que ya tienen el precio obtenido de product.
    const subtotal = this.roundCurrency(
      sale.items.reduce((sum, item) => sum + item.subtotal, 0),
    );
    // Restamos el descuento validado para guardar el total final de la venta.
    const totalAmount = this.roundCurrency(subtotal - sale.discount_amount);

    // Guardamos la cabecera de la venta; todavía no se confirma nada en la base.
    const result = await client.query<SaleRow>(
      `
          INSERT INTO sale (
            business_id,
            branch_id,
            customer_id,
            status,
            subtotal,
            discount_amount,
            total_amount,
            notes,
            created_by
          )
          VALUES ($1, $2, $3, 'COMPLETED', $4, $5, $6, $7, $8)
          RETURNING *
        `,
      [
        businessId,
        sale.branch_id,
        sale.customer_id,
        subtotal,
        sale.discount_amount,
        totalAmount,
        sale.notes,
        createdByUserId,
      ],
    );
    // Convertimos la fila recién creada al formato que devuelve la API.
    const created = this.mapSale(result.rows[0]);

    // Guardamos todos los productos y cantidades vendidos, dentro de la misma transacción.
    created.items = await this.saleItemsRepository.createMany(
      client,
      created.id,
      sale.items,
    );

    return created;
  }

  async findByIdForBusiness(
    id: number,
    businessId: number,
    accessFilter?: SaleAccessFilter,
  ): Promise<Sale | null> {
    const values: unknown[] = [id, businessId];
    const conditions = ['s.id = $1', 's.business_id = $2'];
    this.applyAccessFilter(conditions, values, accessFilter);

    const result = await this.databaseService.query<SaleRow>(
      `
        SELECT s.*
        FROM sale s
        WHERE ${conditions.join('\n          AND ')}
      `,
      values,
    );
    const sale = result.rows[0];

    if (!sale) {
      return null;
    }

    return this.getSaleWithItems(this.databaseService, this.mapSale(sale));
  }

  async findAllForBusiness(
    businessId: number,
    accessFilter?: SaleAccessFilter,
    pagination: SalePagination = { limit: 10, offset: 0 },
  ): Promise<SalePage> {
    // Empezamos por el negocio autorizado para no exponer ventas de otro tenant.
    const values: unknown[] = [businessId];
    const conditions = ['s.business_id = $1'];
    // Agregamos las restricciones de sucursal o de ventas propias cuando corresponda.
    this.applyAccessFilter(conditions, values, accessFilter);

    const countResult = await this.databaseService.query<{ total: string }>(
      `
        SELECT COUNT(*) AS total
        FROM sale s
        WHERE ${conditions.join('\n          AND ')}
      `,
      values,
    );
    const pageValues = [...values, pagination.limit, pagination.offset];

    const result = await this.databaseService.query<
      SaleRow & { created_by_user_name: string | null }
    >(
      `
        SELECT s.*, u.name AS created_by_user_name
        FROM sale s
        LEFT JOIN app_user u
          ON u.id = s.created_by
          AND (u.business_id = s.business_id OR u.business_id IS NULL)
        WHERE ${conditions.join('\n          AND ')}
        ORDER BY s.created_at DESC, s.id DESC
        LIMIT $${pageValues.length - 1}
        OFFSET $${pageValues.length}
      `,
      pageValues,
    );

    // El listado es liviano: devuelve las cabeceras; el detalle trae los items.
    return {
      sales: result.rows.map((row) => {
        const { items: _items, ...sale } = this.mapSale(row);
        return { ...sale, created_by_user_name: row.created_by_user_name };
      }),
      total: Number(countResult.rows[0]?.total ?? 0),
    };
  }

  async cancelForBusiness(
    id: number,
    businessId: number,
    beforeCancel: (client: PoolClient, sale: Sale) => Promise<void>,
    accessFilter?: SaleAccessFilter,
  ): Promise<CancelSaleResult> {
    // Abrimos una transacción única para que el reintegro de stock y el cambio de estado sean inseparables.
    return this.databaseService.withTransaction(async (client) => {
      // Preparamos filtros por id, negocio y alcance antes de bloquear la venta.
      const values: unknown[] = [id, businessId];
      const conditions = ['s.id = $1', 's.business_id = $2'];
      this.applyAccessFilter(conditions, values, accessFilter);

      // Bloqueamos la venta para que dos solicitudes no puedan anularla y reponer stock al mismo tiempo.
      const saleResult = await client.query<SaleRow>(
        `
          SELECT s.*
          FROM sale s
          WHERE ${conditions.join('\n            AND ')}
          FOR UPDATE
        `,
        values,
      );
      const saleRow = saleResult.rows[0];

      // Si la venta no existe o no pertenece al alcance autorizado, no hacemos ningún cambio.
      if (!saleRow) {
        return { status: 'not_found' };
      }

      // Si ya fue anulada, evitamos crear un segundo reintegro de stock.
      if (saleRow.status === 'CANCELLED') {
        return { status: 'already_cancelled' };
      }

      // Leemos los items originales para saber exactamente qué cantidades hay que restituir.
      const sale = await this.getSaleWithItems(client, this.mapSale(saleRow));

      await beforeCancel(client, sale);

      // Marcamos la venta como anulada solo después de reponer todo el stock correctamente.
      const cancelledResult = await client.query<SaleRow>(
        `
          UPDATE sale
          SET status = 'CANCELLED', updated_at = NOW()
          WHERE id = $1
          RETURNING *
        `,
        [id],
      );

      // Devolvemos el detalle actualizado; DatabaseService hará COMMIT al terminar sin errores.
      return {
        status: 'cancelled',
        sale: {
          ...this.mapSale(cancelledResult.rows[0]),
          items: sale.items,
        },
      };
    });
  }

  async branchBelongsToBusinessAndAccess(
    branchId: number,
    businessId: number,
    accessFilter?: SaleAccessFilter,
  ): Promise<boolean> {
    const values: unknown[] = [branchId, businessId];
    const conditions = ['id = $1', 'business_id = $2'];

    if (accessFilter?.allowedBranchIds !== undefined) {
      if (accessFilter.allowedBranchIds.length === 0) {
        return false;
      }

      values.push(accessFilter.allowedBranchIds);
      conditions.push(`id = ANY($${values.length}::bigint[])`);
    }

    const result = await this.databaseService.query(
      `
        SELECT 1
        FROM branch
        WHERE ${conditions.join('\n          AND ')}
        LIMIT 1
      `,
      values,
    );

    return result.rowCount === 1;
  }

  async customerBelongsToBusiness(
    customerId: number,
    businessId: number,
  ): Promise<boolean> {
    const result = await this.databaseService.query(
      `
        SELECT 1
        FROM customer
        WHERE id = $1
          AND business_id = $2
        LIMIT 1
      `,
      [customerId, businessId],
    );

    return result.rowCount === 1;
  }

  async findProductsForSale(
    productIds: number[],
    businessId: number,
  ): Promise<SaleProductPrice[]> {
    const result = await this.databaseService.query<{
      id: number | string;
      sale_price: number | string | null;
    }>(
      `
        SELECT id, sale_price
        FROM product
        WHERE business_id = $1
          AND id = ANY($2::bigint[])
      `,
      [businessId, productIds],
    );

    return result.rows.map((product) => ({
      id: Number(product.id),
      sale_price:
        product.sale_price === null ? null : Number(product.sale_price),
    }));
  }

  private async getSaleWithItems(
    executor: QueryExecutor,
    sale: Sale,
  ): Promise<Sale> {
    const items = await executor.query<{
      id: number;
      sale_id: number;
      product_id: number;
      quantity: number | string;
      unit_price: number | string;
      subtotal: number | string;
      created_at: Date;
    }>(
      `
        SELECT *
        FROM sale_item
        WHERE sale_id = $1
        ORDER BY id ASC
      `,
      [sale.id],
    );

    return {
      ...sale,
      items: items.rows.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        subtotal: Number(item.subtotal),
      })),
    };
  }

  private mapSale(row: SaleRow): Sale {
    return {
      ...row,
      subtotal: Number(row.subtotal),
      discount_amount: Number(row.discount_amount),
      total_amount: Number(row.total_amount),
      items: [],
    };
  }

  private roundCurrency(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private applyAccessFilter(
    conditions: string[],
    values: unknown[],
    accessFilter?: SaleAccessFilter,
  ): void {
    if (accessFilter?.allowedBranchIds !== undefined) {
      if (accessFilter.allowedBranchIds.length === 0) {
        conditions.push('FALSE');
      } else {
        values.push(accessFilter.allowedBranchIds);
        conditions.push(`branch_id = ANY($${values.length}::bigint[])`);
      }
    }

    if (accessFilter?.createdByUserId !== undefined) {
      values.push(accessFilter.createdByUserId);
      conditions.push(`created_by = $${values.length}`);
    }
  }
}
