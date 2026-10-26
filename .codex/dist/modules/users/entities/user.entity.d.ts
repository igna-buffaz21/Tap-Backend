import type { AuthAuthorizationContext } from '../../auth/interfaces/auth-user.interface';
export interface UserRoleSummary {
    id: number;
    name: string;
    status: string;
}
export declare class User {
    id: number;
    clerk_id: string | null;
    business_id: number | null;
    branch_id: number | null;
    name: string;
    email: string;
    photo_url: string | null;
    role: string;
    roles?: UserRoleSummary[];
    status: string;
    created_at: Date;
    updated_at: Date;
    authorization?: AuthAuthorizationContext;
}
