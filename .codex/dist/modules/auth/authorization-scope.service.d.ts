import { User } from '../users/entities/user.entity';
import type { AuthAuthorizationContext, AuthPermissionGrant } from './interfaces/auth-user.interface';
import type { RolePermissionAccessScope } from '../roles/entities/role.entity';
export declare class AuthorizationScopeService {
    requireAuthorization(currentUser: User): AuthAuthorizationContext;
    isSuperadmin(currentUser: User): boolean;
    resolveBusinessId(currentUser: User, requestedBusinessId?: unknown): number;
    requirePermission(currentUser: User, permissionKey: string): AuthPermissionGrant;
    assertCanAccessBranch(currentUser: User, permissionKey: string, branchIdValue: unknown): number;
    getAllowedBranchIds(currentUser: User, permissionKey: string): number[] | undefined;
    hasOwnScope(currentUser: User, permissionKey: string): boolean;
    hasAtLeastScope(accessScope: RolePermissionAccessScope, minimumScope: RolePermissionAccessScope): boolean;
    parsePositiveInteger(value: unknown, field: string): number;
}
