import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BRANCH_TYPES, BranchType } from '../entities/branch.entity';

export class CreateBranchDto {
  @ApiProperty({ example: 1 })
  business_id!: number;

  @ApiProperty({ example: 'Centro' })
  name!: string;

  @ApiProperty({ example: 'centro' })
  slug!: string;

  @ApiPropertyOptional({ enum: BRANCH_TYPES, example: 'PADEL', nullable: true })
  branch_type?: BranchType | null;

  @ApiPropertyOptional({ example: 'Sucursal principal en Nueva Cordoba' })
  description?: string | null;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  logo_url?: string | null;

  @ApiPropertyOptional({ example: 'https://example.com/cover.png' })
  cover_image_url?: string | null;

  @ApiPropertyOptional({ example: 'https://instagram.com/turnero' })
  instagram_url?: string | null;

  @ApiPropertyOptional({ example: 'https://facebook.com/turnero' })
  facebook_url?: string | null;

  @ApiPropertyOptional({ example: 'Av. Siempre Viva 123' })
  address?: string | null;

  @ApiPropertyOptional({ example: '3515555555' })
  phone?: string | null;

  @ApiPropertyOptional({ example: 'ACTIVE', default: 'ACTIVE' })
  status?: string;
}
