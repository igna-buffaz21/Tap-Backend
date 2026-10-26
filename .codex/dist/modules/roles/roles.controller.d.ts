import { User } from '../users/entities/user.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';
export declare class RolesController {
    private readonly rolesService;
    constructor(rolesService: RolesService);
    findAll(currentUser: User): Promise<import("./entities/role.entity").Role[]>;
    findOne(id: string, currentUser: User): Promise<import("./entities/role.entity").RoleWithPermissions>;
    create(createRoleDto: CreateRoleDto, currentUser: User): Promise<import("./entities/role.entity").RoleWithPermissions>;
    update(id: string, updateRoleDto: UpdateRoleDto, currentUser: User): Promise<import("./entities/role.entity").RoleWithPermissions>;
    deactivate(id: string, currentUser: User): Promise<import("./entities/role.entity").Role>;
}
