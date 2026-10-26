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
exports.BranchesRepository = void 0;
const common_1 = require("@nestjs/common");
const sql_query_builder_1 = require("../../common/utils/sql-query-builder");
const database_service_1 = require("../../database/database.service");
const TABLE_NAME = 'branch';
const UPDATE_COLUMNS = [
    'name',
    'slug',
    'description',
    'logo_url',
    'cover_image_url',
    'primary_color',
    'instagram_url',
    'facebook_url',
    'address',
    'phone',
    'lat',
    'lng',
    'opening_hours',
];
let BranchesRepository = class BranchesRepository {
    databaseService;
    constructor(databaseService) {
        this.databaseService = databaseService;
    }
    async create(createBranchDto) {
        const result = await this.databaseService.query(`
        INSERT INTO ${TABLE_NAME} (
          business_id,
          name,
          slug,
          description,
          logo_url,
          cover_image_url,
          instagram_url,
          facebook_url,
          address,
          phone,
          status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [
            createBranchDto.business_id,
            createBranchDto.name,
            createBranchDto.slug,
            createBranchDto.description ?? null,
            createBranchDto.logo_url ?? null,
            createBranchDto.cover_image_url ?? null,
            createBranchDto.instagram_url ?? null,
            createBranchDto.facebook_url ?? null,
            createBranchDto.address,
            createBranchDto.phone,
            createBranchDto.status ?? 'ACTIVE',
        ]);
        return this.mapBranch(result.rows[0]);
    }
    async findAll() {
        const result = await this.databaseService.query(`
      SELECT *
      FROM ${TABLE_NAME}
    `);
        return result.rows.map((branch) => this.mapBranch(branch));
    }
    async findAllForBusiness(businessId, allowedBranchIds) {
        const values = [businessId];
        const branchCondition = this.buildBranchAccessCondition('id', values, allowedBranchIds);
        const result = await this.databaseService.query(`
        SELECT *
        FROM ${TABLE_NAME}
        WHERE business_id = $1
          ${branchCondition}
        ORDER BY name ASC, id ASC
      `, values);
        return result.rows.map((branch) => this.mapBranch(branch));
    }
    async findById(id) {
        const result = await this.databaseService.query(`
        SELECT *
        FROM ${TABLE_NAME}
        WHERE id = $1
      `, [id]);
        return result.rows[0] ? this.mapBranch(result.rows[0]) : null;
    }
    async update(id, updateBranchDto, businessId) {
        const builtQuery = (0, sql_query_builder_1.buildUpdateQuery)(TABLE_NAME, updateBranchDto, UPDATE_COLUMNS, id);
        if (!builtQuery) {
            return businessId === undefined
                ? this.findById(id)
                : this.findByIdForBusiness(id, businessId);
        }
        if (businessId !== undefined) {
            builtQuery.query = builtQuery.query.replace('WHERE id = $' + builtQuery.values.length, 'WHERE id = $' +
                builtQuery.values.length +
                ' AND business_id = $' +
                (builtQuery.values.length + 1));
            builtQuery.values.push(businessId);
        }
        const result = await this.databaseService.query(builtQuery.query, builtQuery.values);
        return result.rows[0] ? this.mapBranch(result.rows[0]) : null;
    }
    async findByIdForBusiness(id, businessId, allowedBranchIds) {
        const values = [id, businessId];
        const branchCondition = this.buildBranchAccessCondition('id', values, allowedBranchIds);
        const result = await this.databaseService.query(`
        SELECT *
        FROM ${TABLE_NAME}
        WHERE id = $1
          AND business_id = $2
          ${branchCondition}
      `, values);
        return result.rows[0] ? this.mapBranch(result.rows[0]) : null;
    }
    async remove(id) {
        const result = await this.databaseService.query(`
        DELETE FROM ${TABLE_NAME}
        WHERE id = $1
      `, [id]);
        return result.rowCount === 1;
    }
    async removeForBusiness(id, businessId) {
        const result = await this.databaseService.query(`
        DELETE FROM ${TABLE_NAME}
        WHERE id = $1
          AND business_id = $2
      `, [id, businessId]);
        return result.rowCount === 1;
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
    mapBranch(branch) {
        return {
            ...branch,
            lat: this.mapNullableNumber(branch.lat),
            lng: this.mapNullableNumber(branch.lng),
            opening_hours: this.mapOpeningHours(branch.opening_hours),
        };
    }
    mapNullableNumber(value) {
        return value === null ? null : Number(value);
    }
    mapOpeningHours(value) {
        return typeof value === 'string'
            ? JSON.parse(value)
            : value;
    }
};
exports.BranchesRepository = BranchesRepository;
exports.BranchesRepository = BranchesRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], BranchesRepository);
//# sourceMappingURL=branches.repository.js.map