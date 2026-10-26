import { ApiProperty } from '@nestjs/swagger';

export type BranchImageType = 'logo' | 'cover';

export class CreateBranchImageUploadSignatureDto {
  @ApiProperty({ enum: ['logo', 'cover'], example: 'logo' })
  image_type!: BranchImageType;
}
