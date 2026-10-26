import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  REQUIRED_PERMISSION_KEY,
  SKIP_PERMISSION_CHECK_KEY,
  SUPERADMIN_ONLY_KEY,
} from '../decorators/require-permission.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';
import type { RolePermissionAccessScope } from '../interfaces/auth-user.interface';

const PATH_PERMISSION_MAP: Record<string, string> = {
  payments: 'stock.manage',
  customers: 'customer.manage',
  products: 'stock.manage',
  'product-categories': 'stock.manage',
  'product-stocks': 'stock.manage',
  'stock-movements': 'stock.manage',
  sales: 'stock.manage',
  branches: 'branch.manage',
  users: 'user.manage',
  businesses: 'business.settings',
};

const ACCESS_SCOPE_WEIGHT = {
  own: 1,
  branch: 2,
  business: 3,
} as const;

const BRANCH_HINT_REQUIRED_SEGMENTS = new Set([
  'customers',
  'users',
  'products',
  'product-categories',
  'product-stocks',
  'stock-movements',
  'sales',
]);

const SCOPE_HANDLED_BY_SERVICE_SEGMENTS = new Set([
  'branches',
  'payments',
  'customers',
  'products',
  'product-categories',
  'product-stocks',
  'stock-movements',
  'sales',
  'users',
]);

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (this.isPublic(context) || this.shouldSkipPermissionCheck(context)) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const auth = request.auth;

    if (!auth) {
      throw new ForbiddenException('Authenticated user is required');
    }

    if (this.isSuperadminOnly(context)) {
      if (!auth.authorization.isSuperadmin) {
        throw new ForbiddenException('Superadmin role is required');
      }

      return true;
    }

    if (auth.authorization.isSuperadmin) {
      return true;
    }

    const requiredPermissions = this.resolveRequiredPermissions(
      context,
      request,
    );
    const permissionGrant = this.resolvePermissionGrant(
      requiredPermissions,
      auth.authorization.permissions,
    );

    if (!permissionGrant) {
      throw new ForbiddenException(
        `Missing permission ${requiredPermissions.join(' or ')}`,
      );
    }

    this.validateTenantHints(request);
    this.validateScopeHints(request, permissionGrant.accessScope);

    auth.currentPermission = {
      key: permissionGrant.permission,
      access_scope: permissionGrant.accessScope,
    };

    return true;
  }

  private isPublic(context: ExecutionContext): boolean {
    return Boolean(
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]),
    );
  }

  private shouldSkipPermissionCheck(context: ExecutionContext): boolean {
    return Boolean(
      this.reflector.getAllAndOverride<boolean>(SKIP_PERMISSION_CHECK_KEY, [
        context.getHandler(),
        context.getClass(),
      ]),
    );
  }

  private isSuperadminOnly(context: ExecutionContext): boolean {
    return Boolean(
      this.reflector.getAllAndOverride<boolean>(SUPERADMIN_ONLY_KEY, [
        context.getHandler(),
        context.getClass(),
      ]),
    );
  }

  private resolveRequiredPermissions(
    context: ExecutionContext,
    request: AuthenticatedRequest,
  ): string[] {
    const explicitPermission = this.reflector.getAllAndOverride<
      string | string[]
    >(REQUIRED_PERMISSION_KEY, [context.getHandler(), context.getClass()]);

    if (explicitPermission) {
      return Array.isArray(explicitPermission)
        ? explicitPermission
        : [explicitPermission];
    }

    const firstSegment = this.getFirstPathSegment(request);
    const mappedPermission = firstSegment
      ? PATH_PERMISSION_MAP[firstSegment]
      : undefined;

    if (!mappedPermission) {
      throw new ForbiddenException('Permission is not configured for endpoint');
    }

    return [mappedPermission];
  }

  private resolvePermissionGrant(
    requiredPermissions: string[],
    permissions: Record<string, RolePermissionAccessScope>,
  ): { permission: string; accessScope: RolePermissionAccessScope } | null {
    for (const permission of requiredPermissions) {
      const accessScope = permissions[permission];

      if (accessScope) {
        return { permission, accessScope };
      }
    }

    return null;
  }

  private validateTenantHints(request: AuthenticatedRequest): void {
    const businessId = request.auth?.authorization.businessId;

    if (businessId === null || businessId === undefined) {
      return;
    }

    for (const value of this.collectValues(request, [
      'businessId',
      'business_id',
    ])) {
      if (this.parsePositiveInteger(value) !== businessId) {
        throw new ForbiddenException('Cannot access another business');
      }
    }
  }

  private validateScopeHints(
    request: AuthenticatedRequest,
    accessScope: RolePermissionAccessScope,
  ): void {
    if (
      SCOPE_HANDLED_BY_SERVICE_SEGMENTS.has(
        this.getFirstPathSegment(request) ?? '',
      )
    ) {
      return;
    }

    if (this.hasAtLeastScope(accessScope, 'business')) {
      return;
    }

    if (this.hasAtLeastScope(accessScope, 'branch')) {
      this.validateBranchHints(request, true);
      return;
    }

    this.validateOwnHints(request);
    this.validateBranchHints(request, false);
  }

  private validateBranchHints(
    request: AuthenticatedRequest,
    requireHintForBranchOwnedEndpoint: boolean,
  ): void {
    const branchIds = request.auth?.authorization.branchIds ?? [];
    const values = this.collectValues(request, [
      'branchId',
      'branch_id',
      'branchIds',
      'branch_ids',
    ]);

    if (
      requireHintForBranchOwnedEndpoint &&
      values.length === 0 &&
      BRANCH_HINT_REQUIRED_SEGMENTS.has(this.getFirstPathSegment(request) ?? '')
    ) {
      throw new ForbiddenException('Branch scope requires branchId');
    }

    for (const value of values) {
      const branchId = this.parsePositiveInteger(value);

      if (!branchIds.includes(branchId)) {
        throw new ForbiddenException('Branch is not assigned to user');
      }
    }
  }

  private validateOwnHints(request: AuthenticatedRequest): void {
    const userId = request.auth?.authorization.userId;
    const values = this.collectValues(request, [
      'userId',
      'user_id',
      'assignedUserId',
      'assigned_user_id',
      'createdByUserId',
      'created_by_user_id',
    ]);

    if (values.length === 0) {
      throw new ForbiddenException('Own scope requires userId');
    }

    for (const value of values) {
      if (this.parsePositiveInteger(value) !== userId) {
        throw new ForbiddenException('Cannot access another user scope');
      }
    }
  }

  private hasAtLeastScope(
    accessScope: RolePermissionAccessScope,
    minimumScope: RolePermissionAccessScope,
  ): boolean {
    return (
      ACCESS_SCOPE_WEIGHT[accessScope] >= ACCESS_SCOPE_WEIGHT[minimumScope]
    );
  }

  private collectValues(
    request: AuthenticatedRequest,
    keys: string[],
  ): unknown[] {
    const values: unknown[] = [];

    for (const source of [request.params, request.query, request.body]) {
      if (!source || typeof source !== 'object') {
        continue;
      }

      for (const key of keys) {
        const value = (source as Record<string, unknown>)[key];

        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            values.push(...value);
          } else {
            values.push(value);
          }
        }
      }
    }

    return values;
  }

  private getFirstPathSegment(request: AuthenticatedRequest): string | null {
    const path = request.route?.path;
    const firstSegment =
      typeof path === 'string'
        ? path.split('/').filter(Boolean)[0]
        : request.path.split('/').filter(Boolean)[0];

    return firstSegment ?? null;
  }

  private parsePositiveInteger(value: unknown): number {
    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new ForbiddenException('Invalid authorization scope value');
    }

    return parsed;
  }
}
