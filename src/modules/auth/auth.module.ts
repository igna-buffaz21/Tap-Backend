import { Global, Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AuthRbacRepository } from './auth-rbac.repository';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthorizationScopeService } from './authorization-scope.service';
import { ClerkJwtService } from './clerk-jwt.service';
import { ClerkAuthGuard } from './guards/clerk-auth.guard';
import { PermissionGuard } from './guards/permission.guard';

@Global()
@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRbacRepository,
    AuthorizationScopeService,
    ClerkJwtService,
    ClerkAuthGuard,
    PermissionGuard,
  ],
  exports: [
    AuthService,
    AuthorizationScopeService,
    ClerkJwtService,
    ClerkAuthGuard,
    PermissionGuard,
  ],
})
export class AuthModule {}
