import { User } from '../users/entities/user.entity';
import { AssignUserRoleDto } from './dto/assign-user-role.dto';
import { UserRolesService } from './user-roles.service';
export declare class UserRolesController {
    private readonly userRolesService;
    constructor(userRolesService: UserRolesService);
    findAll(userId: string, currentUser: User): Promise<import("./entities/user-role.entity").UserAssignedRole[]>;
    assign(userId: string, assignUserRoleDto: AssignUserRoleDto, currentUser: User): Promise<import("./entities/user-role.entity").UserAssignedRole | null>;
    remove(userId: string, roleId: string, currentUser: User): Promise<true>;
}
