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
exports.UserResourcesRepository = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../database/database.service");
const TABLE_NAME = 'user_resource';
const USER_TABLE = '"user"';
const RESOURCE_TABLE = 'resource';
const BRANCH_TABLE = 'branch';
let UserResourcesRepository = class UserResourcesRepository {
    databaseService;
    constructor(databaseService) {
        this.databaseService = databaseService;
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
    async findUserBusinessId(userId) {
        const result = await this.databaseService.query(`
        SELECT business_id
        FROM ${USER_TABLE}
        WHERE id = $1
        LIMIT 1
      `, [userId]);
        const businessId = result.rows[0]?.business_id;
        return businessId === undefined || businessId === null
            ? null
            : Number(businessId);
    }
    async resourceBelongsToBusinessAndAccess(resourceId, businessId, accessFilter) {
        const values = [resourceId, businessId];
        const branchCondition = this.buildBranchAccessCondition('r.branch_id', values, accessFilter?.allowedBranchIds);
        const result = await this.databaseService.query(`
        SELECT 1
        FROM ${RESOURCE_TABLE} r
        INNER JOIN ${BRANCH_TABLE} b ON b.id = r.branch_id
        WHERE r.id = $1
          AND b.business_id = $2
          ${branchCondition}
        LIMIT 1
      `, values);
        return result.rowCount === 1;
    }
    async findAllAssignedToUser(userId, businessId, accessFilter) {
        const values = [userId, businessId];
        const branchCondition = this.buildBranchAccessCondition('r.branch_id', values, accessFilter?.allowedBranchIds);
        const result = await this.databaseService.query(`
        SELECT
          r.*,
          ur.created_at AS assigned_at
        FROM ${TABLE_NAME} ur
        INNER JOIN ${RESOURCE_TABLE} r ON r.id = ur.resource_id
        INNER JOIN ${BRANCH_TABLE} b ON b.id = r.branch_id
        INNER JOIN ${USER_TABLE} u ON u.id = ur.user_id
        WHERE ur.user_id = $1
          AND u.business_id = $2
          AND b.business_id = $2
          ${branchCondition}
        ORDER BY r.branch_id ASC, r.name ASC, r.id ASC
      `, values);
        return result.rows;
    }
    async assignResourceToUser(userId, resourceId) {
        const result = await this.databaseService.query(`
        INSERT INTO ${TABLE_NAME} (
          user_id,
          resource_id
        )
        VALUES ($1, $2)
        RETURNING *
      `, [userId, resourceId]);
        return result.rows[0];
    }
    async findAssignedResource(userId, resourceId, businessId, accessFilter) {
        const values = [userId, resourceId, businessId];
        const branchCondition = this.buildBranchAccessCondition('r.branch_id', values, accessFilter?.allowedBranchIds);
        const result = await this.databaseService.query(`
        SELECT
          r.*,
          ur.created_at AS assigned_at
        FROM ${TABLE_NAME} ur
        INNER JOIN ${RESOURCE_TABLE} r ON r.id = ur.resource_id
        INNER JOIN ${BRANCH_TABLE} b ON b.id = r.branch_id
        INNER JOIN ${USER_TABLE} u ON u.id = ur.user_id
        WHERE ur.user_id = $1
          AND ur.resource_id = $2
          AND u.business_id = $3
          AND b.business_id = $3
          ${branchCondition}
      `, values);
        return result.rows[0] ?? null;
    }
    async removeResourceFromUser(userId, resourceId, businessId, accessFilter) {
        const values = [userId, resourceId, businessId];
        const branchCondition = this.buildBranchAccessCondition('r.branch_id', values, accessFilter?.allowedBranchIds);
        const result = await this.databaseService.query(`
        DELETE FROM ${TABLE_NAME} ur
        USING ${RESOURCE_TABLE} r, ${BRANCH_TABLE} b, ${USER_TABLE} u
        WHERE ur.user_id = $1
          AND ur.resource_id = $2
          AND r.id = ur.resource_id
          AND b.id = r.branch_id
          AND u.id = ur.user_id
          AND u.business_id = $3
          AND b.business_id = $3
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
exports.UserResourcesRepository = UserResourcesRepository;
exports.UserResourcesRepository = UserResourcesRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], UserResourcesRepository);
//# sourceMappingURL=user-resources.repository.js.map