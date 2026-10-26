import { ApiProperty } from '@nestjs/swagger';

export class BranchImageUploadSignatureDto {
  @ApiProperty({ example: 'demo' })
  cloud_name!: string;

  @ApiProperty({ example: '123456789012345' })
  api_key!: string;

  @ApiProperty({ example: 'https://api.cloudinary.com/v1_1/demo/image/upload' })
  upload_url!: string;

  @ApiProperty({ example: 'image' })
  resource_type!: 'image';

  @ApiProperty({ example: 1787654321 })
  timestamp!: number;

  @ApiProperty({
    example: 'turnero/branches/1/2/logo-1787654321',
  })
  public_id!: string;

  @ApiProperty({ example: 'c3d2d4a0a2c4f1b4e8f7c6a5b4d3e2f1a0b9c8d7' })
  signature!: string;
}
