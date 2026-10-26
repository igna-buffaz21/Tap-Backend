import { PermissionsRepository } from './permissions.repository';
export declare class PermissionsService {
    private readonly permissionsRepository;
    constructor(permissionsRepository: PermissionsRepository);
    findAll(): Promise<import("./entities/permission.entity").Permission[]>;
}
