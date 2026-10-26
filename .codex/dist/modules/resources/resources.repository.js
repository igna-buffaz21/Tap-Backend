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
exports.ResourcesRepository = void 0;
const common_1 = require("@nestjs/common");
const sql_query_builder_1 = require("../../common/utils/sql-query-builder");
const database_service_1 = require("../../database/database.service");
const TABLE_NAME = 'resource';
const UPDATE_COLUMNS = [
    'branch_id',
    'name',
    'type',
    'capacity',
    'photo_url',
    'status',
    'is_indoor',
    'priority',
];
let ResourcesRepository = class ResourcesRepository {
    databaseService;
    constructor(databaseService) {
        this.databaseService = databaseService;
    }
    async create(createResourceDto) {
        const result = await this.databaseService.query(`
        INSERT INTO ${TABLE_NAME} (
          branch_id,
          name,
          type,
          capacity,
          photo_url,
          status,
          is_indoor,
          priority
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
            createResourceDto.branch_id,
            createResourceDto.name,
            createResourceDto.type,
            createResourceDto.capacity,
            createResourceDto.photo_url ?? null,
            createResourceDto.status ?? 'ACTIVE',
            createResourceDto.is_indoor ?? null,
            createResourceDto.priority ?? 1,
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
        const branchCondition = this.buildBranchAccessCondition('r.branch_id', values, accessFilter?.allowedBranchIds);
        const assignedResourceCondition = this.buildAssignedResourceCondition('r.id', values, accessFilter?.assignedUserId);
        const result = await this.databaseService.query(`
        SELECT r.*
        FROM ${TABLE_NAME} r
        INNER JOIN branch b ON b.id = r.branch_id
        WHERE b.business_id = $1
          ${branchCondition}
          ${assignedResourceCondition}
        ORDER BY r.id ASC
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
    async update(id, updateResourceDto, businessId, accessFilter) {
        const builtQuery = (0, sql_query_builder_1.buildUpdateQuery)(TABLE_NAME, updateResourceDto, UPDATE_COLUMNS, id);
        if (!builtQuery) {
            return businessId === undefined
                ? this.findById(id)
                : this.findByIdForBusiness(id, businessId, accessFilter);
        }
        if (businessId !== undefined) {
            const idParamIndex = builtQuery.values.length;
            builtQuery.values.push(businessId);
            const businessIdParamIndex = builtQuery.values.length;
            const branchCondition = this.buildBranchAccessCondition('resource.branch_id', builtQuery.values, accessFilter?.allowedBranchIds);
            const assignedResourceCondition = this.buildAssignedResourceCondition('resource.id', builtQuery.values, accessFilter?.assignedUserId);
            builtQuery.query = builtQuery.query.replace('WHERE id = $' + idParamIndex, 'WHERE id = $' +
                idParamIndex +
                ' AND branch_id IN (' +
                'SELECT id FROM branch WHERE business_id = $' +
                businessIdParamIndex +
                ') ' +
                branchCondition +
                ' ' +
                assignedResourceCondition);
        }
        const result = await this.databaseService.query(builtQuery.query, builtQuery.values);
        return result.rows[0] ?? null;
    }
    async findByIdForBusiness(id, businessId, accessFilter) {
        const values = [id, businessId];
        const branchCondition = this.buildBranchAccessCondition('r.branch_id', values, accessFilter?.allowedBranchIds);
        const assignedResourceCondition = this.buildAssignedResourceCondition('r.id', values, accessFilter?.assignedUserId);
        const result = await this.databaseService.query(`
        SELECT r.*
        FROM ${TABLE_NAME} r
        INNER JOIN branch b ON b.id = r.branch_id
        WHERE r.id = $1
          AND b.business_id = $2
          ${branchCondition}
          ${assignedResourceCondition}
      `, values);
        return result.rows[0] ?? null;
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
    async remove(id) {
        const result = await this.databaseService.query(`
        DELETE FROM ${TABLE_NAME}
        WHERE id = $1
      `, [id]);
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
    buildAssignedResourceCondition(resourceIdExpression, values, assignedUserId) {
        if (assignedUserId === undefined) {
            return '';
        }
        values.push(assignedUserId);
        return `
      AND EXISTS (
        SELECT 1
        FROM user_resource ur
        WHERE ur.resource_id = ${resourceIdExpression}
          AND ur.user_id = $${values.length}
      )
    `;
    }
};
exports.ResourcesRepository = ResourcesRepository;
exports.ResourcesRepository = ResourcesRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], ResourcesRepository);
//# sourceMappingURL=resources.repository.js.map