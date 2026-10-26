import { ApiProperty } from '@nestjs/swagger';

export class UpdateCustomerStatusDto {
  @ApiProperty({ enum: ['ACTIVE', 'INACTIVE'], example: 'INACTIVE' })
  status!: string;
}
