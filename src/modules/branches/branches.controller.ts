import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { BranchesService } from './branches.service';
import { BranchImageUploadSignatureDto } from './dto/branch-image-upload-signature.dto';
import { CreateBranchDto } from './dto/create-branch.dto';
import { CreateBranchImageUploadSignatureDto } from './dto/create-branch-image-upload-signature.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@ApiTags('branches')
@ApiBearerAuth()
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear sucursal' })
  @ApiBody({ type: CreateBranchDto })
  create(
    @Body() createBranchDto: CreateBranchDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.branchesService.createForBusiness(createBranchDto, currentUser);
  }

  @Get()
  @ApiOperation({ summary: 'Listar sucursales' })
  findAll(@CurrentUser() currentUser: User) {
    return this.branchesService.findAllForBusiness(currentUser);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener sucursal por id' })
  findOne(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.branchesService.findOne(+id, currentUser);
  }

  @Post(':id/image-upload-signature')
  @ApiOperation({
    summary: 'Generar firma para subir imagen de sucursal a Cloudinary',
  })
  @ApiBody({ type: CreateBranchImageUploadSignatureDto })
  @ApiResponse({ status: 201, type: BranchImageUploadSignatureDto })
  createImageUploadSignature(
    @Param('id') id: string,
    @Body() dto: CreateBranchImageUploadSignatureDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.branchesService.createImageUploadSignature(
      +id,
      dto,
      currentUser,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar informacion editable de una sucursal' })
  @ApiBody({ type: UpdateBranchDto })
  update(
    @Param('id') id: string,
    @Body() updateBranchDto: UpdateBranchDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.branchesService.update(+id, updateBranchDto, currentUser);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.branchesService.removeForBusiness(+id, currentUser);
  }
}
