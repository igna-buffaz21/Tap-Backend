import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifyToken } from '@clerk/express';
import { ClerkJwtPayload } from './interfaces/auth-user.interface';

@Injectable()
export class ClerkJwtService {
  constructor(private readonly configService: ConfigService) {}

  async verifyToken(token: string): Promise<ClerkJwtPayload> {
    try {
      const payload = (await verifyToken(token, {
        secretKey: this.getSecretKey(),
        jwtKey: this.configService.get<string>('CLERK_JWT_KEY'),
        audience: this.configService.get<string>('CLERK_AUDIENCE'),
        authorizedParties: this.getAuthorizedParties(),
      })) as ClerkJwtPayload | undefined;

      if (!payload?.sub) {
        throw new UnauthorizedException('Invalid token subject');
      }

      return payload;
    } catch (error) {
      if (
        error instanceof ServiceUnavailableException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      throw new UnauthorizedException(
        `Invalid Clerk token: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private getSecretKey(): string {
    const secretKey = this.configService.get<string>('CLERK_SECRET_KEY');

    if (!secretKey) {
      throw new ServiceUnavailableException('CLERK_SECRET_KEY is required');
    }

    return secretKey;
  }

  private getAuthorizedParties(): string[] | undefined {
    const authorizedParties = this.configService.get<string>(
      'CLERK_AUTHORIZED_PARTIES',
    );

    return authorizedParties
      ?.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }
}
