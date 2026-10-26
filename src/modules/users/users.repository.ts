import { Injectable } from '@nestjs/common';
import { buildUpdateQuery } from '../../common/utils/sql-query-builder';
import { DatabaseService } from '../../database/database.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

const TABLE_NAME = 'app_user';
const USER_BRANCH_TABLE = 'user_branch';
const BRANCH_TABLE = 'branch';
const UPDATE_COLUMNS = [
  'clerk_id',
  'business_id',
  'name',
  'email',
  'status',
] as const;

@Injectable()
export class UsersRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const client = await this.databaseService.getClient();
    const legacyRole =
      (createUserDto as CreateUserDto & { role?: string }).role ?? 'EMPLOYEE';

    try {
      await client.query('BEGIN');

      const result = await client.query<User>(
        `
          INSERT INTO ${TABLE_NAME} (
            clerk_id,
            business_id,
            name,
            email,
            role,
            status
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `,
        [
          createUserDto.clerk_id,
          createUserDto.business_id ?? null,
          createUserDto.name,
          createUserDto.email,
          legacyRole,
          createUserDto.status ?? 'ACTIVE',
        ],
      );

      const user = result.rows[0];

      if (
        createUserDto.branch_id !== undefined &&
        createUserDto.branch_id !== null
      ) {
        await client.query(
          `
            INSERT INTO ${USER_BRANCH_TABLE} (user_id, branch_id)
            VALUES ($1, $2)
          `,
          [user.id, createUserDto.branch_id],
        );

        user.branch_id = createUserDto.branch_id;
      } else {
        user.branch_id = null;
      }

      await client.query('COMMIT');

      return user;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findAll(): Promise<User[]> {
    const result = await this.databaseService.query<User>(`
      SELECT
        u.*,
        ub.branch_id
      FROM ${TABLE_NAME} u
      LEFT JOIN LATERAL (
        SELECT branch_id
        FROM ${USER_BRANCH_TABLE}
        WHERE user_id = u.id
        ORDER BY branch_id ASC
        LIMIT 1
      ) ub ON true
    `);

    return result.rows;
  }

  async findAllForBusiness(
    businessId: number,
    branchId?: number,
    allowedBranchIds?: number[],
  ): Promise<User[]> {
    if (branchId !== undefined) {
      return this.findAllByBranchForBusiness(branchId, businessId);
    }

    const values: unknown[] = [businessId];
    const branchAccessCondition = this.buildUserBranchAccessCondition(
      'u.id',
      values,
      allowedBranchIds,
    );
    const result = await this.databaseService.query<User>(
      `
        SELECT
          u.*,
          ub.branch_id
        FROM ${TABLE_NAME} u
        LEFT JOIN LATERAL (
          SELECT branch_id
          FROM ${USER_BRANCH_TABLE}
          WHERE user_id = u.id
          ORDER BY branch_id ASC
          LIMIT 1
        ) ub ON true
        WHERE u.business_id = $1
          ${branchAccessCondition}
        ORDER BY u.name ASC, u.id ASC
      `,
      values,
    );

    return result.rows;
  }

  async findAllByBranch(branchId: number): Promise<User[]> {
    const result = await this.databaseService.query<User>(
      `
        SELECT
          u.*,
          ub.branch_id
        FROM ${TABLE_NAME} u
        INNER JOIN ${USER_BRANCH_TABLE} ub
          ON ub.user_id = u.id
        WHERE ub.branch_id = $1
        ORDER BY u.name ASC, u.id ASC
      `,
      [branchId],
    );

    return result.rows;
  }

  async findAllByBranchForBusiness(
    branchId: number,
    businessId: number,
  ): Promise<User[]> {
    const result = await this.databaseService.query<User>(
      `
        SELECT
          u.*,
          ub.branch_id
        FROM ${TABLE_NAME} u
        INNER JOIN ${USER_BRANCH_TABLE} ub
          ON ub.user_id = u.id
        WHERE ub.branch_id = $1
          AND u.business_id = $2
        ORDER BY u.name ASC, u.id ASC
      `,
      [branchId, businessId],
    );

    return result.rows;
  }

  async findById(id: number): Promise<User | null> {
    const result = await this.databaseService.query<User>(
      `
        SELECT
          u.*,
          ub.branch_id
        FROM ${TABLE_NAME} u
        LEFT JOIN LATERAL (
          SELECT branch_id
          FROM ${USER_BRANCH_TABLE}
          WHERE user_id = u.id
          ORDER BY branch_id ASC
          LIMIT 1
        ) ub ON true
        WHERE u.id = $1
      `,
      [id],
    );

    return result.rows[0] ?? null;
  }

  async findByIdForBusiness(
    id: number,
    businessId: number,
    allowedBranchIds?: number[],
  ): Promise<User | null> {
    const values: unknown[] = [id, businessId];
    const branchAccessCondition = this.buildUserBranchAccessCondition(
      'u.id',
      values,
      allowedBranchIds,
    );
    const result = await this.databaseService.query<User>(
      `
        SELECT
          u.*,
          ub.branch_id
        FROM ${TABLE_NAME} u
        LEFT JOIN LATERAL (
          SELECT branch_id
          FROM ${USER_BRANCH_TABLE}
          WHERE user_id = u.id
          ORDER BY branch_id ASC
          LIMIT 1
        ) ub ON true
        WHERE u.id = $1
          AND u.business_id = $2
          ${branchAccessCondition}
      `,
      values,
    );

    return result.rows[0] ?? null;
  }

  async findByClerkId(clerkId: string): Promise<User | null> {
    const result = await this.databaseService.query<User>(
      `
        SELECT
          u.*,
          ub.branch_id
        FROM ${TABLE_NAME} u
        LEFT JOIN LATERAL (
          SELECT branch_id
          FROM ${USER_BRANCH_TABLE}
          WHERE user_id = u.id
          ORDER BY branch_id ASC
          LIMIT 1
        ) ub ON true
        WHERE u.clerk_id = $1
      `,
      [clerkId],
    );

    return result.rows[0] ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.databaseService.query<User>(
      `
        SELECT
          u.*,
          ub.branch_id
        FROM ${TABLE_NAME} u
        LEFT JOIN LATERAL (
          SELECT branch_id
          FROM ${USER_BRANCH_TABLE}
          WHERE user_id = u.id
          ORDER BY branch_id ASC
          LIMIT 1
        ) ub ON true
        WHERE lower(u.email) = lower($1)
      `,
      [email],
    );

    return result.rows[0] ?? null;
  }

  async findBranchIdsForBusiness(
    branchIds: number[],
    businessId: number,
  ): Promise<number[]> {
    if (branchIds.length === 0) {
      return [];
    }

    const result = await this.databaseService.query<{ id: number }>(
      `
        SELECT id
        FROM ${BRANCH_TABLE}
        WHERE id = ANY($1::bigint[])
          AND business_id = $2
      `,
      [branchIds, businessId],
    );

    return result.rows.map((row) => Number(row.id));
  }

  async branchBelongsToBusiness(
    branchId: number,
    businessId: number,
  ): Promise<boolean> {
    const result = await this.databaseService.query(
      `
        SELECT 1
        FROM ${BRANCH_TABLE}
        WHERE id = $1
          AND business_id = $2
        LIMIT 1
      `,
      [branchId, businessId],
    );

    return result.rowCount === 1;
  }

  async updateForBusiness(
    id: number,
    businessId: number,
    updateUserDto: UpdateUserDto,
    allowedBranchIds?: number[],
  ): Promise<User | null> {
    const current = await this.findByIdForBusiness(
      id,
      businessId,
      allowedBranchIds,
    );

    if (!current) {
      return null;
    }

    return this.update(id, updateUserDto);
  }

  async removeForBusiness(
    id: number,
    businessId: number,
    allowedBranchIds?: number[],
  ): Promise<boolean> {
    const current = await this.findByIdForBusiness(
      id,
      businessId,
      allowedBranchIds,
    );

    if (!current) {
      return false;
    }

    return this.remove(id);
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User | null> {
    const { branch_id, ...userUpdateDto } = updateUserDto;
    const builtQuery = buildUpdateQuery(
      TABLE_NAME,
      userUpdateDto,
      UPDATE_COLUMNS,
      id,
    );

    if (
      !builtQuery &&
      !Object.prototype.hasOwnProperty.call(updateUserDto, 'branch_id')
    ) {
      return this.findById(id);
    }

    const client = await this.databaseService.getClient();

    try {
      await client.query('BEGIN');

      let userExists = true;

      if (builtQuery) {
        const result = await client.query<User>(
          builtQuery.query,
          builtQuery.values,
        );
        userExists = result.rowCount === 1;
      } else {
        const result = await client.query(
          `
            SELECT 1
            FROM ${TABLE_NAME}
            WHERE id = $1
          `,
          [id],
        );
        userExists = result.rowCount === 1;
      }

      if (!userExists) {
        await client.query('COMMIT');
        return null;
      }

      if (Object.prototype.hasOwnProperty.call(updateUserDto, 'branch_id')) {
        await client.query(
          `
            DELETE FROM ${USER_BRANCH_TABLE}
            WHERE user_id = $1
          `,
          [id],
        );

        if (branch_id !== null && branch_id !== undefined) {
          await client.query(
            `
              INSERT INTO ${USER_BRANCH_TABLE} (user_id, branch_id)
              VALUES ($1, $2)
            `,
            [id, branch_id],
          );
        }
      }

      await client.query('COMMIT');

      return this.findById(id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.databaseService.query(
      `
        DELETE FROM ${TABLE_NAME}
        WHERE id = $1
      `,
      [id],
    );

    return result.rowCount === 1;
  }

  private buildUserBranchAccessCondition(
    userIdExpression: string,
    values: unknown[],
    allowedBranchIds?: number[],
  ): string {
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
}
