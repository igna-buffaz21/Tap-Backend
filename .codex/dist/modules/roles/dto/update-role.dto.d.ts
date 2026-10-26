import { RolePermissionAssignmentDto } from './role-permission-assignment.dto';
export declare class UpdateRoleDto {
    name?: string;
    description?: string | null;
    permissions?: RolePermissionAssignmentDto[];
}
