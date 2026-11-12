import { ApiProperty } from '@nestjs/swagger';
import { PRODUCT_IDENTIFICATION_TYPES } from '../product-identification.types';
import type { ProductIdentificationType } from '../product-identification.types';

export class CreateProductIdentificationDto {
  @ApiProperty({
    example: 12,
    description: 'Producto del negocio autenticado.',
  })
  product_id!: number;

  @ApiProperty({ enum: PRODUCT_IDENTIFICATION_TYPES, example: 'RFID_UHF' })
  type!: ProductIdentificationType;

  @ApiProperty({
    example: '00000001',
    maxLength: 255,
    description:
      'RFID_UHF: identificador hexadecimal de producto de 8 caracteres o EPC de 24 (4 prefijo + 8 producto + 12 serie). Se guardan solo los 8 caracteres del producto, en mayúsculas. EAN_13 y QR conservan su valor. Único por negocio, tipo y valor.',
  })
  value!: string;
}
