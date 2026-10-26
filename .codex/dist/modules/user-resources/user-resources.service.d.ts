import { User } from '../users/entities/user.entity';
import { AssignUserResourceDto } from './dto/assign-user-resource.dto';
import { UserResourcesRepository } from './user-resources.repository';
export declare class UserResourcesService {
    private readonly userResourcesRepository;
    constructor(userResourcesRepository: UserResourcesRepository);
    findAllForUser(userId: number, currentUser: User): Promise<import("./entities/user-resource.entity").UserAssignedResource[]>;
    assignResourceToUser(userId: number, dto: AssignUserResourceDto, currentUser: User): Promise<import("./entities/user-resource.entity").UserAssignedResource | null>;
    removeResourceFromUser(userId: number, resourceIdValue: number, currentUser: User): Promise<{
        deleted: boolean;
    }>;
    private resolveAccess;
    private resolveAccessScope;
    private assertUserBelongsToBusiness;
    private assertResourceBelongsToBusinessAndAccess;
    private requireBusinessUserBusinessId;
    private parsePositiveInteger;
    private isUniqueViolation;
}
