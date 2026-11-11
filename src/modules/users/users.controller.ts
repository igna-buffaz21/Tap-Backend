import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Crear usuario' })
  @ApiBody({ type: CreateUserDto })
  create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.usersService.create(createUserDto, currentUser);
  }

  @Get()
  @ApiOperation({ summary: 'Listar usuarios' })
  @ApiQuery({ name: 'branchId', required: false, example: 3 })
  findAll(
    @CurrentUser() currentUser: User,
    @Query('branchId') branchId?: string,
  ) {
    return this.usersService.findAll(currentUser, branchId);
  }

  @Get(':id')
  @ApiParam({ name: 'id', example: 1 })
  findOne(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.usersService.findOne(+id, currentUser);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', example: 1 })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.usersService.update(+id, updateUserDto, currentUser);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', example: 1 })
  remove(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.usersService.remove(+id, currentUser);
  }
}
