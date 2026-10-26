import { RolePermissionAccessScope } from '../../roles/entities/role.entity';
export declare class RolePermission {
    role_id: number;
    permission_id: number;
    access_scope: RolePermissionAccessScope;
    created_at: Date;
}
