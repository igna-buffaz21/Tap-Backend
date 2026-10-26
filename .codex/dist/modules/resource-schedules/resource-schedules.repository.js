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
exports.ResourceSchedulesRepository = void 0;
const common_1 = require("@nestjs/common");
const sql_query_builder_1 = require("../../common/utils/sql-query-builder");
const database_service_1 = require("../../database/database.service");
const TABLE_NAME = 'resource_schedule';
const UPDATE_COLUMNS = [
    'resource_id',
    'day_of_week',
    'start_time',
    'end_time',
    'status',
];
let ResourceSchedulesRepository = class ResourceSchedulesRepository {
    databaseService;
    constructor(databaseService) {
        this.databaseService = databaseService;
    }
    async create(createResourceScheduleDto) {
        const result = await this.databaseService.query(`
        INSERT INTO ${TABLE_NAME} (
          resource_id,
          day_of_week,
          start_time,
          end_time,
          status
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
            createResourceScheduleDto.resource_id,
            createResourceScheduleDto.day_of_week,
            createResourceScheduleDto.start_time,
            createResourceScheduleDto.end_time,
            createResourceScheduleDto.status ?? 'ACTIVE',
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
    async findAllForBusiness(businessId, accessFilter) {
        const values = [businessId];
        const branchCondition = this.buildBranchAccessCondition('b.id', values, accessFilter?.allowedBranchIds);
        const result = await this.databaseService.query(`
        SELECT rs.*
        FROM ${TABLE_NAME} rs
        INNER JOIN resource r ON r.id = rs.resource_id
        INNER JOIN branch b ON b.id = r.branch_id
        WHERE b.business_id = $1
          ${branchCondition}
        ORDER BY rs.resource_id ASC, rs.day_of_week ASC, rs.start_time ASC
      `, values);
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
    async update(id, updateResourceScheduleDto, businessId, accessFilter) {
        const builtQuery = (0, sql_query_builder_1.buildUpdateQuery)(TABLE_NAME, updateResourceScheduleDto, UPDATE_COLUMNS, id);
        if (!builtQuery) {
            return businessId === undefined
                ? this.findById(id)
                : this.findByIdForBusiness(id, businessId, accessFilter);
        }
        if (businessId !== undefined) {
            const idParamIndex = builtQuery.values.length;
            builtQuery.values.push(businessId);
            const businessIdParamIndex = builtQuery.values.length;
            const branchCondition = this.buildBranchAccessCondition('b.id', builtQuery.values, accessFilter?.allowedBranchIds);
            builtQuery.query = builtQuery.query.replace('WHERE id = $' + idParamIndex, 'WHERE id = $' +
                idParamIndex +
                ' AND resource_id IN (' +
                'SELECT r.id FROM resource r ' +
                'INNER JOIN branch b ON b.id = r.branch_id ' +
                'WHERE b.business_id = $' +
                businessIdParamIndex +
                ' ' +
                branchCondition +
                ')');
        }
        const result = await this.databaseService.query(builtQuery.query, builtQuery.values);
        return result.rows[0] ?? null;
    }
    async findByIdForBusiness(id, businessId, accessFilter) {
        const values = [id, businessId];
        const branchCondition = this.buildBranchAccessCondition('b.id', values, accessFilter?.allowedBranchIds);
        const result = await this.databaseService.query(`
        SELECT rs.*
        FROM ${TABLE_NAME} rs
        INNER JOIN resource r ON r.id = rs.resource_id
        INNER JOIN branch b ON b.id = r.branch_id
        WHERE rs.id = $1
          AND b.business_id = $2
          ${branchCondition}
      `, values);
        return result.rows[0] ?? null;
    }
    async resourceBelongsToBusiness(resourceId, businessId) {
        const result = await this.databaseService.query(`
        SELECT 1
        FROM resource r
        INNER JOIN branch b ON b.id = r.branch_id
        WHERE r.id = $1
          AND b.business_id = $2
        LIMIT 1
      `, [resourceId, businessId]);
        return result.rowCount === 1;
    }
    async resourceBelongsToBusinessAndAccess(resourceId, businessId, accessFilter) {
        const values = [resourceId, businessId];
        const branchCondition = this.buildBranchAccessCondition('b.id', values, accessFilter?.allowedBranchIds);
        const result = await this.databaseService.query(`
        SELECT 1
        FROM resource r
        INNER JOIN branch b ON b.id = r.branch_id
        WHERE r.id = $1
          AND b.business_id = $2
          ${branchCondition}
        LIMIT 1
      `, values);
        return result.rowCount === 1;
    }
    async remove(id, businessId, accessFilter) {
        if (businessId === undefined) {
            const result = await this.databaseService.query(`
          DELETE FROM ${TABLE_NAME}
          WHERE id = $1
        `, [id]);
            return result.rowCount === 1;
        }
        const values = [id, businessId];
        const branchCondition = this.buildBranchAccessCondition('b.id', values, accessFilter?.allowedBranchIds);
        const result = await this.databaseService.query(`
        DELETE FROM ${TABLE_NAME} rs
        USING resource r, branch b
        WHERE rs.id = $1
          AND rs.resource_id = r.id
          AND r.branch_id = b.id
          AND b.business_id = $2
          ${branchCondition}
      `, values);
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
};
exports.ResourceSchedulesRepository = ResourceSchedulesRepository;
exports.ResourceSchedulesRepository = ResourceSchedulesRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], ResourceSchedulesRepository);
//# sourceMappingURL=resource-schedules.repository.js.map