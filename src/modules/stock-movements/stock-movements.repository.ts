import { Injectable } from '@nestjs/common';
import { QueryResult, QueryResultRow } from 'pg';
import { DatabaseService } from '../../database/database.service';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import {
  StockMovement,
  StockMovementReason,
  StockMovementType,
} from './entities/stock-movement.entity';

const PRODUCT_STOCK_TABLE = 'product_stock';
const PRODUCT_CATEGORY_TABLE = 'product_category';
const PRODUCT_TABLE = 'product';
const STOCK_MOVEMENT_TABLE = 'stock_movement';
const USER_TABLE = 'app_user';

interface QueryExecutor {
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: unknown[],
  ): Promise<QueryResult<T>>;
}

type ProductStockRow = {
  id: number;
  quantity: number | string;
};

type StockMovementRow = Omit<
  StockMovement,
  'quantity' | 'unit_cost' | 'previous_quantity' | 'new_quantity'
> & {
  quantity: number | string;
  unit_cost: number | string | null;
  previous_quantity: number | string;
  new_quantity: number | string;
};

type StockMovementCountRow = {
  total: number | string;
};

export type ApplyStockMovementResult =
  | { movement: StockMovement }
  | { insufficientStock: true }
  | { noStockChange: true };

export type StockMovementPage = {
  movements: StockMovement[];
  total: number;
};

export type StockMovementFilters = {
  branchId?: number;
  productId?: number;
  userId?: number;
  categoryId?: number;
  type?: StockMovementType;
};

export type StockMovementPagination = {
  limit: number;
  offset: number;
};

export type StockMovementAccessFilter = {
  allowedBranchIds?: number[];
  createdByUserId?: number;
  ownOnly?: boolean;
};

export type BulkStockMovementItem = {
  product_id: number;
  quantity: number;
  unit_cost: number | null;
};

export type BulkStockMovementPayload = {
  branch_id: number;
  type: Exclude<StockMovementType, 'ADJUSTMENT'>;
  reason: StockMovementReason | null;
  notes: string | null;
  items: BulkStockMovementItem[];
};

export type SaleStockAvailabilityItem = {
  product_id: number;
  quantity: number;
};

export type SaleStockAvailabilityResult =
  | { available: true }
  | {
      available: false;
      productId: number;
      availableQuantity: number;
      requestedQuantity: number;
    };

export class BulkStockMovementInsufficientStockError extends Error {
  constructor(readonly productId: number) {
    super('Stock cannot be negative');
  }
}

export class BulkStockMovementNoStockChangeError extends Error {
  constructor(readonly productId: number) {
    super('Stock movement must change stock');
  }
}

