import { DatabaseService } from '../../database/database.service';
import { Role } from '../roles/entities/role.entity';
import { UserAssignedRole, UserRole } from './entities/user-role.entity';
export declare class UserRolesRepository {
    private readonly databaseService;
    constructor(databaseService: DatabaseService);
    userBelongsToBusiness(userId: number, businessId: number): Promise<boolean>;
    findRoleAvailableForBusiness(roleId: number, businessId: number): Promise<Role | null>;
    findAllAssignedToUser(userId: number, businessId: number): Promise<UserAssignedRole[]>;
    assignRoleToUser(userId: number, roleId: number): Promise<UserRole>;
    findAssignedRole(userId: number, roleId: number, businessId: number): Promise<UserAssignedRole | null>;
    removeRoleFromUser(userId: number, roleId: number, businessId: number): Promise<boolean>;
}
