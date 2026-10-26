import { User } from '../users/entities/user.entity';
import { AssignUserRoleDto } from './dto/assign-user-role.dto';
import { UserRolesRepository } from './user-roles.repository';
export declare class UserRolesService {
    private readonly userRolesRepository;
    constructor(userRolesRepository: UserRolesRepository);
    findAllForUser(userId: number, currentUser: User): Promise<import("./entities/user-role.entity").UserAssignedRole[]>;
    assignRoleToUser(userId: number, dto: AssignUserRoleDto, currentUser: User): Promise<import("./entities/user-role.entity").UserAssignedRole | null>;
    removeRoleFromUser(userId: number, roleId: number, currentUser: User): Promise<true>;
    private assertUserBelongsToBusiness;
    private resolveBusinessAccess;
    private requireBusinessUserBusinessId;
    private parsePositiveInteger;
    private isUniqueViolation;
}
