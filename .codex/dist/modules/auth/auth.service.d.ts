import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AuthRbacRepository } from './auth-rbac.repository';
import { ClerkJwtService } from './clerk-jwt.service';
import { AuthMeDto } from './dto/auth-me.dto';
import { AuthAuthorizationContext, AuthUser } from './interfaces/auth-user.interface';
export declare class AuthService {
    private readonly clerkJwtService;
    private readonly usersService;
    private readonly authRbacRepository;
    constructor(clerkJwtService: ClerkJwtService, usersService: UsersService, authRbacRepository: AuthRbacRepository);
    authenticate(authorizationHeader: string | undefined): Promise<AuthUser>;
    toMeResponse(user: User, authorization?: AuthAuthorizationContext): Promise<AuthMeDto>;
    private extractBearerToken;
    private normalizeStatus;
    private buildAuthorizationContext;
    private mergeEffectivePermission;
    private normalizeRequiredPositiveInteger;
    private normalizeNullablePositiveInteger;
}
