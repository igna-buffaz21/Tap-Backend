import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProductCategoryDto {
  @ApiPropertyOptional({ example: 'Bebidas' })
  name?: string;

  @ApiPropertyOptional({ example: 'Productos liquidos para venta interna' })
  description?: string | null;
}
