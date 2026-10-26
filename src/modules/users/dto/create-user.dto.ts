import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'user_xxx' })
  clerk_id!: string;

  @ApiPropertyOptional({ example: 1, nullable: true })
  business_id?: number | null;

  @ApiPropertyOptional({ example: 2, nullable: true })
  branch_id?: number | null;

  @ApiPropertyOptional({
    example: 'Nombre',
    description: 'Opcional: si no se envia, se toma desde Clerk.',
  })
  name?: string;

  @ApiPropertyOptional({
    example: 'mail@test.com',
    description: 'Opcional: si no se envia, se toma desde Clerk.',
  })
  email?: string;

  @ApiPropertyOptional({
    example: '',
    nullable: true,
    description: 'Opcional: si no se envia, se toma desde Clerk.',
  })
  photo_url?: string | null;

  @ApiPropertyOptional({ example: 'active', enum: ['active', 'inactive'] })
  status?: string;
}
