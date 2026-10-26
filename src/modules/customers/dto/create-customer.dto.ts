import { ApiProperty } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Ignacio' })
  name!: string;

  @ApiProperty({ example: '543534133580' })
  phone!: string;

  @ApiProperty({ example: 'ignacio@example.com' })
  email!: string;
}
