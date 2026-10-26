import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductCategoryDto {
  @ApiProperty({ example: 'Bebidas' })
  name!: string;

  @ApiPropertyOptional({ example: 'Productos liquidos para venta interna' })
  description?: string | null;

  @ApiPropertyOptional({
    enum: ['active', 'inactive'],
    default: 'active',
    example: 'active',
  })
  status?: string;
}
