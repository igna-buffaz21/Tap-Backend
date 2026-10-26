import { PoolClient } from 'pg';
import { DatabaseService } from '../../database/database.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role, RoleWithPermissions } from './entities/role.entity';
export declare class RolesRepository {
    private readonly databaseService;
    constructor(databaseService: DatabaseService);
    createCustomRole(businessId: number, dto: CreateRoleDto, client?: PoolClient): Promise<Role>;
    findAllAvailableForBusiness(businessId: number): Promise<Role[]>;
    findByIdAvailableForBusiness(id: number, businessId: number): Promise<Role | null>;
    findByIdAvailableWithPermissions(id: number, businessId: number): Promise<RoleWithPermissions | null>;
    updateCustomRole(id: number, businessId: number, dto: UpdateRoleDto, client?: PoolClient): Promise<Role | null>;
    deactivateCustomRole(id: number, businessId: number): Promise<Role | null>;
    private buildRoleWithPermissions;
    private query;
}
