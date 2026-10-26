import { DatabaseService } from '../../database/database.service';
import { CreateResourceBlockDto } from './dto/create-resource-block.dto';
import { UpdateResourceBlockDto } from './dto/update-resource-block.dto';
import { ResourceBlock } from './entities/resource-block.entity';
export interface ResourceBlockAccessFilter {
    allowedBranchIds?: number[];
}
export declare class ResourceBlocksRepository {
    private readonly databaseService;
    constructor(databaseService: DatabaseService);
    create(createResourceBlockDto: CreateResourceBlockDto): Promise<ResourceBlock>;
    findAll(): Promise<ResourceBlock[]>;
    findAllForBusiness(businessId: number, accessFilter?: ResourceBlockAccessFilter): Promise<ResourceBlock[]>;
    findById(id: number): Promise<ResourceBlock | null>;
    update(id: number, updateResourceBlockDto: UpdateResourceBlockDto, businessId?: number, accessFilter?: ResourceBlockAccessFilter): Promise<ResourceBlock | null>;
    findByIdForBusiness(id: number, businessId: number, accessFilter?: ResourceBlockAccessFilter): Promise<ResourceBlock | null>;
    resourceBelongsToBusiness(resourceId: number, businessId: number): Promise<boolean>;
    resourceBelongsToBusinessAndAccess(resourceId: number, businessId: number, accessFilter?: ResourceBlockAccessFilter): Promise<boolean>;
    remove(id: number, businessId?: number, accessFilter?: ResourceBlockAccessFilter): Promise<boolean>;
    private buildBranchAccessCondition;
}
