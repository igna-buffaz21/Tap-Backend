import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class CreateBusinessDto {
  @ApiProperty() name!: string;
  @ApiPropertyOptional({ enum: ['ACTIVE', 'INACTIVE'] }) status?: string;
}
