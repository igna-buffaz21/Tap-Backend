import { ApiProperty } from '@nestjs/swagger';
export class CompletePaymentDto {
  @ApiProperty({ example: 1 }) sale_id!: number;
}
