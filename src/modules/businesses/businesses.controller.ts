import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SuperadminOnly } from '../auth/decorators/require-permission.decorator';
import { User } from '../users/entities/user.entity';
import { BusinessesService } from './businesses.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

@ApiTags('businesses')
@ApiBearerAuth()
@Controller('businesses')
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Post()
  @SuperadminOnly()
  @ApiOperation({ summary: 'Crear negocio' })
  @ApiBody({ type: CreateBusinessDto })
  create(@Body() createBusinessDto: CreateBusinessDto) {
    return this.businessesService.create(createBusinessDto);
  }

  @Get()
  @SuperadminOnly()
  @ApiOperation({ summary: 'Listar negocios' })
  findAll() {
    return this.businessesService.findAll();
  }

  @Get(':id')
  @SuperadminOnly()
  @ApiOperation({ summary: 'Obtener negocio por id' })
  findOne(@Param('id') id: string) {
    return this.businessesService.findOne(+id);
  }

  @Patch(':id')
  @SuperadminOnly()
  update(
    @Param('id') id: string,
    @Body() updateBusinessDto: UpdateBusinessDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.businessesService.update(+id, updateBusinessDto, currentUser);
  }
}
