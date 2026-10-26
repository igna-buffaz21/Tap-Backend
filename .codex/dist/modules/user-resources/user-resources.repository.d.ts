import { DatabaseService } from '../../database/database.service';
import { UserAssignedResource, UserResource } from './entities/user-resource.entity';
export interface UserResourceAccessFilter {
    allowedBranchIds?: number[];
}
export declare class UserResourcesRepository {
    private readonly databaseService;
    constructor(databaseService: DatabaseService);
    userBelongsToBusiness(userId: number, businessId: number): Promise<boolean>;
    findUserBusinessId(userId: number): Promise<number | null>;
    resourceBelongsToBusinessAndAccess(resourceId: number, businessId: number, accessFilter?: UserResourceAccessFilter): Promise<boolean>;
    findAllAssignedToUser(userId: number, businessId: number, accessFilter?: UserResourceAccessFilter): Promise<UserAssignedResource[]>;
    assignResourceToUser(userId: number, resourceId: number): Promise<UserResource>;
    findAssignedResource(userId: number, resourceId: number, businessId: number, accessFilter?: UserResourceAccessFilter): Promise<UserAssignedResource | null>;
    removeResourceFromUser(userId: number, resourceId: number, businessId: number, accessFilter?: UserResourceAccessFilter): Promise<boolean>;
    private buildBranchAccessCondition;
}
