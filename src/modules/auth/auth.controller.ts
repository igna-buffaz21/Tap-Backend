import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ClerkAuthGuard } from './guards/clerk-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { SkipPermissionCheck } from './decorators/require-permission.decorator';
import { AuthMeDto } from './dto/auth-me.dto';
import { User } from '../users/entities/user.entity';
import type { AuthenticatedRequest } from './interfaces/authenticated-request.interface';

@ApiTags('auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @UseGuards(ClerkAuthGuard)
  @SkipPermissionCheck()
  @ApiOperation({ summary: 'Obtener usuario autenticado' })
  @ApiOkResponse({ type: AuthMeDto })
  me(
    @CurrentUser() user: User,
    @Req() request: AuthenticatedRequest,
  ): Promise<AuthMeDto> {
    return this.authService.toMeResponse(user, request.auth?.authorization);
  }
}
