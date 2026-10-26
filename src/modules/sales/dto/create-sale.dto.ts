import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSaleItemDto {
  @ApiProperty({ example: 12 })
  product_id!: number;

  @ApiProperty({ example: 2 })
  quantity!: number;
}

export class CreateSaleDto {
  @ApiProperty({
    example: 2,
    description: 'Sucursal del negocio autorizado donde se registra la venta.',
  })
  branch_id!: number;

  @ApiPropertyOptional({ example: 45, nullable: true })
  customer_id?: number | null;

  @ApiProperty({ type: [CreateSaleItemDto], minItems: 1 })
  items!: CreateSaleItemDto[];

  @ApiPropertyOptional({ example: 500, default: 0 })
  discount_amount?: number;

  @ApiPropertyOptional({ example: 'Pago en efectivo' })
  notes?: string | null;
}
