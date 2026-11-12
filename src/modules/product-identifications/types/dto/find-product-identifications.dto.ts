import { ApiPropertyOptional } from '@nestjs/swagger';
import { PRODUCT_IDENTIFICATION_TYPES } from '../product-identification.types';
import type { ProductIdentificationType } from '../product-identification.types';

export class FindProductIdentificationsDto {
  @ApiPropertyOptional({ example: 12 })
  product_id?: number;

  @ApiPropertyOptional({ enum: PRODUCT_IDENTIFICATION_TYPES })
  type?: ProductIdentificationType;

  @ApiPropertyOptional({
    description:
      'Coincidencia exacta. Con type=RFID_UHF acepta el código de producto de 8 caracteres o extrae ese código del EPC de 24.',
    maxLength: 255,
  })
  value?: string;
}
