import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStockMovementDto {
  @ApiProperty({
    example: 2,
    description:
      'Sucursal del movimiento. Se valida contra el negocio autorizado por el token.',
  })
  branch_id!: number;

  @ApiProperty({
    example: 12,
    description:
      'Producto del movimiento. Se valida contra el negocio autorizado por el token.',
  })
  product_id!: number;

  @ApiProperty({
    enum: ['IN', 'OUT', 'ADJUSTMENT'],
    example: 'IN',
  })
  type!: string;

  @ApiProperty({
    example: 3,
    description:
      'Cantidad a sumar/restar. Para ADJUSTMENT representa el stock final contado.',
  })
  quantity?: number;

  @ApiPropertyOptional({
    example: 1250.5,
    description: 'Costo unitario registrado para este movimiento.',
  })
  unit_cost?: number | null;

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

  @ApiPropertyOptional({ example: 'Compra semanal' })
  notes?: string | null;
}
