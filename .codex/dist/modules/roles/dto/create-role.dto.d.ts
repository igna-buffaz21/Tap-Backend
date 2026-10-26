import { RolePermissionAssignmentDto } from './role-permission-assignment.dto';
export declare class CreateRoleDto {
    name: string;
    description?: string | null;
    permissions?: RolePermissionAssignmentDto[];
}
