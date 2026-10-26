import { User } from '../users/entities/user.entity';
import { CreateResourceServiceDto } from './dto/create-resource-service.dto';
import { ResourceServicesService } from './resource-services.service';
export declare class ResourceServicesController {
    private readonly resourceServicesService;
    constructor(resourceServicesService: ResourceServicesService);
    create(createResourceServiceDto: CreateResourceServiceDto, currentUser: User, businessId?: string): Promise<import("./entities/resource-service.entity").ResourceService>;
    findAll(currentUser: User, businessId?: string): Promise<import("./entities/resource-service.entity").ResourceService[]>;
    remove(resourceId: string, serviceId: string, currentUser: User, businessId?: string): Promise<{
        deleted: boolean;
    }>;
}
