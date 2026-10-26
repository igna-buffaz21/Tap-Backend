import { ApiProperty } from '@nestjs/swagger';

export class UpdateProductStatusDto {
  @ApiProperty({
    enum: ['active', 'inactive'],
    example: 'inactive',
  })
  status!: string;
}
