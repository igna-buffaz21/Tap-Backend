import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { UserStatus } from '../interfaces/auth-user.interface';

export class AuthMeRoleDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Administrador' })
  name!: string;

  @ApiProperty({ example: 'active', enum: ['active', 'inactive'] })
  status!: string;
}

export class AuthMeDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'user_xxx' })
  clerkId!: string;

  @ApiProperty({ example: 'Nombre' })
  name!: string;

  @ApiProperty({ example: 'mail@test.com' })
  email!: string;

  @ApiProperty({ example: '' })
  photoUrl!: string;

  @ApiProperty({ example: 'active', enum: ['active', 'inactive'] })
  status!: UserStatus;

  @ApiPropertyOptional({ example: null, nullable: true })
  business_id!: number | null;

  @ApiPropertyOptional({ example: null, nullable: true })
  branch_id!: number | null;

  @ApiProperty({ type: [AuthMeRoleDto] })
  roles!: AuthMeRoleDto[];
}