@Injectable()
export class StockMovementsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async createAndApply(
    businessId: number,
    dto: CreateStockMovementDto,
    createdByUserId: number,
  ): Promise<ApplyStockMovementResult> {
    return this.databaseService.withTransaction(async (client) => {
      return this.applyMovement(client, businessId, dto, createdByUserId);
    });
  }

  async createBulkAndApply(
    businessId: number,
    payload: BulkStockMovementPayload,
    createdByUserId: number,
  ): Promise<StockMovement[]> {
    return this.databaseService.withTransaction(async (client) => {
      return this.createBulkAndApplyInTransaction(
        client,
        businessId,
        payload,
        createdByUserId,
      );
    });
  }

  async validateSaleStockAvailabilityInTransaction(
    executor: QueryExecutor,
    businessId: number,
    branchId: number,
    items: SaleStockAvailabilityItem[],
  ): Promise<SaleStockAvailabilityResult> {
    // Reunimos las cantidades para que dos líneas del mismo producto se validen como un total.
    const requestedByProduct = new Map<number, number>();

    // Sumamos cada cantidad solicitada por producto.
    for (const item of items) {
      requestedByProduct.set(
        item.product_id,
        (requestedByProduct.get(item.product_id) ?? 0) + item.quantity,
      );
    }

    // Ordenamos por id para bloquear las filas siempre en el mismo orden y evitar bloqueos cruzados.
    for (const [productId, requestedQuantity] of [...requestedByProduct].sort(
      ([firstProductId], [secondProductId]) => firstProductId - secondProductId,
    )) {
      // Bloqueamos el stock de este producto hasta que termine la transacción de la venta.
      const stock = await this.findProductStockForUpdate(
        executor,
        businessId,
        branchId,
        productId,
      );
      // Si no existe una fila de stock, la existencia disponible se considera cero.
      const availableQuantity = stock ? Number(stock.quantity) : 0;

      // Informamos el primer faltante sin modificar todavía venta, items ni existencias.
      if (availableQuantity < requestedQuantity) {
        return {
          available: false,
          productId,
          availableQuantity,
          requestedQuantity,
        };
      }
    }

    // Todas las cantidades solicitadas están disponibles y permanecen bloqueadas para el siguiente paso.
    return { available: true };
  }

  async createBulkAndApplyInTransaction(
    executor: QueryExecutor,
    businessId: number,
    payload: BulkStockMovementPayload,
    createdByUserId: number,
  ): Promise<StockMovement[]> {
    // Conservamos los movimientos creados para devolverlos al flujo que los invocó.
    const movements: StockMovement[] = [];

    // Aplicamos cada salida usando el mismo cliente de base de datos de la venta.
    for (const item of payload.items) {
      const result = await this.applyMovement(
        executor,
        businessId,
        {
          branch_id: payload.branch_id,
          product_id: item.product_id,
          type: payload.type,
          quantity: item.quantity,
          unit_cost: item.unit_cost,
          reason: payload.reason,
          notes: payload.notes,
        },
        createdByUserId,
      );

      // Esta protección mantiene el rollback correcto aun si el stock cambia por una falla inesperada.
      if ('insufficientStock' in result) {
        throw new BulkStockMovementInsufficientStockError(item.product_id);
      }

      // Una venta nunca debe crear un movimiento que no cambie el stock.
      if ('noStockChange' in result) {
        throw new BulkStockMovementNoStockChangeError(item.product_id);
      }

      // Guardamos el movimiento ya insertado y el stock ya actualizado.
      movements.push(result.movement);
    }

    // Devolvemos todos los movimientos, sin abrir ni cerrar otra transacción.
    return movements;
  }

  async findAllForBusiness(
    businessId: number,
    filters: StockMovementFilters = {},
    pagination: StockMovementPagination = { limit: 10, offset: 0 },
    accessFilter?: StockMovementAccessFilter,
  ): Promise<StockMovementPage> {
    const values: unknown[] = [businessId];
    const whereClauses: string[] = ['sm.business_id = $1'];

    if (filters.branchId !== undefined) {
      values.push(filters.branchId);
      whereClauses.push('sm.branch_id = $' + values.length);
    }

    if (filters.productId !== undefined) {
      values.push(filters.productId);
      whereClauses.push('sm.product_id = $' + values.length);
    }

    if (filters.userId !== undefined) {
      values.push(filters.userId);
      whereClauses.push('sm.created_by_user_id = $' + values.length);
    }

    if (filters.categoryId !== undefined) {
      values.push(filters.categoryId);
      whereClauses.push(`
        EXISTS (
          SELECT 1
          FROM ${PRODUCT_TABLE} p
          WHERE p.id = sm.product_id
            AND p.business_id = sm.business_id
            AND p.category_id = $${values.length}
        )
      `);
    }

    if (filters.type !== undefined) {
      values.push(filters.type);
      whereClauses.push('sm.type = $' + values.length);
    }

    this.applyAccessFilter(whereClauses, values, accessFilter);

    const countResult = await this.databaseService.query<StockMovementCountRow>(
      `
          SELECT COUNT(*) AS total
          FROM ${STOCK_MOVEMENT_TABLE} sm
          WHERE ${whereClauses.join(' AND ')}
        `,
      values,
    );

    const pageValues = [...values, pagination.limit, pagination.offset];
    const limitParam = '$' + (pageValues.length - 1);
    const offsetParam = '$' + pageValues.length;

    const result = await this.databaseService.query<StockMovementRow>(
      `
        SELECT
          sm.*,
          u.name AS created_by_user_name
        FROM ${STOCK_MOVEMENT_TABLE} sm
        LEFT JOIN ${USER_TABLE} u
          ON u.id = sm.created_by_user_id
        WHERE ${whereClauses.join(' AND ')}
        ORDER BY sm.created_at DESC, sm.id DESC
        LIMIT ${limitParam}
        OFFSET ${offsetParam}
      `,
      pageValues,
    );

    return {
      movements: result.rows.map((row) => this.mapStockMovement(row)),
      total: Number(countResult.rows[0]?.total ?? 0),
    };
  }

  async findByIdForBusiness(
    id: number,
    businessId: number,
    accessFilter?: StockMovementAccessFilter,
  ): Promise<StockMovement | null> {
    const values: unknown[] = [id, businessId];
    const whereClauses = ['sm.id = $1', 'sm.business_id = $2'];

    this.applyAccessFilter(whereClauses, values, accessFilter);

    const result = await this.databaseService.query<StockMovementRow>(
      `
        SELECT
          sm.*,
          u.name AS created_by_user_name
        FROM ${STOCK_MOVEMENT_TABLE} sm
        LEFT JOIN ${USER_TABLE} u
          ON u.id = sm.created_by_user_id
        WHERE ${whereClauses.join(' AND ')}
      `,
      values,
    );

    return result.rows[0] ? this.mapStockMovement(result.rows[0]) : null;
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
    accessFilter?: StockMovementAccessFilter,
  ): Promise<boolean> {
    const values: unknown[] = [branchId, businessId];
    const whereClauses = ['id = $1', 'business_id = $2'];

    this.applyAccessFilter(whereClauses, values, accessFilter, 'id');

    const result = await this.databaseService.query(
      `
        SELECT 1
        FROM branch
        WHERE ${whereClauses.join(' AND ')}
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

  async userBelongsToBusiness(
    userId: number,
    businessId: number,
  ): Promise<boolean> {
    const result = await this.databaseService.query(
      `
        SELECT 1
        FROM ${USER_TABLE}
        WHERE id = $1
          AND business_id = $2
        LIMIT 1
      `,
      [userId, businessId],
    );

    return result.rowCount === 1;
  }

  async categoryBelongsToBusiness(
    categoryId: number,
    businessId: number,
  ): Promise<boolean> {
    const result = await this.databaseService.query(
      `
        SELECT 1
        FROM ${PRODUCT_CATEGORY_TABLE}
        WHERE id = $1
          AND business_id = $2
        LIMIT 1
      `,
      [categoryId, businessId],
    );

    return result.rowCount === 1;
  }

  private async findProductStockForUpdate(
    executor: QueryExecutor,
    businessId: number,
    branchId: number,
    productId: number,
  ): Promise<ProductStockRow | null> {
    const result = await executor.query<ProductStockRow>(
      `
        SELECT id, quantity
        FROM ${PRODUCT_STOCK_TABLE}
        WHERE business_id = $1
          AND branch_id = $2
          AND product_id = $3
        FOR UPDATE
      `,
      [businessId, branchId, productId],
    );

    return result.rows[0] ?? null;
  }

  private async createProductStockForUpdate(
    executor: QueryExecutor,
    businessId: number,
    branchId: number,
    productId: number,
    quantity: number,
  ): Promise<ProductStockRow | null> {
    const result = await executor.query<ProductStockRow>(
      `
        INSERT INTO ${PRODUCT_STOCK_TABLE} (
          business_id,
          branch_id,
          product_id,
          quantity,
          minimum_quantity
        )
        VALUES ($1, $2, $3, $4, 0)
        ON CONFLICT (branch_id, product_id) DO NOTHING
        RETURNING id, quantity
      `,
      [businessId, branchId, productId, quantity],
    );

    return result.rows[0] ?? null;
  }

  private async applyMovement(
    executor: QueryExecutor,
    businessId: number,
    dto: CreateStockMovementDto,
    createdByUserId: number,
  ): Promise<ApplyStockMovementResult> {
    let stock = await this.findProductStockForUpdate(
      executor,
      businessId,
      dto.branch_id,
      dto.product_id,
    );

    for (;;) {
      const previousQuantity = stock ? Number(stock.quantity) : 0;
      const newQuantity = this.calculateNewQuantity(dto, previousQuantity);

      if (newQuantity < 0) {
        return { insufficientStock: true };
      }

      const movementQuantity =
        dto.type === 'ADJUSTMENT'
          ? Math.abs(newQuantity - previousQuantity)
          : Number(dto.quantity);

      if (movementQuantity <= 0) {
        return { noStockChange: true };
      }

      if (stock) {
        await executor.query(
          `
            UPDATE ${PRODUCT_STOCK_TABLE}
            SET
              quantity = $1,
              updated_at = NOW()
            WHERE id = $2
          `,
          [newQuantity, stock.id],
        );
      } else {
        const createdStock = await this.createProductStockForUpdate(
          executor,
          businessId,
          dto.branch_id,
          dto.product_id,
          newQuantity,
        );

        if (!createdStock) {
          stock = await this.findProductStockForUpdate(
            executor,
            businessId,
            dto.branch_id,
            dto.product_id,
          );
          continue;
        }
      }

      const result = await executor.query<StockMovementRow>(
        `
          INSERT INTO ${STOCK_MOVEMENT_TABLE} (
            business_id,
            branch_id,
            product_id,
            type,
            quantity,
            unit_cost,
            previous_quantity,
            new_quantity,
            reason,
            notes,
            created_by_user_id
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING
            *,
            (
              SELECT name
              FROM ${USER_TABLE}
              WHERE id = created_by_user_id
            ) AS created_by_user_name
        `,
        [
          businessId,
          dto.branch_id,
          dto.product_id,
          dto.type,
          movementQuantity,
          dto.unit_cost ?? null,
          previousQuantity,
          newQuantity,
          dto.reason ?? null,
          dto.notes ?? null,
          createdByUserId,
        ],
      );

      return { movement: this.mapStockMovement(result.rows[0]) };
    }
  }

  private calculateNewQuantity(
    dto: CreateStockMovementDto,
    previousQuantity: number,
  ): number {
    if (dto.type === 'IN') {
      return previousQuantity + Number(dto.quantity);
    }

    if (dto.type === 'OUT') {
      return previousQuantity - Number(dto.quantity);
    }

    return Number(dto.quantity);
  }

  private mapStockMovement(row: StockMovementRow): StockMovement {
    return {
      id: row.id,
      business_id: row.business_id,
      branch_id: row.branch_id,
      product_id: row.product_id,
      type: row.type,
      quantity: Number(row.quantity),
      unit_cost: row.unit_cost === null ? null : Number(row.unit_cost),
      previous_quantity: Number(row.previous_quantity),
      new_quantity: Number(row.new_quantity),
      reason: row.reason,
      notes: row.notes,
      created_by_user_id: row.created_by_user_id,
      created_by_user_name: row.created_by_user_name,
      created_at: row.created_at,
    };
  }

  private applyAccessFilter(
    whereClauses: string[],
    values: unknown[],
    accessFilter?: StockMovementAccessFilter,
    branchColumn = 'sm.branch_id',
  ): void {
    if (!accessFilter) {
      return;
    }

    if (accessFilter.allowedBranchIds !== undefined) {
      if (accessFilter.allowedBranchIds.length === 0) {
        whereClauses.push('FALSE');
      } else {
        values.push(accessFilter.allowedBranchIds);
        whereClauses.push(`${branchColumn} = ANY($${values.length}::bigint[])`);
      }
    }

    if (
      branchColumn === 'sm.branch_id' &&
      accessFilter.ownOnly &&
      accessFilter.createdByUserId !== undefined &&
      accessFilter.createdByUserId !== null
    ) {
      values.push(accessFilter.createdByUserId);
      whereClauses.push(`sm.created_by_user_id = $${values.length}`);
    }
  }
}
