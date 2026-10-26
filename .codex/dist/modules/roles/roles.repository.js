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
exports.RolesRepository = void 0;
const common_1 = require("@nestjs/common");
const sql_query_builder_1 = require("../../common/utils/sql-query-builder");
const database_service_1 = require("../../database/database.service");
const TABLE_NAME = '"role"';
const UPDATE_COLUMNS = ['name', 'description'];
const SUPERADMIN_ROLE_NAME = 'superadmin';
let RolesRepository = class RolesRepository {
    databaseService;
    constructor(databaseService) {
        this.databaseService = databaseService;
    }
    async createCustomRole(businessId, dto, client) {
        const result = await this.query(client, `
        INSERT INTO ${TABLE_NAME} (
          business_id,
          name,
          description,
          status
        )
        VALUES ($1, $2, $3, 'active')
        RETURNING *
      `, [businessId, dto.name, dto.description ?? null]);
        return result.rows[0];
    }
    async findAllAvailableForBusiness(businessId) {
        const result = await this.databaseService.query(`
        SELECT *
        FROM ${TABLE_NAME}
        WHERE (
            business_id IS NULL
            OR business_id = $1
          )
          AND LOWER(name) <> $2
        ORDER BY business_id NULLS FIRST, name ASC, id ASC
      `, [businessId, SUPERADMIN_ROLE_NAME]);
        return result.rows;
    }
    async findByIdAvailableForBusiness(id, businessId) {
        const result = await this.databaseService.query(`
        SELECT *
        FROM ${TABLE_NAME}
        WHERE id = $1
          AND LOWER(name) <> $3
          AND (
            business_id IS NULL
            OR business_id = $2
          )
      `, [id, businessId, SUPERADMIN_ROLE_NAME]);
        return result.rows[0] ?? null;
    }
    async findByIdAvailableWithPermissions(id, businessId) {
        const role = await this.findByIdAvailableForBusiness(id, businessId);
        if (!role) {
            return null;
        }
        return this.buildRoleWithPermissions(role);
    }
    async updateCustomRole(id, businessId, dto, client) {
        const builtQuery = (0, sql_query_builder_1.buildUpdateQuery)(TABLE_NAME, dto, UPDATE_COLUMNS, id);
        if (!builtQuery) {
            const result = await this.query(client, `
          SELECT *
          FROM ${TABLE_NAME}
          WHERE id = $1
            AND business_id = $2
        `, [id, businessId]);
            return result.rows[0] ?? null;
        }
        builtQuery.query = builtQuery.query.replace('WHERE id = $' + builtQuery.values.length, 'WHERE id = $' +
            builtQuery.values.length +
            ' AND business_id = $' +
            (builtQuery.values.length + 1));
        builtQuery.values.push(businessId);
        const result = await this.query(client, builtQuery.query, builtQuery.values);
        return result.rows[0] ?? null;
    }
    async deactivateCustomRole(id, businessId) {
        const result = await this.databaseService.query(`
        UPDATE ${TABLE_NAME}
        SET status = 'inactive'
        WHERE id = $1
          AND business_id = $2
        RETURNING *
      `, [id, businessId]);
        return result.rows[0] ?? null;
    }
    async buildRoleWithPermissions(role) {
        const result = await this.databaseService.query(`
        SELECT
          p.*,
          rp.access_scope,
          rp.created_at AS assigned_at
        FROM role_permission rp
        INNER JOIN permission p ON p.id = rp.permission_id
        WHERE rp.role_id = $1
        ORDER BY p.module ASC, p.key ASC, p.id ASC
      `, [role.id]);
        return {
            ...role,
            permissions: result.rows,
        };
    }
    query(client, text, values = []) {
        return client
            ? client.query(text, values)
            : this.databaseService.query(text, values);
    }
};
exports.RolesRepository = RolesRepository;
exports.RolesRepository = RolesRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], RolesRepository);
//# sourceMappingURL=roles.repository.js.map