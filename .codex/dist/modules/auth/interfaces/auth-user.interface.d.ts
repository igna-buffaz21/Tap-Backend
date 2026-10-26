import { User } from '../../users/entities/user.entity';
import type { RolePermissionAccessScope } from '../../roles/entities/role.entity';
export type UserStatus = 'active' | 'inactive';
export interface AuthRoleSummary {
    id: number;
    name: string;
    status: string;
}
export interface AuthPermissionGrant {
    key: string;
    access_scope: RolePermissionAccessScope;
}
export interface AuthAuthorizationContext {
    userId: number;
    businessId: number | null;
    branchIds: number[];
    roles: AuthRoleSummary[];
    permissions: Record<string, RolePermissionAccessScope>;
    isSuperadmin: boolean;
}
export interface ClerkJwtPayload {
    sub: string;
    iss?: string;
    aud?: string | string[];
    exp?: number;
    nbf?: number;
    iat?: number;
    [claim: string]: unknown;
}
export interface AuthUser {
    clerkId: string;
    claims: ClerkJwtPayload;
    user: User;
    authorization: AuthAuthorizationContext;
    currentPermission?: AuthPermissionGrant;
}
