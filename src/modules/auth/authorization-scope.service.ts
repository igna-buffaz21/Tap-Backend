import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import type {
  AuthAuthorizationContext,
  AuthPermissionGrant,
} from './interfaces/auth-user.interface';
import type { RolePermissionAccessScope } from './interfaces/auth-user.interface';

const ACCESS_SCOPE_WEIGHT = {
  own: 1,
  branch: 2,
  business: 3,
} as const;

@Injectable()
export class AuthorizationScopeService {
  requireAuthorization(currentUser: User): AuthAuthorizationContext {
    if (!currentUser.authorization) {
      throw new ForbiddenException('Authorization context is required');
    }

    return currentUser.authorization;
  }

  isSuperadmin(currentUser: User): boolean {
    return this.requireAuthorization(currentUser).isSuperadmin;
  }

  resolveBusinessId(currentUser: User, requestedBusinessId?: unknown): number {
    const authorization = this.requireAuthorization(currentUser);

    if (authorization.isSuperadmin) {
      return this.parsePositiveInteger(requestedBusinessId, 'businessId');
    }

    if (authorization.businessId === null) {
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

  requirePermission(
    currentUser: User,
    permissionKey: string,
  ): AuthPermissionGrant {
    const authorization = this.requireAuthorization(currentUser);

    if (authorization.isSuperadmin) {
      return {
        key: permissionKey,
        access_scope: 'business',
      };
    }

    const accessScope = authorization.permissions[permissionKey];

    if (!accessScope) {
      throw new ForbiddenException(`Missing permission ${permissionKey}`);
    }

    return {
      key: permissionKey,
      access_scope: accessScope,
    };
  }

  assertCanAccessBranch(
    currentUser: User,
    permissionKey: string,
    branchIdValue: unknown,
  ): number {
    const branchId = this.parsePositiveInteger(branchIdValue, 'branchId');
    const authorization = this.requireAuthorization(currentUser);

    if (authorization.isSuperadmin) {
      return branchId;
    }

    const permission = this.requirePermission(currentUser, permissionKey);

    if (this.hasAtLeastScope(permission.access_scope, 'business')) {
      return branchId;
    }

    if (!authorization.branchIds.includes(branchId)) {
      throw new ForbiddenException('Branch is not assigned to user');
    }

    return branchId;
  }

  getAllowedBranchIds(
    currentUser: User,
    permissionKey: string,
  ): number[] | undefined {
    const authorization = this.requireAuthorization(currentUser);

    if (authorization.isSuperadmin) {
      return undefined;
    }

    const permission = this.requirePermission(currentUser, permissionKey);

    if (this.hasAtLeastScope(permission.access_scope, 'business')) {
      return undefined;
    }

    return authorization.branchIds;
  }

  hasOwnScope(currentUser: User, permissionKey: string): boolean {
    const authorization = this.requireAuthorization(currentUser);

    if (authorization.isSuperadmin) {
      return false;
    }

    return (
      this.requirePermission(currentUser, permissionKey).access_scope === 'own'
    );
  }

  hasAtLeastScope(
    accessScope: RolePermissionAccessScope,
    minimumScope: RolePermissionAccessScope,
  ): boolean {
    return (
      ACCESS_SCOPE_WEIGHT[accessScope] >= ACCESS_SCOPE_WEIGHT[minimumScope]
    );
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
