import { DatabaseService } from '../../database/database.service';
import { Permission } from './entities/permission.entity';
export declare class PermissionsRepository {
    private readonly databaseService;
    constructor(databaseService: DatabaseService);
    findAll(): Promise<Permission[]>;
    countExistingByIds(permissionIds: number[]): Promise<number>;
}
