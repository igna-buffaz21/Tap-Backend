import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCustomerDto {
  @ApiPropertyOptional({ example: 'Ignacio' })
  name?: string;

  @ApiPropertyOptional({ example: '543534133580' })
  phone?: string;

  @ApiPropertyOptional({ example: 'juan@gmail.com' })
  email?: string;
}
