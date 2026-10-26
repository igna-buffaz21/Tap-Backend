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
exports.BusinessesRepository = void 0;
const common_1 = require("@nestjs/common");
const sql_query_builder_1 = require("../../common/utils/sql-query-builder");
const database_service_1 = require("../../database/database.service");
const TABLE_NAME = 'business';
const UPDATE_COLUMNS = [
    'name',
    'slug',
    'business_type',
    'timezone',
    'currency',
    'status',
];
let BusinessesRepository = class BusinessesRepository {
    databaseService;
    constructor(databaseService) {
        this.databaseService = databaseService;
    }
    async create(createBusinessDto) {
        const result = await this.databaseService.query(`
        INSERT INTO ${TABLE_NAME} (
          name,
          slug,
          business_type,
          timezone,
          currency,
          status
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
            createBusinessDto.name,
            createBusinessDto.slug,
            createBusinessDto.business_type,
            createBusinessDto.timezone,
            createBusinessDto.currency,
            createBusinessDto.status ?? 'ACTIVE',
        ]);
        return result.rows[0];
    }
    async findAll() {
        const result = await this.databaseService.query(`
      SELECT *
      FROM ${TABLE_NAME}
    `);
        return result.rows;
    }
    async findById(id) {
        const result = await this.databaseService.query(`
        SELECT *
        FROM ${TABLE_NAME}
        WHERE id = $1
      `, [id]);
        return result.rows[0] ?? null;
    }
    async update(id, updateBusinessDto) {
        const builtQuery = (0, sql_query_builder_1.buildUpdateQuery)(TABLE_NAME, updateBusinessDto, UPDATE_COLUMNS, id);
        if (!builtQuery) {
            return this.findById(id);
        }
        const result = await this.databaseService.query(builtQuery.query, builtQuery.values);
        return result.rows[0] ?? null;
    }
    async remove(id) {
        const result = await this.databaseService.query(`
        DELETE FROM ${TABLE_NAME}
        WHERE id = $1
      `, [id]);
        return result.rowCount === 1;
    }
};
exports.BusinessesRepository = BusinessesRepository;
exports.BusinessesRepository = BusinessesRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], BusinessesRepository);
//# sourceMappingURL=businesses.repository.js.map