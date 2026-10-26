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
exports.BranchStatsRepository = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../database/database.service");
let BranchStatsRepository = class BranchStatsRepository {
    databaseService;
    constructor(databaseService) {
        this.databaseService = databaseService;
    }
    async findBranchContext(branchId) {
        const result = await this.databaseService.query(`
        SELECT
          br.id,
          br.name,
          br.business_id,
          b.timezone
        FROM branch br
        INNER JOIN business b ON b.id = br.business_id
        WHERE br.id = $1
      `, [branchId]);
        return result.rows[0] ?? null;
    }
    async findActiveResources(branchId, resourceId, allowedResourceIds) {
        if (allowedResourceIds !== undefined && allowedResourceIds.length === 0) {
            return [];
        }
        const values = [branchId];
        const resourceFilter = resourceId
            ? `AND id = $${values.push(resourceId)}`
            : '';
        const allowedResourceFilter = allowedResourceIds === undefined
            ? ''
            : `AND id = ANY($${values.push(allowedResourceIds)}::bigint[])`;
        const result = await this.databaseService.query(`
        SELECT id, name
        FROM resource
        WHERE branch_id = $1
          AND UPPER(status) = 'ACTIVE'
          ${resourceFilter}
          ${allowedResourceFilter}
        ORDER BY priority ASC, name ASC
      `, values);
        return result.rows;
    }
    async findActiveSchedules(resourceIds) {
        if (resourceIds.length === 0) {
            return [];
        }
        const result = await this.databaseService.query(`
        SELECT resource_id, day_of_week, start_time::text, end_time::text
        FROM resource_schedule
        WHERE resource_id = ANY($1::int[])
          AND UPPER(status) = 'ACTIVE'
        ORDER BY resource_id ASC, day_of_week ASC, start_time ASC
      `, [resourceIds]);
        return result.rows;
    }
    async findBlocks(resourceIds, rangeStart, rangeEnd) {
        if (resourceIds.length === 0) {
            return [];
        }
        const result = await this.databaseService.query(`
        SELECT id, resource_id, start_at, end_at
        FROM resource_block
        WHERE resource_id = ANY($1::int[])
          AND start_at < $3
          AND end_at > $2
        ORDER BY resource_id ASC, start_at ASC
      `, [resourceIds, rangeStart, rangeEnd]);
        return result.rows;
    }
    async findBookings(branchId, rangeStart, rangeEnd, resourceId, serviceId, allowedResourceIds) {
        if (allowedResourceIds !== undefined && allowedResourceIds.length === 0) {
            return [];
        }
        const values = [branchId, rangeStart, rangeEnd];
        const resourceFilter = resourceId
            ? `AND b.resource_id = $${values.push(resourceId)}`
            : '';
        const serviceFilter = serviceId
            ? `AND b.service_id = $${values.push(serviceId)}`
            : '';
        const allowedResourceFilter = allowedResourceIds === undefined
            ? ''
            : `AND b.resource_id = ANY($${values.push(allowedResourceIds)}::bigint[])`;
        const result = await this.databaseService.query(`
        SELECT
          b.id,
          b.resource_id,
          b.service_id,
          b.start_at,
          b.end_at,
          b.status,
          s.price AS service_price
        FROM booking b
        INNER JOIN service s
          ON s.id = b.service_id
          AND s.branch_id = b.branch_id
        INNER JOIN resource r
          ON r.id = b.resource_id
          AND r.branch_id = b.branch_id
          AND UPPER(r.status) = 'ACTIVE'
        WHERE b.branch_id = $1
          AND b.start_at < $3
          AND b.end_at > $2
          ${resourceFilter}
          ${serviceFilter}
          ${allowedResourceFilter}
        ORDER BY b.start_at ASC
      `, values);
        return result.rows;
    }
    async serviceBelongsToBranch(serviceId, branchId) {
        const result = await this.databaseService.query(`
        SELECT 1
        FROM service
        WHERE id = $1
          AND branch_id = $2
        LIMIT 1
      `, [serviceId, branchId]);
        return result.rowCount === 1;
    }
    async findAssignedResourceIds(userId, branchId) {
        const result = await this.databaseService.query(`
        SELECT r.id
        FROM user_resource ur
        INNER JOIN resource r ON r.id = ur.resource_id
        WHERE ur.user_id = $1
          AND r.branch_id = $2
          AND UPPER(r.status) = 'ACTIVE'
        ORDER BY r.id ASC
      `, [userId, branchId]);
        return result.rows.map((row) => Number(row.id));
    }
};
exports.BranchStatsRepository = BranchStatsRepository;
exports.BranchStatsRepository = BranchStatsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], BranchStatsRepository);
//# sourceMappingURL=branch-stats.repository.js.map