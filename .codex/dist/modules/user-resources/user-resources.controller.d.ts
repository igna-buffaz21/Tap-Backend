import { User } from '../users/entities/user.entity';
import { AssignUserResourceDto } from './dto/assign-user-resource.dto';
import { UserResourcesService } from './user-resources.service';
export declare class UserResourcesController {
    private readonly userResourcesService;
    constructor(userResourcesService: UserResourcesService);
    findAll(userId: string, currentUser: User): Promise<import("./entities/user-resource.entity").UserAssignedResource[]>;
    assign(userId: string, assignUserResourceDto: AssignUserResourceDto, currentUser: User): Promise<import("./entities/user-resource.entity").UserAssignedResource | null>;
    remove(userId: string, resourceId: string, currentUser: User): Promise<{
        deleted: boolean;
    }>;
}
