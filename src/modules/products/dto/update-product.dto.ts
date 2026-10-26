import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProductDto {
  @ApiPropertyOptional({
    example: 3,
    nullable: true,
    description:
      'Nueva categoria del producto. Se valida contra el negocio autorizado por el token.',
  })
  category_id?: number | null;

  @ApiPropertyOptional({ example: 'Agua mineral 500ml' })
  name?: string;

  @ApiPropertyOptional({ example: 'Botella individual' })
  description?: string | null;

  @ApiPropertyOptional({ example: 'AGUA-500' })
  sku?: string | null;

  @ApiPropertyOptional({
    enum: ['unit', 'kg', 'g', 'l', 'ml', 'box', 'pack'],
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
}
