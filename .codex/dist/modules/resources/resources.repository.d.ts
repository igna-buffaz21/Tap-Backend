import { DatabaseService } from '../../database/database.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { Resource } from './entities/resource.entity';
export interface ResourceAccessFilter {
    allowedBranchIds?: number[];
    assignedUserId?: number;
}
export declare class ResourcesRepository {
    private readonly databaseService;
    constructor(databaseService: DatabaseService);
    create(createResourceDto: CreateResourceDto): Promise<Resource>;
    findAll(): Promise<Resource[]>;
    findAllForBusiness(businessId: number, accessFilter?: ResourceAccessFilter): Promise<Resource[]>;
    findById(id: number): Promise<Resource | null>;
    update(id: number, updateResourceDto: UpdateResourceDto, businessId?: number, accessFilter?: ResourceAccessFilter): Promise<Resource | null>;
    findByIdForBusiness(id: number, businessId: number, accessFilter?: ResourceAccessFilter): Promise<Resource | null>;
    branchBelongsToBusiness(branchId: number, businessId: number): Promise<boolean>;
    branchBelongsToBusinessAndAccess(branchId: number, businessId: number, accessFilter?: ResourceAccessFilter): Promise<boolean>;
    remove(id: number): Promise<boolean>;
    private buildBranchAccessCondition;
    private buildAssignedResourceCondition;
}
