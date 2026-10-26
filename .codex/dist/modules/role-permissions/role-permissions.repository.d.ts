import { PoolClient } from 'pg';
import { DatabaseService } from '../../database/database.service';
import { RolePermissionAssignmentDto } from '../roles/dto/role-permission-assignment.dto';
import { RolePermission } from './entities/role-permission.entity';
export declare class RolePermissionsRepository {
    private readonly databaseService;
    constructor(databaseService: DatabaseService);
    replaceForRole(roleId: number, permissions: RolePermissionAssignmentDto[], client?: PoolClient): Promise<RolePermission[]>;
    private query;
}
