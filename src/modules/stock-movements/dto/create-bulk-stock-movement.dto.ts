import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBulkStockMovementItemDto {
  @ApiProperty({
    example: 12,
    description:
      'Producto del movimiento. Se valida contra el negocio autorizado por el token.',
  })
  productId!: number;

  @ApiProperty({ example: 24 })
  quantity!: number;

  @ApiPropertyOptional({
    example: 1250.5,
    description: 'Costo unitario registrado para este item del movimiento.',
  })
  unitCost?: number | null;
}

export class CreateBulkStockMovementDto {
  @ApiProperty({
    example: 3,
    description:
      'Sucursal del movimiento. Se valida contra el negocio autorizado por el token.',
  })
  branchId!: number;

  @ApiProperty({
    enum: ['IN', 'OUT'],
    example: 'IN',
  })
  type!: string;

  @ApiPropertyOptional({
    enum: [
      'PURCHASE',
      'SALE',
      'SALE_CANCELLATION',
      'INTERNAL_USE',
      'LOSS',
      'DAMAGE',
      'RETURN',
      'MANUAL_ADJUSTMENT',
      'OTHER',
    ],
    example: 'PURCHASE',
  })
  reason?: string | null;

  @ApiPropertyOptional({ example: 'Compra semanal al proveedor' })
  notes?: string | null;

  @ApiProperty({ type: [CreateBulkStockMovementItemDto] })
  items!: CreateBulkStockMovementItemDto[];
}
