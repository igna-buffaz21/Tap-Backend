import { Permission } from '../../permissions/entities/permission.entity';
export type RoleStatus = 'active' | 'inactive';
export type RolePermissionAccessScope = 'own' | 'branch' | 'business';
export declare class Role {
    id: number;
    business_id: number | null;
    name: string;
    description: string | null;
    status: RoleStatus;
    created_at: Date;
    updated_at: Date;
}
export declare class RolePermissionDetail extends Permission {
    access_scope: RolePermissionAccessScope;
    assigned_at: Date;
}
export declare class RoleWithPermissions extends Role {
    permissions: RolePermissionDetail[];
}
