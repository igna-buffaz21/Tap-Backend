import { User } from '../users/entities/user.entity';
import { CreateResourceBlockDto } from './dto/create-resource-block.dto';
import { UpdateResourceBlockDto } from './dto/update-resource-block.dto';
import { ResourceBlockAccessFilter, ResourceBlocksRepository } from './resource-blocks.repository';
export declare class ResourceBlocksService {
    private readonly resourceBlocksRepository;
    constructor(resourceBlocksRepository: ResourceBlocksRepository);
    create(createResourceBlockDto: CreateResourceBlockDto): Promise<import("./entities/resource-block.entity").ResourceBlock>;
    createForBusiness(createResourceBlockDto: CreateResourceBlockDto, currentUser: User, businessIdValue?: unknown): Promise<import("./entities/resource-block.entity").ResourceBlock>;
    findAll(): Promise<import("./entities/resource-block.entity").ResourceBlock[]>;
    findAllForBusiness(currentUser: User, businessIdValue?: unknown): Promise<import("./entities/resource-block.entity").ResourceBlock[]>;
    findOne(id: number): Promise<import("./entities/resource-block.entity").ResourceBlock | null>;
    findOneForBusiness(id: number, currentUser: User, businessIdValue?: unknown): Promise<import("./entities/resource-block.entity").ResourceBlock>;
    update(id: number, updateResourceBlockDto: UpdateResourceBlockDto, businessId?: number, accessFilter?: ResourceBlockAccessFilter): Promise<import("./entities/resource-block.entity").ResourceBlock | null>;
    updateForBusiness(id: number, updateResourceBlockDto: UpdateResourceBlockDto, currentUser: User, businessIdValue?: unknown): Promise<import("./entities/resource-block.entity").ResourceBlock>;
    remove(id: number): Promise<boolean>;
    removeForBusiness(id: number, currentUser: User, businessIdValue?: unknown): Promise<{
        deleted: boolean;
    }>;
    private resolveResourceAccess;
    private requireBusinessUserBusinessId;
    private assertResourceBelongsToBusiness;
    private parsePositiveInteger;
}
