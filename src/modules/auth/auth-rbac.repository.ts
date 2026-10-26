import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { User } from '../users/entities/user.entity';

const USER_TABLE = 'app_user';

@Injectable()
export class AuthRbacRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findDevelopmentUser(userId?: number): Promise<User | null> {
    const result = await this.databaseService.query<User>(
      `SELECT u.* FROM app_user u
       INNER JOIN business b ON b.id = u.business_id
       WHERE u.status = 'ACTIVE' AND b.status = 'ACTIVE'
         AND ($1::bigint IS NULL OR u.id = $1)
       ORDER BY u.id ASC LIMIT 1`,
      [userId ?? null],
    );
    return result.rows[0] ?? null;
  }

  async findAssignedBranchIds(
    userId: number,
    businessId: number | null,
  ): Promise<number[]> {
    if (businessId === null) {
      return [];
    }

    const result = await this.databaseService.query<{ branch_id: number }>(
      `
        SELECT ub.branch_id
        FROM user_branch ub
        INNER JOIN branch b ON b.id = ub.branch_id
        INNER JOIN ${USER_TABLE} u ON u.id = ub.user_id
        WHERE ub.user_id = $1
          AND u.business_id = $2
          AND b.business_id = $2
        ORDER BY ub.branch_id ASC
      `,
      [userId, businessId],
    );

    return result.rows.map((row) => Number(row.branch_id));
  }
}
