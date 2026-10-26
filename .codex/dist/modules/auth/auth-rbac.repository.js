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
exports.AuthRbacRepository = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../database/database.service");
const USER_TABLE = '"user"';
const ROLE_TABLE = '"role"';
let AuthRbacRepository = class AuthRbacRepository {
    databaseService;
    constructor(databaseService) {
        this.databaseService = databaseService;
    }
    async findAssignedRolePermissionRows(userId, businessId) {
        const result = await this.databaseService.query(`
        SELECT
          r.id AS role_id,
          r.name AS role_name,
          r.status AS role_status,
          (
            r.business_id IS NULL
            AND LOWER(r.name) = 'superadmin'
          ) AS is_superadmin_role,
          p.key AS permission_key,
          rp.access_scope
        FROM user_role ur
        INNER JOIN ${USER_TABLE} u ON u.id = ur.user_id
        INNER JOIN ${ROLE_TABLE} r ON r.id = ur.role_id
        LEFT JOIN role_permission rp ON rp.role_id = r.id
        LEFT JOIN permission p ON p.id = rp.permission_id
        WHERE ur.user_id = $1
          AND r.status = 'active'
          AND (
            (
              $2::bigint IS NOT NULL
              AND u.business_id = $2
              AND (
                r.business_id IS NULL
                OR r.business_id = $2
              )
            )
            OR (
              $2::bigint IS NULL
              AND u.business_id IS NULL
              AND r.business_id IS NULL
            )
          )
        ORDER BY
          r.business_id NULLS FIRST,
          r.name ASC,
          r.id ASC,
          p.module ASC,
          p.key ASC,
          p.id ASC
      `, [userId, businessId]);
        return result.rows;
    }
    async findAssignedBranchIds(userId, businessId) {
        if (businessId === null) {
            return [];
        }
        const result = await this.databaseService.query(`
        SELECT ub.branch_id
        FROM user_branch ub
        INNER JOIN branch b ON b.id = ub.branch_id
        INNER JOIN ${USER_TABLE} u ON u.id = ub.user_id
        WHERE ub.user_id = $1
          AND u.business_id = $2
          AND b.business_id = $2
        ORDER BY ub.branch_id ASC
      `, [userId, businessId]);
        return result.rows.map((row) => Number(row.branch_id));
    }
};
exports.AuthRbacRepository = AuthRbacRepository;
exports.AuthRbacRepository = AuthRbacRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], AuthRbacRepository);
//# sourceMappingURL=auth-rbac.repository.js.map