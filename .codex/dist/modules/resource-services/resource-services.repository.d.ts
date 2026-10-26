import { DatabaseService } from '../../database/database.service';
import { CreateResourceServiceDto } from './dto/create-resource-service.dto';
import { ResourceService } from './entities/resource-service.entity';
export interface ResourceServiceAccessFilter {
    allowedBranchIds?: number[];
}
export declare class ResourceServicesRepository {
    private readonly databaseService;
    constructor(databaseService: DatabaseService);
    create(createResourceServiceDto: CreateResourceServiceDto): Promise<ResourceService>;
    findAll(): Promise<ResourceService[]>;
    findAllForBusiness(businessId: number, accessFilter?: ResourceServiceAccessFilter): Promise<ResourceService[]>;
    resourceAndServiceBelongToBusiness(resourceId: number, serviceId: number, businessId: number, accessFilter?: ResourceServiceAccessFilter): Promise<boolean>;
    remove(resourceId: number, serviceId: number, businessId?: number, accessFilter?: ResourceServiceAccessFilter): Promise<boolean>;
    private buildBranchAccessCondition;
}
