import { User } from '../users/entities/user.entity';
import { ResourceBlocksService } from './resource-blocks.service';
import { CreateResourceBlockDto } from './dto/create-resource-block.dto';
import { UpdateResourceBlockDto } from './dto/update-resource-block.dto';
export declare class ResourceBlocksController {
    private readonly resourceBlocksService;
    constructor(resourceBlocksService: ResourceBlocksService);
    create(createResourceBlockDto: CreateResourceBlockDto, currentUser: User, businessId?: string): Promise<import("./entities/resource-block.entity").ResourceBlock>;
    findAll(currentUser: User, businessId?: string): Promise<import("./entities/resource-block.entity").ResourceBlock[]>;
    findOne(id: string, currentUser: User, businessId?: string): Promise<import("./entities/resource-block.entity").ResourceBlock>;
    update(id: string, updateResourceBlockDto: UpdateResourceBlockDto, currentUser: User, businessId?: string): Promise<import("./entities/resource-block.entity").ResourceBlock>;
    remove(id: string, currentUser: User, businessId?: string): Promise<{
        deleted: boolean;
    }>;
}
