import { Resource } from '../../resources/entities/resource.entity';
export declare class UserResource {
    user_id: number;
    resource_id: number;
    created_at: Date;
}
export declare class UserAssignedResource extends Resource {
    assigned_at: Date;
}
