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
exports.ProductsRepository = void 0;
const common_1 = require("@nestjs/common");
const sql_query_builder_1 = require("../../common/utils/sql-query-builder");
const database_service_1 = require("../../database/database.service");
const PRODUCT_TABLE = 'product';
const PRODUCT_STOCK_TABLE = 'product_stock';
const UPDATE_COLUMNS = [
    'category_id',
    'name',
    'description',
    'sku',
    'unit',
    'cost_price',
    'sale_price',
    'status',
];
let ProductsRepository = class ProductsRepository {
    databaseService;
    constructor(databaseService) {
        this.databaseService = databaseService;
    }
    async create(businessId, dto) {
        return this.databaseService.withTransaction(async (client) => {
            const product = await this.createProduct(client, businessId, dto);
            if (dto.branch_id !== undefined) {
                await this.createProductStock(client, businessId, dto.branch_id, product.id, dto.minimum_quantity ?? 0);
            }
            return product;
        });
    }
    async findAllForBusiness(businessId) {
        const result = await this.databaseService.query(`
        SELECT *
        FROM ${PRODUCT_TABLE}
        WHERE business_id = $1
        ORDER BY name ASC, id ASC
      `, [businessId]);
        return result.rows.map((row) => this.mapProduct(row));
    }
    async findByIdForBusiness(id, businessId) {
        const result = await this.databaseService.query(`
        SELECT *
        FROM ${PRODUCT_TABLE}
        WHERE id = $1
          AND business_id = $2
      `, [id, businessId]);
        return result.rows[0] ? this.mapProduct(result.rows[0]) : null;
    }
    async updateForBusiness(id, businessId, dto) {
        const builtQuery = (0, sql_query_builder_1.buildUpdateQuery)(PRODUCT_TABLE, dto, UPDATE_COLUMNS, id);
        if (!builtQuery) {
            return this.findByIdForBusiness(id, businessId);
        }
        builtQuery.query = builtQuery.query.replace('WHERE id = $' + builtQuery.values.length, 'WHERE id = $' +
            builtQuery.values.length +
            ' AND business_id = $' +
            (builtQuery.values.length + 1));
        builtQuery.values.push(businessId);
        const result = await this.databaseService.query(builtQuery.query, builtQuery.values);
        return result.rows[0] ? this.mapProduct(result.rows[0]) : null;
    }
    async categoryBelongsToBusiness(categoryId, businessId) {
        const result = await this.databaseService.query(`
        SELECT 1
        FROM product_category
        WHERE id = $1
          AND business_id = $2
        LIMIT 1
      `, [categoryId, businessId]);
        return result.rowCount === 1;
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
        const branchCondition = this.buildBranchAccessCondition('id', values, accessFilter?.allowedBranchIds);
        const result = await this.databaseService.query(`
        SELECT 1
        FROM branch
        WHERE id = $1
          AND business_id = $2
          ${branchCondition}
        LIMIT 1
      `, values);
        return result.rowCount === 1;
    }
    async createProduct(executor, businessId, dto) {
        const result = await executor.query(`
        INSERT INTO ${PRODUCT_TABLE} (
          business_id,
          category_id,
          name,
          description,
          sku,
          unit,
          cost_price,
          sale_price,
          status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
            businessId,
            dto.category_id ?? null,
            dto.name,
            dto.description ?? null,
            dto.sku ?? null,
            dto.unit ?? 'unit',
            dto.cost_price ?? null,
            dto.sale_price ?? null,
            dto.status ?? 'active',
        ]);
        return this.mapProduct(result.rows[0]);
    }
    async createProductStock(executor, businessId, branchId, productId, minimumQuantity) {
        await executor.query(`
        INSERT INTO ${PRODUCT_STOCK_TABLE} (
          business_id,
          branch_id,
          product_id,
          quantity,
          minimum_quantity
        )
        VALUES ($1, $2, $3, 0, $4)
      `, [businessId, branchId, productId, minimumQuantity]);
    }
    mapProduct(row) {
        return {
            ...row,
            cost_price: row.cost_price === null ? null : Number(row.cost_price),
            sale_price: row.sale_price === null ? null : Number(row.sale_price),
        };
    }
    buildBranchAccessCondition(branchIdExpression, values, allowedBranchIds) {
        if (allowedBranchIds === undefined) {
            return '';
        }
        if (allowedBranchIds.length === 0) {
            return 'AND FALSE';
        }
        values.push(allowedBranchIds);
        return `AND ${branchIdExpression} = ANY($${values.length}::bigint[])`;
    }
};
exports.ProductsRepository = ProductsRepository;
exports.ProductsRepository = ProductsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], ProductsRepository);
//# sourceMappingURL=products.repository.js.map