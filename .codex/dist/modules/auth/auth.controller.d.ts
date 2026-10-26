import { AuthService } from './auth.service';
import { AuthMeDto } from './dto/auth-me.dto';
import { User } from '../users/entities/user.entity';
import type { AuthenticatedRequest } from './interfaces/authenticated-request.interface';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    me(user: User, request: AuthenticatedRequest): Promise<AuthMeDto>;
}
