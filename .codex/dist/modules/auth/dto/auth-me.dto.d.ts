import type { RolePermissionAccessScope } from '../../roles/entities/role.entity';
import type { UserStatus } from '../interfaces/auth-user.interface';
export declare class AuthMeRoleDto {
    id: number;
    name: string;
    status: string;
}
export declare class AuthMeDto {
    id: number;
    clerkId: string;
    name: string;
    email: string;
    photoUrl: string;
    status: UserStatus;
    business_id: number | null;
    branch_id: number | null;
    roles: AuthMeRoleDto[];
    permissions: Record<string, RolePermissionAccessScope>;
}
