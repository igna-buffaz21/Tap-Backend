"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockMovementsRepository = exports.BulkStockMovementNoStockChangeError = exports.BulkStockMovementInsufficientStockError = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../database/database.service");
const PRODUCT_STOCK_TABLE = 'product_stock';
const PRODUCT_CATEGORY_TABLE = 'product_category';
const PRODUCT_TABLE = 'product';
const STOCK_MOVEMENT_TABLE = 'stock_movement';
const USER_TABLE = '"user"';
class BulkStockMovementInsufficientStockError extends Error {
    productId;
    constructor(productId) {
        super('Stock cannot be negative');
        this.productId = productId;
    }
}
exports.BulkStockMovementInsufficientStockError = BulkStockMovementInsufficientStockError;
class BulkStockMovementNoStockChangeError extends Error {
    productId;
    constructor(productId) {
        super('Stock movement must change stock');
        this.productId = productId;
    }
}
exports.BulkStockMovementNoStockChangeError = BulkStockMovementNoStockChangeError;
let StockMovementsRepository = class StockMovementsRepository {
    databaseService;
    constructor(databaseService) {
        this.databaseService = databaseService;
    }
    async createAndApply(businessId, dto, createdByUserId) {
        return this.databaseService.withTransaction(async (client) => {
            return this.applyMovement(client, businessId, dto, createdByUserId);
        });
    }
    async createBulkAndApply(businessId, payload, createdByUserId) {
        return this.databaseService.withTransaction(async (client) => {
            const movements = [];
            for (const item of payload.items) {
                const result = await this.applyMovement(client, businessId, {
                    branch_id: payload.branch_id,
                    product_id: item.product_id,
                    type: payload.type,
                    quantity: item.quantity,
                    unit_cost: item.unit_cost,
                    reason: payload.reason,
                    notes: payload.notes,
                }, createdByUserId);
                if ('insufficientStock' in result) {
                    throw new BulkStockMovementInsufficientStockError(item.product_id);
                }
                if ('noStockChange' in result) {
                    throw new BulkStockMovementNoStockChangeError(item.product_id);
                }
                movements.push(result.movement);
            }
            return movements;
        });
    }
    async findAllForBusiness(businessId, filters = {}, pagination = { limit: 10, offset: 0 }, accessFilter) {
        const values = [businessId];
        const whereClauses = ['sm.business_id = $1'];
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
        const countResult = await this.databaseService.query(`
          SELECT COUNT(*) AS total
          FROM ${STOCK_MOVEMENT_TABLE} sm
          WHERE ${whereClauses.join(' AND ')}
        `, values);
        const pageValues = [...values, pagination.limit, pagination.offset];
        const limitParam = '$' + (pageValues.length - 1);
        const offsetParam = '$' + pageValues.length;
        const result = await this.databaseService.query(`
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
      `, pageValues);
        return {
            movements: result.rows.map((row) => this.mapStockMovement(row)),
            total: Number(countResult.rows[0]?.total ?? 0),
        };
    }
    async findByIdForBusiness(id, businessId, accessFilter) {
        const values = [id, businessId];
        const whereClauses = ['sm.id = $1', 'sm.business_id = $2'];
        this.applyAccessFilter(whereClauses, values, accessFilter);
        const result = await this.databaseService.query(`
        SELECT
          sm.*,
          u.name AS created_by_user_name
        FROM ${STOCK_MOVEMENT_TABLE} sm
        LEFT JOIN ${USER_TABLE} u
          ON u.id = sm.created_by_user_id
        WHERE ${whereClauses.join(' AND ')}
      `, values);
        return result.rows[0] ? this.mapStockMovement(result.rows[0]) : null;
    }
    async branchBelongsToBusiness(branchId, businessId) {
        const result = await this.databaseService.query(`
        SELECT 1
        FROM branch
        WHERE id = $1
          AND business_id = $2
        LIMIT 1
      `, [branchId, businessId]);
        return result.rowCount === 1;
    }
    async branchBelongsToBusinessAndAccess(branchId, businessId, accessFilter) {
        const values = [branchId, businessId];
        const whereClauses = ['id = $1', 'business_id = $2'];
        this.applyAccessFilter(whereClauses, values, accessFilter, 'id');
        const result = await this.databaseService.query(`
        SELECT 1
        FROM branch
        WHERE ${whereClauses.join(' AND ')}
        LIMIT 1
      `, values);
        return result.rowCount === 1;
    }
    async productBelongsToBusiness(productId, businessId) {
        const result = await this.databaseService.query(`
        SELECT 1
        FROM product
        WHERE id = $1
          AND business_id = $2
        LIMIT 1
      `, [productId, businessId]);
        return result.rowCount === 1;
    }
    async userBelongsToBusiness(userId, businessId) {
        const result = await this.databaseService.query(`
        SELECT 1
        FROM ${USER_TABLE}
        WHERE id = $1
          AND business_id = $2
        LIMIT 1
      `, [userId, businessId]);
        return result.rowCount === 1;
    }
    async categoryBelongsToBusiness(categoryId, businessId) {
        const result = await this.databaseService.query(`
        SELECT 1
        FROM ${PRODUCT_CATEGORY_TABLE}
        WHERE id = $1
          AND business_id = $2
        LIMIT 1
      `, [categoryId, businessId]);
        return result.rowCount === 1;
    }
    async findProductStockForUpdate(executor, businessId, branchId, productId) {
        const result = await executor.query(`
        SELECT id, quantity
        FROM ${PRODUCT_STOCK_TABLE}
        WHERE business_id = $1
          AND branch_id = $2
          AND product_id = $3
        FOR UPDATE
      `, [businessId, branchId, productId]);
        return result.rows[0] ?? null;
    }
    async createProductStockForUpdate(executor, businessId, branchId, productId, quantity) {
        const result = await executor.query(`
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
      `, [businessId, branchId, productId, quantity]);
        return result.rows[0] ?? null;
    }
    async applyMovement(executor, businessId, dto, createdByUserId) {
        let stock = await this.findProductStockForUpdate(executor, businessId, dto.branch_id, dto.product_id);
        for (;;) {
            const previousQuantity = stock ? Number(stock.quantity) : 0;
            const newQuantity = this.calculateNewQuantity(dto, previousQuantity);
            if (newQuantity < 0) {
                return { insufficientStock: true };
            }
            const movementQuantity = dto.type === 'ADJUSTMENT'
                ? Math.abs(newQuantity - previousQuantity)
                : Number(dto.quantity);
            if (movementQuantity <= 0) {
                return { noStockChange: true };
            }
            if (stock) {
                await executor.query(`
            UPDATE ${PRODUCT_STOCK_TABLE}
            SET
              quantity = $1,
              updated_at = NOW()
            WHERE id = $2
          `, [newQuantity, stock.id]);
            }
            else {
                const createdStock = await this.createProductStockForUpdate(executor, businessId, dto.branch_id, dto.product_id, newQuantity);
                if (!createdStock) {
                    stock = await this.findProductStockForUpdate(executor, businessId, dto.branch_id, dto.product_id);
                    continue;
                }
            }
            const result = await executor.query(`
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
        `, [
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
            ]);
            return { movement: this.mapStockMovement(result.rows[0]) };
        }
    }
    calculateNewQuantity(dto, previousQuantity) {
        if (dto.type === 'IN') {
            return previousQuantity + Number(dto.quantity);
        }
        if (dto.type === 'OUT') {
            return previousQuantity - Number(dto.quantity);
        }
        return Number(dto.quantity);
    }
    mapStockMovement(row) {
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
    applyAccessFilter(whereClauses, values, accessFilter, branchColumn = 'sm.branch_id') {
        if (!accessFilter) {
            return;
        }
        if (accessFilter.allowedBranchIds !== undefined) {
            if (accessFilter.allowedBranchIds.length === 0) {
                whereClauses.push('FALSE');
            }
            else {
                values.push(accessFilter.allowedBranchIds);
                whereClauses.push(`${branchColumn} = ANY($${values.length}::bigint[])`);
            }
        }
        if (branchColumn === 'sm.branch_id' &&
            accessFilter.ownOnly &&
            accessFilter.createdByUserId !== undefined &&
            accessFilter.createdByUserId !== null) {
            values.push(accessFilter.createdByUserId);
            whereClauses.push(`sm.created_by_user_id = $${values.length}`);
        }
    }
};
exports.StockMovementsRepository = StockMovementsRepository;
exports.StockMovementsRepository = StockMovementsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], StockMovementsRepository);
//# sourceMappingURL=stock-movements.repository.js.map