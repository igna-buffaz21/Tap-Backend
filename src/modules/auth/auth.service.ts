import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AuthRbacRepository } from './auth-rbac.repository';
import { ClerkJwtService } from './clerk-jwt.service';
import { AuthMeDto } from './dto/auth-me.dto';
import {
  AuthAuthorizationContext,
  AuthUser,
  UserStatus,
} from './interfaces/auth-user.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly clerkJwtService: ClerkJwtService,
    private readonly usersService: UsersService,
    private readonly authRbacRepository: AuthRbacRepository,
    private readonly configService: ConfigService,
  ) {}

  async authenticate(
    authorizationHeader: string | undefined,
  ): Promise<AuthUser> {
    if (this.configService.get<string>('AUTH_DISABLED') === 'true') {
      return this.authenticateWithoutToken();
    }

    const token = this.extractBearerToken(authorizationHeader);
    const claims = await this.clerkJwtService.verifyToken(token);
    const user = await this.usersService.findAuthenticatedByClerkId(claims.sub);

    if (!user || user.status?.toUpperCase() !== 'ACTIVE') {
      throw new UnauthorizedException('User is not registered');
    }

    const authorization = await this.buildAuthorizationContext(user);
    user.authorization = authorization;

    return {
      clerkId: claims.sub,
      claims,
      user,
      authorization,
    };
  }

  private async authenticateWithoutToken(): Promise<AuthUser> {
    const configuredUserId = this.configService.get<string>('AUTH_DEV_USER_ID');
    const userId = configuredUserId
      ? this.normalizeRequiredPositiveInteger(
          configuredUserId,
          'AUTH_DEV_USER_ID',
        )
      : undefined;
    const user = await this.authRbacRepository.findDevelopmentUser(userId);
    if (!user) {
      throw new ServiceUnavailableException(
        'Token-free mode requires an active app_user in an active business; optionally set AUTH_DEV_USER_ID',
      );
    }

    const authorization = await this.buildAuthorizationContext(user);
    // Permisos temporales limitados al negocio del usuario real seleccionado.
    authorization.permissions = {
      'customer.manage': 'business',
      'stock.manage': 'business',
      'branch.manage': 'business',
      'user.read': 'business',
      'user.manage': 'business',
      'business.settings': 'business',
    };
    user.authorization = authorization;
    return {
      clerkId: user.clerk_id ?? '',
      claims: { sub: user.clerk_id ?? '' },
      user,
      authorization,
    };
  }

  async toMeResponse(
    user: User,
    authorization?: AuthAuthorizationContext,
  ): Promise<AuthMeDto> {
    const resolvedAuthorization =
      authorization ?? (await this.buildAuthorizationContext(user));

    return {
      id: user.id,
      clerkId: user.clerk_id ?? '',
      name: user.name,
      email: user.email,
      photoUrl: user.photo_url ?? '',
      status: this.normalizeStatus(user.status),
      business_id: resolvedAuthorization.businessId,
      branch_id: this.normalizeNullablePositiveInteger(
        user.branch_id,
        'user.branch_id',
      ),
      roles: resolvedAuthorization.roles,
      permissions: resolvedAuthorization.permissions,
    };
  }

  private extractBearerToken(authorizationHeader: string | undefined): string {
    if (!authorizationHeader) {
      throw new UnauthorizedException('Authorization bearer token is required');
    }

    const [type, token] = authorizationHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Authorization bearer token is required');
    }

    return token;
  }

  private normalizeStatus(status: string): UserStatus {
    const normalizedStatus = status.toLowerCase();

    if (normalizedStatus === 'active' || normalizedStatus === 'inactive') {
      return normalizedStatus;
    }

    throw new UnauthorizedException('Invalid user status');
  }

  private async buildAuthorizationContext(
    user: User,
  ): Promise<AuthAuthorizationContext> {
    const userId = this.normalizeRequiredPositiveInteger(user.id, 'user.id');
    const businessId = this.normalizeRequiredPositiveInteger(
      user.business_id,
      'user.business_id',
    );
    const branchIds = await this.authRbacRepository.findAssignedBranchIds(
      userId,
      businessId,
    );
    // El nuevo esquema no define permisos por rol. Denegar hasta configurar esa política.
    return {
      userId,
      businessId,
      branchIds,
      roles: [],
      permissions: {},
      isSuperadmin: false,
    };
  }

  private normalizeRequiredPositiveInteger(
    value: unknown,
    field: string,
  ): number {
    const parsed = Number(value);

    if (
      value === undefined ||
      value === null ||
      value === '' ||
      !Number.isInteger(parsed) ||
      parsed <= 0
    ) {
      throw new UnauthorizedException(`${field} must be a positive integer`);
    }

    return parsed;
  }

  private normalizeNullablePositiveInteger(
    value: unknown,
    field: string,
  ): number | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    return this.normalizeRequiredPositiveInteger(value, field);
  }
}
