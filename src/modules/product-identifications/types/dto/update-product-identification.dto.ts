import { PartialType } from '@nestjs/swagger';
import { CreateProductIdentificationDto } from './create-product-identification.dto';

export class UpdateProductIdentificationDto extends PartialType(
  CreateProductIdentificationDto,
) {}
