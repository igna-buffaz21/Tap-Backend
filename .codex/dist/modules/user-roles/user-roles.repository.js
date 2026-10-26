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
exports.UserRolesRepository = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../database/database.service");
const TABLE_NAME = 'user_role';
const USER_TABLE = '"user"';
const ROLE_TABLE = '"role"';
const SUPERADMIN_ROLE_NAME = 'superadmin';
let UserRolesRepository = class UserRolesRepository {
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
    async findRoleAvailableForBusiness(roleId, businessId) {
        const result = await this.databaseService.query(`
        SELECT *
        FROM ${ROLE_TABLE}
        WHERE id = $1
          AND LOWER(name) <> $3
          AND (
            business_id IS NULL
            OR business_id = $2
          )
      `, [roleId, businessId, SUPERADMIN_ROLE_NAME]);
        return result.rows[0] ?? null;
    }
    async findAllAssignedToUser(userId, businessId) {
        const result = await this.databaseService.query(`
        SELECT
          r.*,
          ur.created_at AS assigned_at
        FROM ${TABLE_NAME} ur
        INNER JOIN ${ROLE_TABLE} r ON r.id = ur.role_id
        INNER JOIN ${USER_TABLE} u ON u.id = ur.user_id
        WHERE ur.user_id = $1
          AND u.business_id = $2
          AND (
            r.business_id IS NULL
            OR r.business_id = $2
          )
          AND LOWER(r.name) <> $3
        ORDER BY r.business_id NULLS FIRST, r.name ASC, r.id ASC
      `, [userId, businessId, SUPERADMIN_ROLE_NAME]);
        return result.rows;
    }
    async assignRoleToUser(userId, roleId) {
        const result = await this.databaseService.query(`
        INSERT INTO ${TABLE_NAME} (
          user_id,
          role_id
        )
        VALUES ($1, $2)
        RETURNING *
      `, [userId, roleId]);
        return result.rows[0];
    }
    async findAssignedRole(userId, roleId, businessId) {
        const result = await this.databaseService.query(`
        SELECT
          r.*,
          ur.created_at AS assigned_at
        FROM ${TABLE_NAME} ur
        INNER JOIN ${ROLE_TABLE} r ON r.id = ur.role_id
        INNER JOIN ${USER_TABLE} u ON u.id = ur.user_id
        WHERE ur.user_id = $1
          AND ur.role_id = $2
          AND u.business_id = $3
          AND (
            r.business_id IS NULL
            OR r.business_id = $3
          )
          AND LOWER(r.name) <> $4
      `, [userId, roleId, businessId, SUPERADMIN_ROLE_NAME]);
        return result.rows[0] ?? null;
    }
    async removeRoleFromUser(userId, roleId, businessId) {
        const result = await this.databaseService.query(`
        DELETE FROM ${TABLE_NAME} ur
        USING ${ROLE_TABLE} r, ${USER_TABLE} u
        WHERE ur.user_id = $1
          AND ur.role_id = $2
          AND r.id = ur.role_id
          AND u.id = ur.user_id
          AND u.business_id = $3
          AND (
            r.business_id IS NULL
            OR r.business_id = $3
          )
          AND LOWER(r.name) <> $4
      `, [userId, roleId, businessId, SUPERADMIN_ROLE_NAME]);
        return result.rowCount === 1;
    }
};
exports.UserRolesRepository = UserRolesRepository;
exports.UserRolesRepository = UserRolesRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], UserRolesRepository);
//# sourceMappingURL=user-roles.repository.js.map