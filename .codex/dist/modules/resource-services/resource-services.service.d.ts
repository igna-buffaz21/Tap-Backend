import { User } from '../users/entities/user.entity';
import { CreateResourceServiceDto } from './dto/create-resource-service.dto';
import { ResourceServicesRepository } from './resource-services.repository';
export declare class ResourceServicesService {
    private readonly resourceServicesRepository;
    constructor(resourceServicesRepository: ResourceServicesRepository);
    create(createResourceServiceDto: CreateResourceServiceDto): Promise<import("./entities/resource-service.entity").ResourceService>;
    createForBusiness(createResourceServiceDto: CreateResourceServiceDto, currentUser: User, businessIdValue?: unknown): Promise<import("./entities/resource-service.entity").ResourceService>;
    findAll(): Promise<import("./entities/resource-service.entity").ResourceService[]>;
    findAllForBusiness(currentUser: User, businessIdValue?: unknown): Promise<import("./entities/resource-service.entity").ResourceService[]>;
    remove(resourceId: number, serviceId: number): Promise<boolean>;
    removeForBusiness(resourceIdValue: unknown, serviceIdValue: unknown, currentUser: User, businessIdValue?: unknown): Promise<{
        deleted: boolean;
    }>;
    private resolveResourceAccess;
    private requireBusinessUserBusinessId;
    private parsePositiveInteger;
}
