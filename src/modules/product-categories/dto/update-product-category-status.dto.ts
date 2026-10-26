import { ApiProperty } from '@nestjs/swagger';

export class UpdateProductCategoryStatusDto {
  @ApiProperty({
    enum: ['active', 'inactive'],
    example: 'inactive',
  })
  status!: string;
}
