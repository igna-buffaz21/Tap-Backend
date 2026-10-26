import { User } from '../users/entities/user.entity';
import { ResourcesService } from './resources.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
export declare class ResourcesController {
    private readonly resourcesService;
    constructor(resourcesService: ResourcesService);
    create(createResourceDto: CreateResourceDto, currentUser: User, businessId?: string): Promise<import("./entities/resource.entity").Resource>;
    findAll(currentUser: User, businessId?: string): Promise<import("./entities/resource.entity").Resource[]>;
    findOne(id: string, currentUser: User, businessId?: string): Promise<import("./entities/resource.entity").Resource>;
    update(id: string, updateResourceDto: UpdateResourceDto, currentUser: User, businessId?: string): Promise<import("./entities/resource.entity").Resource>;
}
