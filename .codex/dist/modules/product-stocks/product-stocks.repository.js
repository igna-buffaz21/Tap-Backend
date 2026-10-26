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
exports.ProductStocksRepository = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../database/database.service");
const TABLE_NAME = 'product_stock';
let ProductStocksRepository = class ProductStocksRepository {
    databaseService;
    constructor(databaseService) {
        this.databaseService = databaseService;
    }
    async findAllForBusiness(businessId, branchId, productId, accessFilter) {
        const values = [businessId];
        const filters = ['business_id = $1'];
        if (branchId !== undefined) {
            values.push(branchId);
            filters.push('branch_id = $' + values.length);
        }
        if (productId !== undefined) {
            values.push(productId);
            filters.push('product_id = $' + values.length);
        }
        this.applyAllowedBranchFilter(filters, values, accessFilter);
        const result = await this.databaseService.query(`
        SELECT *
        FROM ${TABLE_NAME}
        WHERE ${filters.join(' AND ')}
        ORDER BY branch_id ASC, product_id ASC, id ASC
      `, values);
        return result.rows.map((row) => this.mapProductStock(row));
    }
    async getStatsForBusiness(businessId, branchId, accessFilter) {
        const values = [businessId];
        let stockBranchFilter = '';
        if (branchId !== undefined) {
            values.push(branchId);
            stockBranchFilter = 'AND ps.branch_id = $' + values.length;
        }
        else if (accessFilter?.allowedBranchIds !== undefined) {
            if (accessFilter.allowedBranchIds.length === 0) {
                stockBranchFilter = 'AND FALSE';
            }
            else {
                values.push(accessFilter.allowedBranchIds);
                stockBranchFilter = `AND ps.branch_id = ANY($${values.length}::bigint[])`;
            }
        }
        const result = await this.databaseService.query(`
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
      `, values);
        return this.mapProductStockStats(result.rows[0]);
    }
    async findByIdForBusiness(id, businessId, accessFilter) {
        const values = [id, businessId];
        const filters = ['id = $1', 'business_id = $2'];
        this.applyAllowedBranchFilter(filters, values, accessFilter);
        const result = await this.databaseService.query(`
        SELECT *
        FROM ${TABLE_NAME}
        WHERE ${filters.join(' AND ')}
      `, values);
        return result.rows[0] ? this.mapProductStock(result.rows[0]) : null;
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
        const filters = ['id = $1', 'business_id = $2'];
        this.applyAllowedBranchFilter(filters, values, accessFilter, 'id');
        const result = await this.databaseService.query(`
        SELECT 1
        FROM branch
        WHERE ${filters.join(' AND ')}
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
    mapProductStock(row) {
        return {
            ...row,
            quantity: Number(row.quantity),
            minimum_quantity: Number(row.minimum_quantity),
        };
    }
    mapProductStockStats(row) {
        return {
            total_products: Number(row.total_products),
            low_stock_products: Number(row.low_stock_products),
            out_of_stock_products: Number(row.out_of_stock_products),
            stock_value: Number(row.stock_value),
            sale_value: Number(row.sale_value),
        };
    }
    applyAllowedBranchFilter(filters, values, accessFilter, branchColumn = 'branch_id') {
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
};
exports.ProductStocksRepository = ProductStocksRepository;
exports.ProductStocksRepository = ProductStocksRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], ProductStocksRepository);
//# sourceMappingURL=product-stocks.repository.js.map