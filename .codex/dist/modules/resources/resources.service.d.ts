import { User } from '../users/entities/user.entity';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { ResourceAccessFilter, ResourcesRepository } from './resources.repository';
export declare class ResourcesService {
    private readonly resourcesRepository;
    constructor(resourcesRepository: ResourcesRepository);
    create(createResourceDto: CreateResourceDto): Promise<import("./entities/resource.entity").Resource>;
    createForBusiness(createResourceDto: CreateResourceDto, currentUser: User, businessIdValue?: unknown): Promise<import("./entities/resource.entity").Resource>;
    findAll(): Promise<import("./entities/resource.entity").Resource[]>;
    findAllForBusiness(currentUser: User, businessIdValue?: unknown): Promise<import("./entities/resource.entity").Resource[]>;
    findOne(id: number): Promise<import("./entities/resource.entity").Resource | null>;
    findOneForBusiness(id: number, currentUser: User, businessIdValue?: unknown): Promise<import("./entities/resource.entity").Resource>;
    update(id: number, updateResourceDto: UpdateResourceDto, businessId?: number, accessFilter?: ResourceAccessFilter): Promise<import("./entities/resource.entity").Resource | null>;
    updateForBusiness(id: number, updateResourceDto: UpdateResourceDto, currentUser: User, businessIdValue?: unknown): Promise<import("./entities/resource.entity").Resource>;
    remove(id: number): Promise<boolean>;
    private resolveResourceAccess;
    private requireBusinessUserBusinessId;
    private assertBranchBelongsToBusiness;
    private validateNullableBoolean;
    private validateOptionalPositiveInteger;
    private parsePositiveInteger;
    private normalizeOptionalString;
}
