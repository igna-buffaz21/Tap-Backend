import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '../auth.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.auth) {
      const authorizationHeader = request.headers.authorization;
      if (Array.isArray(authorizationHeader)) {
        throw new UnauthorizedException('Authorization header must be unique');
      }
      request.auth = await this.authService.authenticate(authorizationHeader);
    }

    const businessId = request.auth.authorization.businessId;
    if (!Number.isInteger(businessId) || !businessId || businessId <= 0) {
      throw new ForbiddenException('User must belong to a business');
    }

    for (const source of [request.params, request.query, request.body]) {
      for (const key of ['businessId', 'business_id']) {
        const value = source?.[key];
        if (value === undefined || value === null || value === '') continue;
        const values = Array.isArray(value) ? value : [value];
        if (values.some((item: unknown) => Number(item) !== businessId)) {
          throw new ForbiddenException('Cannot access another business');
        }
      }
    }

    return true;
  }
}
