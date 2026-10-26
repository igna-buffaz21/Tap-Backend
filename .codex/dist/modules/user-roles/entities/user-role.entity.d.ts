import { Role } from '../../roles/entities/role.entity';
export declare class UserRole {
    user_id: number;
    role_id: number;
    created_at: Date;
}
export declare class UserAssignedRole extends Role {
    assigned_at: Date;
}
