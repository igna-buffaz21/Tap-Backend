import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiPropertyOptional({
    example: 3,
    nullable: true,
    description:
      'Categoria del producto. Se valida contra el negocio autorizado por el token.',
  })
  category_id?: number | null;

  @ApiProperty({ example: 'Agua mineral 500ml' })
  name!: string;

  @ApiPropertyOptional({ example: 'Botella individual' })
  description?: string | null;

  @ApiPropertyOptional({ example: 'AGUA-500' })
  sku?: string | null;

  @ApiPropertyOptional({
    enum: ['unit', 'kg', 'g', 'l', 'ml', 'box', 'pack'],
    default: 'unit',
    example: 'unit',
  })
  unit?: string;

  @ApiPropertyOptional({
    example: 1200.5,
    nullable: true,
  })
  cost_price?: number | null;

  @ApiPropertyOptional({
    example: 1800,
    nullable: true,
  })
  sale_price?: number | null;

  @ApiPropertyOptional({
    example: 2,
    description:
      'Sucursal donde se crea el stock inicial del producto. Se valida contra ' +
      'el negocio autorizado por el token.',
  })
  branch_id?: number;

  @ApiPropertyOptional({
    example: 5,
    default: 0,
    description:
      'Stock minimo inicial para la sucursal indicada en branch_id.',
  })
  minimum_quantity?: number;

  @ApiPropertyOptional({
    enum: ['active', 'inactive'],
    default: 'active',
    example: 'active',
  })
  status?: string;
}
