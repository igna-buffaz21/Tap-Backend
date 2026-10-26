import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  BRANCH_TYPES,
  BranchOpeningHours,
  BranchType,
} from '../entities/branch.entity';

const OPENING_HOURS_EXAMPLE: BranchOpeningHours = {
  monday: [{ open: '08:00', close: '22:00' }],
  tuesday: [{ open: '08:00', close: '22:00' }],
  wednesday: [{ open: '08:00', close: '22:00' }],
  thursday: [{ open: '08:00', close: '22:00' }],
  friday: [{ open: '16:00', close: '00:00' }],
  saturday: [],
  sunday: [],
};

export class UpdateBranchDto {
  @ApiPropertyOptional({ example: 'Centro' })
  name?: string;

  @ApiPropertyOptional({ example: 'centro' })
  slug?: string;

  @ApiPropertyOptional({ enum: BRANCH_TYPES, example: 'PADEL', nullable: true })
  branch_type?: BranchType | null;

  @ApiPropertyOptional({ example: 'Sucursal principal en Nueva Cordoba' })
  description?: string | null;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  logo_url?: string | null;

  @ApiPropertyOptional({ example: 'https://example.com/cover.png' })
  cover_image_url?: string | null;

  @ApiPropertyOptional({ example: '#0F766E' })
  primary_color?: string | null;

  @ApiPropertyOptional({ example: 'https://instagram.com/turnero' })
  instagram_url?: string | null;

  @ApiPropertyOptional({ example: 'https://facebook.com/turnero' })
  facebook_url?: string | null;

  @ApiPropertyOptional({ example: 'Av. Siempre Viva 123' })
  address?: string;

  @ApiPropertyOptional({ example: '3515555555' })
  phone?: string;

  @ApiPropertyOptional({ example: -31.420083, nullable: true })
  lat?: number | null;

  @ApiPropertyOptional({ example: -64.188776, nullable: true })
  lng?: number | null;

  @ApiPropertyOptional({
    example: OPENING_HOURS_EXAMPLE,
    description:
      'Weekly opening hours. A closing time earlier than the opening time closes on the next day (for example, 16:00 to 00:00).',
    nullable: true,
    type: Object,
  })
  opening_hours?: BranchOpeningHours | null;
}
