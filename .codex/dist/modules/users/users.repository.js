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
exports.UsersRepository = void 0;
const common_1 = require("@nestjs/common");
const sql_query_builder_1 = require("../../common/utils/sql-query-builder");
const database_service_1 = require("../../database/database.service");
const TABLE_NAME = '"user"';
const USER_BRANCH_TABLE = 'user_branch';
const USER_ROLE_TABLE = 'user_role';
const BRANCH_TABLE = 'branch';
const ROLE_TABLE = '"role"';
const SUPERADMIN_ROLE_NAME = 'superadmin';
const UPDATE_COLUMNS = [
    'clerk_id',
    'business_id',
    'name',
    'email',
    'photo_url',
    'status',
];
let UsersRepository = class UsersRepository {
    databaseService;
    constructor(databaseService) {
        this.databaseService = databaseService;
    }
    async create(createUserDto) {
        const client = await this.databaseService.getClient();
        const legacyRole = createUserDto.role ?? 'user';
        try {
            await client.query('BEGIN');
            const result = await client.query(`
          INSERT INTO ${TABLE_NAME} (
            clerk_id,
            business_id,
            name,
            email,
            photo_url,
            role,
            status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `, [
                createUserDto.clerk_id,
                createUserDto.business_id ?? null,
                createUserDto.name,
                createUserDto.email,
                createUserDto.photo_url ?? null,
                legacyRole,
                createUserDto.status ?? 'active',
            ]);
            const user = result.rows[0];
            if (createUserDto.branch_id !== undefined &&
                createUserDto.branch_id !== null) {
                await client.query(`
            INSERT INTO ${USER_BRANCH_TABLE} (user_id, branch_id)
            VALUES ($1, $2)
          `, [user.id, createUserDto.branch_id]);
                user.branch_id = createUserDto.branch_id;
            }
            else {
                user.branch_id = null;
            }
            await client.query('COMMIT');
            return user;
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    async findAll() {
        const result = await this.databaseService.query(`
      SELECT
        u.*,
        ub.branch_id,
        COALESCE(ur.roles, '[]'::json) AS roles
      FROM ${TABLE_NAME} u
      LEFT JOIN LATERAL (
        SELECT branch_id
        FROM ${USER_BRANCH_TABLE}
        WHERE user_id = u.id
        ORDER BY branch_id ASC
        LIMIT 1
      ) ub ON true
      ${this.buildUserRolesJoin()}
    `);
        return result.rows;
    }
    async findAllForBusiness(businessId, branchId, allowedBranchIds) {
        if (branchId !== undefined) {
            return this.findAllByBranchForBusiness(branchId, businessId);
        }
        const values = [businessId];
        const branchAccessCondition = this.buildUserBranchAccessCondition('u.id', values, allowedBranchIds);
        const result = await this.databaseService.query(`
        SELECT
          u.*,
          ub.branch_id,
          COALESCE(ur.roles, '[]'::json) AS roles
        FROM ${TABLE_NAME} u
        LEFT JOIN LATERAL (
          SELECT branch_id
          FROM ${USER_BRANCH_TABLE}
          WHERE user_id = u.id
          ORDER BY branch_id ASC
          LIMIT 1
        ) ub ON true
        ${this.buildUserRolesJoin()}
        WHERE u.business_id = $1
          ${branchAccessCondition}
        ORDER BY u.name ASC, u.id ASC
      `, values);
        return result.rows;
    }
    async findAllByBranch(branchId) {
        const result = await this.databaseService.query(`
        SELECT
          u.*,
          ub.branch_id,
          COALESCE(ur.roles, '[]'::json) AS roles
        FROM ${TABLE_NAME} u
        INNER JOIN ${USER_BRANCH_TABLE} ub
          ON ub.user_id = u.id
        ${this.buildUserRolesJoin()}
        WHERE ub.branch_id = $1
        ORDER BY u.name ASC, u.id ASC
      `, [branchId]);
        return result.rows;
    }
    async findAllByBranchForBusiness(branchId, businessId) {
        const result = await this.databaseService.query(`
        SELECT
          u.*,
          ub.branch_id,
          COALESCE(ur.roles, '[]'::json) AS roles
        FROM ${TABLE_NAME} u
        INNER JOIN ${USER_BRANCH_TABLE} ub
          ON ub.user_id = u.id
        ${this.buildUserRolesJoin()}
        WHERE ub.branch_id = $1
          AND u.business_id = $2
        ORDER BY u.name ASC, u.id ASC
      `, [branchId, businessId]);
        return result.rows;
    }
    async findById(id) {
        const result = await this.databaseService.query(`
        SELECT
          u.*,
          ub.branch_id,
          COALESCE(ur.roles, '[]'::json) AS roles
        FROM ${TABLE_NAME} u
        LEFT JOIN LATERAL (
          SELECT branch_id
          FROM ${USER_BRANCH_TABLE}
          WHERE user_id = u.id
          ORDER BY branch_id ASC
          LIMIT 1
        ) ub ON true
        ${this.buildUserRolesJoin()}
        WHERE u.id = $1
      `, [id]);
        return result.rows[0] ?? null;
    }
    async findByIdForBusiness(id, businessId, allowedBranchIds) {
        const values = [id, businessId];
        const branchAccessCondition = this.buildUserBranchAccessCondition('u.id', values, allowedBranchIds);
        const result = await this.databaseService.query(`
        SELECT
          u.*,
          ub.branch_id,
          COALESCE(ur.roles, '[]'::json) AS roles
        FROM ${TABLE_NAME} u
        LEFT JOIN LATERAL (
          SELECT branch_id
          FROM ${USER_BRANCH_TABLE}
          WHERE user_id = u.id
          ORDER BY branch_id ASC
          LIMIT 1
        ) ub ON true
        ${this.buildUserRolesJoin()}
        WHERE u.id = $1
          AND u.business_id = $2
          ${branchAccessCondition}
      `, values);
        return result.rows[0] ?? null;
    }
    async findByClerkId(clerkId) {
        const result = await this.databaseService.query(`
        SELECT
          u.*,
          ub.branch_id,
          COALESCE(ur.roles, '[]'::json) AS roles
        FROM ${TABLE_NAME} u
        LEFT JOIN LATERAL (
          SELECT branch_id
          FROM ${USER_BRANCH_TABLE}
          WHERE user_id = u.id
          ORDER BY branch_id ASC
          LIMIT 1
        ) ub ON true
        ${this.buildUserRolesJoin()}
        WHERE u.clerk_id = $1
      `, [clerkId]);
        return result.rows[0] ?? null;
    }
    async findByEmail(email) {
        const result = await this.databaseService.query(`
        SELECT
          u.*,
          ub.branch_id,
          COALESCE(ur.roles, '[]'::json) AS roles
        FROM ${TABLE_NAME} u
        LEFT JOIN LATERAL (
          SELECT branch_id
          FROM ${USER_BRANCH_TABLE}
          WHERE user_id = u.id
          ORDER BY branch_id ASC
          LIMIT 1
        ) ub ON true
        ${this.buildUserRolesJoin()}
        WHERE lower(u.email) = lower($1)
      `, [email]);
        return result.rows[0] ?? null;
    }
    async createPendingInvitation(record) {
        const client = await this.databaseService.getClient();
        try {
            await client.query('BEGIN');
            const result = await client.query(`
          INSERT INTO ${TABLE_NAME} (
            clerk_id,
            business_id,
            name,
            email,
            photo_url,
            role,
            status
          )
          VALUES (NULL, $1, $2, $3, NULL, 'member', 'pending')
          RETURNING *
        `, [record.businessId, record.name, record.email]);
            const user = result.rows[0];
            if (record.roleIds.length > 0) {
                await client.query(`
            INSERT INTO ${USER_ROLE_TABLE} (user_id, role_id)
            SELECT $1, unnest($2::bigint[])
          `, [user.id, record.roleIds]);
            }
            if (record.branchIds.length > 0) {
                await client.query(`
            INSERT INTO ${USER_BRANCH_TABLE} (user_id, branch_id)
            SELECT $1, unnest($2::bigint[])
          `, [user.id, record.branchIds]);
            }
            await client.query('COMMIT');
            user.branch_id = record.branchIds[0] ?? null;
            return user;
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    async activatePendingUserFromClerk(record) {
        const result = await this.databaseService.query(`
        UPDATE ${TABLE_NAME}
        SET
          clerk_id = $2,
          name = $3,
          photo_url = $4,
          status = 'active',
          updated_at = NOW()
        WHERE lower(email) = lower($1)
          AND clerk_id IS NULL
          AND status = 'pending'
        RETURNING *
      `, [record.email, record.clerkId, record.name, record.photoUrl]);
        const user = result.rows[0];
        if (!user) {
            return null;
        }
        return this.findById(user.id);
    }
    async removePendingInvitation(userId, businessId) {
        const result = await this.databaseService.query(`
        DELETE FROM ${TABLE_NAME}
        WHERE id = $1
          AND business_id = $2
          AND clerk_id IS NULL
          AND status = 'pending'
      `, [userId, businessId]);
        return result.rowCount === 1;
    }
    async findAvailableActiveRolesByIds(roleIds, businessId) {
        if (roleIds.length === 0) {
            return [];
        }
        const result = await this.databaseService.query(`
        SELECT id, business_id, name, status
        FROM ${ROLE_TABLE}
        WHERE id = ANY($1::bigint[])
          AND status = 'active'
          AND LOWER(name) <> $3
          AND (
            business_id IS NULL
            OR business_id = $2
          )
      `, [roleIds, businessId, SUPERADMIN_ROLE_NAME]);
        return result.rows;
    }
    async findBranchIdsForBusiness(branchIds, businessId) {
        if (branchIds.length === 0) {
            return [];
        }
        const result = await this.databaseService.query(`
        SELECT id
        FROM ${BRANCH_TABLE}
        WHERE id = ANY($1::bigint[])
          AND business_id = $2
      `, [branchIds, businessId]);
        return result.rows.map((row) => Number(row.id));
    }
    async branchBelongsToBusiness(branchId, businessId) {
        const result = await this.databaseService.query(`
        SELECT 1
        FROM ${BRANCH_TABLE}
        WHERE id = $1
          AND business_id = $2
        LIMIT 1
      `, [branchId, businessId]);
        return result.rowCount === 1;
    }
    async updateForBusiness(id, businessId, updateUserDto, allowedBranchIds) {
        const current = await this.findByIdForBusiness(id, businessId, allowedBranchIds);
        if (!current) {
            return null;
        }
        return this.update(id, updateUserDto);
    }
    async removeForBusiness(id, businessId, allowedBranchIds) {
        const current = await this.findByIdForBusiness(id, businessId, allowedBranchIds);
        if (!current) {
            return false;
        }
        return this.remove(id);
    }
    async update(id, updateUserDto) {
        const { branch_id, ...userUpdateDto } = updateUserDto;
        const builtQuery = (0, sql_query_builder_1.buildUpdateQuery)(TABLE_NAME, userUpdateDto, UPDATE_COLUMNS, id);
        if (!builtQuery &&
            !Object.prototype.hasOwnProperty.call(updateUserDto, 'branch_id')) {
            return this.findById(id);
        }
        const client = await this.databaseService.getClient();
        try {
            await client.query('BEGIN');
            let userExists = true;
            if (builtQuery) {
                const result = await client.query(builtQuery.query, builtQuery.values);
                userExists = result.rowCount === 1;
            }
            else {
                const result = await client.query(`
            SELECT 1
            FROM ${TABLE_NAME}
            WHERE id = $1
          `, [id]);
                userExists = result.rowCount === 1;
            }
            if (!userExists) {
                await client.query('COMMIT');
                return null;
            }
            if (Object.prototype.hasOwnProperty.call(updateUserDto, 'branch_id')) {
                await client.query(`
            DELETE FROM ${USER_BRANCH_TABLE}
            WHERE user_id = $1
          `, [id]);
                if (branch_id !== null && branch_id !== undefined) {
                    await client.query(`
              INSERT INTO ${USER_BRANCH_TABLE} (user_id, branch_id)
              VALUES ($1, $2)
            `, [id, branch_id]);
                }
            }
            await client.query('COMMIT');
            return this.findById(id);
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    async remove(id) {
        const result = await this.databaseService.query(`
        DELETE FROM ${TABLE_NAME}
        WHERE id = $1
      `, [id]);
        return result.rowCount === 1;
    }
    buildUserBranchAccessCondition(userIdExpression, values, allowedBranchIds) {
        if (allowedBranchIds === undefined) {
            return '';
        }
        if (allowedBranchIds.length === 0) {
            return 'AND FALSE';
        }
        values.push(allowedBranchIds);
        return `
      AND EXISTS (
        SELECT 1
        FROM ${USER_BRANCH_TABLE} scope_ub
        WHERE scope_ub.user_id = ${userIdExpression}
          AND scope_ub.branch_id = ANY($${values.length}::bigint[])
      )
    `;
    }
    buildUserRolesJoin() {
        return `
      LEFT JOIN LATERAL (
        SELECT json_agg(
          json_build_object(
            'id', r.id,
            'name', r.name,
            'status', r.status
          )
          ORDER BY r.business_id NULLS FIRST, r.name ASC, r.id ASC
        ) AS roles
        FROM ${USER_ROLE_TABLE} user_role_scope
        INNER JOIN ${ROLE_TABLE} r
          ON r.id = user_role_scope.role_id
        WHERE user_role_scope.user_id = u.id
          AND LOWER(r.name) <> '${SUPERADMIN_ROLE_NAME}'
      ) ur ON true
    `;
    }
};
exports.UsersRepository = UsersRepository;
exports.UsersRepository = UsersRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], UsersRepository);
//# sourceMappingURL=users.repository.js.map