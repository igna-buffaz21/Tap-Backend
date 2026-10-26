import { Injectable } from '@nestjs/common';
import { buildUpdateQuery } from '../../common/utils/sql-query-builder';
import { DatabaseService } from '../../database/database.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { Branch, BranchOpeningHours } from './entities/branch.entity';

const TABLE_NAME = 'branch';
const UPDATE_COLUMNS = [
  'name',
  'slug',
  'branch_type',
  'description',
  'logo_url',
  'cover_image_url',
  'primary_color',
  'instagram_url',
  'facebook_url',
  'address',
  'phone',
  'lat',
  'lng',
  'opening_hours',
] as const;

type BranchRow = Omit<Branch, 'lat' | 'lng' | 'opening_hours'> & {
  lat: number | string | null;
  lng: number | string | null;
  opening_hours: BranchOpeningHours | string | null;
};

@Injectable()
export class BranchesRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(createBranchDto: CreateBranchDto): Promise<Branch> {
    const result = await this.databaseService.query<BranchRow>(
      `
        INSERT INTO ${TABLE_NAME} (
          business_id,
          name,
          slug,
          description,
          logo_url,
          cover_image_url,
          instagram_url,
          facebook_url,
          address,
          phone,
          status,
          branch_type
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `,
      [
        createBranchDto.business_id,
        createBranchDto.name,
        createBranchDto.slug,
        createBranchDto.description ?? null,
        createBranchDto.logo_url ?? null,
        createBranchDto.cover_image_url ?? null,
        createBranchDto.instagram_url ?? null,
        createBranchDto.facebook_url ?? null,
        createBranchDto.address,
        createBranchDto.phone,
        createBranchDto.status ?? 'ACTIVE',
        createBranchDto.branch_type ?? null,
      ],
    );

    return this.mapBranch(result.rows[0]);
  }

  async findAll(): Promise<Branch[]> {
    const result = await this.databaseService.query<BranchRow>(`
      SELECT *
      FROM ${TABLE_NAME}
    `);

    return result.rows.map((branch) => this.mapBranch(branch));
  }

  async findAllForBusiness(
    businessId: number,
    allowedBranchIds?: number[],
  ): Promise<Branch[]> {
    const values: unknown[] = [businessId];
    const branchCondition = this.buildBranchAccessCondition(
      'id',
      values,
      allowedBranchIds,
    );
    const result = await this.databaseService.query<BranchRow>(
      `
        SELECT *
        FROM ${TABLE_NAME}
        WHERE business_id = $1
          ${branchCondition}
        ORDER BY name ASC, id ASC
      `,
      values,
    );

    return result.rows.map((branch) => this.mapBranch(branch));
  }

  async findById(id: number): Promise<Branch | null> {
    const result = await this.databaseService.query<BranchRow>(
      `
        SELECT *
        FROM ${TABLE_NAME}
        WHERE id = $1
      `,
      [id],
    );

    return result.rows[0] ? this.mapBranch(result.rows[0]) : null;
  }

  async update(
    id: number,
    updateBranchDto: UpdateBranchDto,
    businessId?: number,
  ): Promise<Branch | null> {
    const builtQuery = buildUpdateQuery(
      TABLE_NAME,
      updateBranchDto,
      UPDATE_COLUMNS,
      id,
    );

    if (!builtQuery) {
      return businessId === undefined
        ? this.findById(id)
        : this.findByIdForBusiness(id, businessId);
    }

    if (businessId !== undefined) {
      builtQuery.query = builtQuery.query.replace(
        'WHERE id = $' + builtQuery.values.length,
        'WHERE id = $' +
          builtQuery.values.length +
          ' AND business_id = $' +
          (builtQuery.values.length + 1),
      );
      builtQuery.values.push(businessId);
    }

    const result = await this.databaseService.query<BranchRow>(
      builtQuery.query,
      builtQuery.values,
    );

    return result.rows[0] ? this.mapBranch(result.rows[0]) : null;
  }

  async findByIdForBusiness(
    id: number,
    businessId: number,
    allowedBranchIds?: number[],
  ): Promise<Branch | null> {
    const values: unknown[] = [id, businessId];
    const branchCondition = this.buildBranchAccessCondition(
      'id',
      values,
      allowedBranchIds,
    );
    const result = await this.databaseService.query<BranchRow>(
      `
        SELECT *
        FROM ${TABLE_NAME}
        WHERE id = $1
          AND business_id = $2
          ${branchCondition}
      `,
      values,
    );

    return result.rows[0] ? this.mapBranch(result.rows[0]) : null;
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

  async removeForBusiness(id: number, businessId: number): Promise<boolean> {
    const result = await this.databaseService.query(
      `
        DELETE FROM ${TABLE_NAME}
        WHERE id = $1
          AND business_id = $2
      `,
      [id, businessId],
    );

    return result.rowCount === 1;
  }

  private buildBranchAccessCondition(
    branchIdExpression: string,
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

    return `AND ${branchIdExpression} = ANY($${values.length}::bigint[])`;
  }

  private mapBranch(branch: BranchRow): Branch {
    return {
      ...branch,
      branch_type: branch.branch_type ?? null,
      lat: this.mapNullableNumber(branch.lat),
      lng: this.mapNullableNumber(branch.lng),
      opening_hours: this.mapOpeningHours(branch.opening_hours),
    };
  }

  private mapNullableNumber(value: number | string | null): number | null {
    return value === null ? null : Number(value);
  }

  private mapOpeningHours(
    value: BranchOpeningHours | string | null,
  ): BranchOpeningHours | null {
    return typeof value === 'string'
      ? (JSON.parse(value) as BranchOpeningHours)
      : value;
  }
}
