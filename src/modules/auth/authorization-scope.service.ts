import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import type { AuthAuthorizationContext } from './interfaces/auth-user.interface';

@Injectable()
export class AuthorizationScopeService {
  requireAuthorization(currentUser: User): AuthAuthorizationContext {
    if (!currentUser.authorization) {
      throw new ForbiddenException('Authorization context is required');
    }

    return currentUser.authorization;
  }

  resolveBusinessId(currentUser: User, requestedBusinessId?: unknown): number {
    const authorization = this.requireAuthorization(currentUser);

    if (
      !Number.isInteger(authorization.businessId) ||
      !authorization.businessId ||
      authorization.businessId <= 0
    ) {
      throw new ForbiddenException('User must belong to a business');
    }

    if (requestedBusinessId !== undefined) {
      const parsedBusinessId = this.parsePositiveInteger(
        requestedBusinessId,
        'businessId',
      );

      if (parsedBusinessId !== authorization.businessId) {
        throw new ForbiddenException('Cannot access another business');
      }
    }

    return authorization.businessId;
  }

  parsePositiveInteger(value: unknown, field: string): number {
    const parsed = Number(value);

    if (
      value === undefined ||
      value === null ||
      value === '' ||
      !Number.isInteger(parsed) ||
      parsed <= 0
    ) {
      throw new BadRequestException(`${field} must be a positive integer`);
    }

    return parsed;
  }
}
