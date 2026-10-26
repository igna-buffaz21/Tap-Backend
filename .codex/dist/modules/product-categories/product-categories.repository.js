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
exports.ProductCategoriesRepository = void 0;
const common_1 = require("@nestjs/common");
const sql_query_builder_1 = require("../../common/utils/sql-query-builder");
const database_service_1 = require("../../database/database.service");
const TABLE_NAME = 'product_category';
const UPDATE_COLUMNS = ['name', 'description', 'status'];
let ProductCategoriesRepository = class ProductCategoriesRepository {
    databaseService;
    constructor(databaseService) {
        this.databaseService = databaseService;
    }
    async create(businessId, dto) {
        const result = await this.databaseService.query(`
        INSERT INTO ${TABLE_NAME} (
          business_id,
          name,
          description,
          status
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [businessId, dto.name, dto.description ?? null, dto.status ?? 'active']);
        return result.rows[0];
    }
    async findAllForBusiness(businessId) {
        const result = await this.databaseService.query(`
        SELECT *
        FROM ${TABLE_NAME}
        WHERE business_id = $1
        ORDER BY name ASC, id ASC
      `, [businessId]);
        return result.rows;
    }
    async findByIdForBusiness(id, businessId) {
        const result = await this.databaseService.query(`
        SELECT *
        FROM ${TABLE_NAME}
        WHERE id = $1
          AND business_id = $2
      `, [id, businessId]);
        return result.rows[0] ?? null;
    }
    async updateForBusiness(id, businessId, dto) {
        const builtQuery = (0, sql_query_builder_1.buildUpdateQuery)(TABLE_NAME, dto, UPDATE_COLUMNS, id);
        if (!builtQuery) {
            return this.findByIdForBusiness(id, businessId);
        }
        builtQuery.query = builtQuery.query.replace('WHERE id = $' + builtQuery.values.length, 'WHERE id = $' +
            builtQuery.values.length +
            ' AND business_id = $' +
            (builtQuery.values.length + 1));
        builtQuery.values.push(businessId);
        const result = await this.databaseService.query(builtQuery.query, builtQuery.values);
        return result.rows[0] ?? null;
    }
};
exports.ProductCategoriesRepository = ProductCategoriesRepository;
exports.ProductCategoriesRepository = ProductCategoriesRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], ProductCategoriesRepository);
//# sourceMappingURL=product-categories.repository.js.map