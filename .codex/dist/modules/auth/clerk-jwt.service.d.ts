import { ConfigService } from '@nestjs/config';
import { ClerkJwtPayload } from './interfaces/auth-user.interface';
export declare class ClerkJwtService {
    private readonly configService;
    constructor(configService: ConfigService);
    verifyToken(token: string): Promise<ClerkJwtPayload>;
    private getSecretKey;
    private getAuthorizedParties;
}
