import { Injectable } from '@nestjs/common';
import { buildUpdateQuery } from '../../common/utils/sql-query-builder';
import { DatabaseService } from '../../database/database.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { Business } from './entities/business.entity';

const TABLE_NAME = 'business';
const UPDATE_COLUMNS = ['name', 'status'] as const;

@Injectable()
export class BusinessesRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(dto: CreateBusinessDto): Promise<Business> {
    const result = await this.databaseService.query<Business>(
      'INSERT INTO business (name, status) VALUES ($1, $2) RETURNING *',
      [dto.name, dto.status ?? 'ACTIVE'],
    );
    return result.rows[0];
  }

  async findAll(): Promise<Business[]> {
    const result = await this.databaseService.query<Business>(
      `
        SELECT *
        FROM ${TABLE_NAME}
      `,
    );

    return result.rows;
  }

  async findById(id: number): Promise<Business | null> {
    const result = await this.databaseService.query<Business>(
      `
        SELECT *
        FROM ${TABLE_NAME}
        WHERE id = $1
      `,
      [id],
    );

    return result.rows[0] ?? null;
  }

  async update(
    id: number,
    updateBusinessDto: UpdateBusinessDto,
  ): Promise<Business | null> {
    const builtQuery = buildUpdateQuery(
      TABLE_NAME,
      updateBusinessDto,
      UPDATE_COLUMNS,
      id,
    );

    if (!builtQuery) {
      return this.findById(id);
    }

    const result = await this.databaseService.query<Business>(
      builtQuery.query,
      builtQuery.values,
    );

    return result.rows[0] ?? null;
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
}
