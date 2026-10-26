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
exports.ResourceServicesRepository = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../database/database.service");
const TABLE_NAME = 'resource_service';
let ResourceServicesRepository = class ResourceServicesRepository {
    databaseService;
    constructor(databaseService) {
        this.databaseService = databaseService;
    }
    async create(createResourceServiceDto) {
        const result = await this.databaseService.query(`
        INSERT INTO ${TABLE_NAME} (
          resource_id,
          service_id
        )
        VALUES ($1, $2)
        RETURNING *
      `, [
            createResourceServiceDto.resource_id,
            createResourceServiceDto.service_id,
        ]);
        return result.rows[0];
    }
    async findAll() {
        const result = await this.databaseService.query(`
      SELECT *
      FROM ${TABLE_NAME}
      ORDER BY resource_id ASC, service_id ASC
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
        INNER JOIN service s ON s.id = rs.service_id
        INNER JOIN branch b ON b.id = r.branch_id
        WHERE b.business_id = $1
          AND s.branch_id = b.id
          ${branchCondition}
        ORDER BY rs.resource_id ASC, rs.service_id ASC
      `, values);
        return result.rows;
    }
    async resourceAndServiceBelongToBusiness(resourceId, serviceId, businessId, accessFilter) {
        const values = [resourceId, serviceId, businessId];
        const branchCondition = this.buildBranchAccessCondition('b.id', values, accessFilter?.allowedBranchIds);
        const result = await this.databaseService.query(`
        SELECT 1
        FROM resource r
        INNER JOIN service s ON s.id = $2
        INNER JOIN branch b ON b.id = r.branch_id
        WHERE r.id = $1
          AND s.branch_id = b.id
          AND b.business_id = $3
          ${branchCondition}
        LIMIT 1
      `, values);
        return result.rowCount === 1;
    }
    async remove(resourceId, serviceId, businessId, accessFilter) {
        if (businessId === undefined) {
            const result = await this.databaseService.query(`
          DELETE FROM ${TABLE_NAME}
          WHERE resource_id = $1
            AND service_id = $2
        `, [resourceId, serviceId]);
            return result.rowCount === 1;
        }
        const values = [resourceId, serviceId, businessId];
        const branchCondition = this.buildBranchAccessCondition('b.id', values, accessFilter?.allowedBranchIds);
        const result = await this.databaseService.query(`
        DELETE FROM ${TABLE_NAME} rs
        USING resource r, service s, branch b
        WHERE rs.resource_id = $1
          AND rs.service_id = $2
          AND r.id = rs.resource_id
          AND s.id = rs.service_id
          AND b.id = r.branch_id
          AND s.branch_id = b.id
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
exports.ResourceServicesRepository = ResourceServicesRepository;
exports.ResourceServicesRepository = ResourceServicesRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], ResourceServicesRepository);
//# sourceMappingURL=resource-services.repository.js.map