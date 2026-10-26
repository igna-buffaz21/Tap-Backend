import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class CreatePaymentDto {
  @ApiProperty({ example: 1 }) sale_id!: number;
  @ApiProperty({ example: 12500 }) amount!: number;
  @ApiPropertyOptional({ enum: ['PENDING', 'COMPLETED'], default: 'COMPLETED' })
  status?: 'PENDING' | 'COMPLETED';
}
