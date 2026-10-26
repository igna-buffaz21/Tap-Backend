import { ApiPropertyOptional } from '@nestjs/swagger';
export class UpdatePaymentDto {
  @ApiPropertyOptional({ example: 12500 }) amount?: number;
  @ApiPropertyOptional({ enum: ['PENDING', 'COMPLETED', 'CANCELLED'] })
  status?: 'PENDING' | 'COMPLETED' | 'CANCELLED';
}
