import { DatabaseService } from '../../database/database.service';
import type { RolePermissionAccessScope } from '../roles/entities/role.entity';
export interface AuthRolePermissionRow {
    role_id: number;
    role_name: string;
    role_status: string;
    is_superadmin_role: boolean;
    permission_key: string | null;
    access_scope: RolePermissionAccessScope | null;
}
export declare class AuthRbacRepository {
    private readonly databaseService;
    constructor(databaseService: DatabaseService);
    findAssignedRolePermissionRows(userId: number, businessId: number | null): Promise<AuthRolePermissionRow[]>;
    findAssignedBranchIds(userId: number, businessId: number | null): Promise<number[]>;
}
