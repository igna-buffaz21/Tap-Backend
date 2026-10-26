import { BranchOpeningHours } from '../entities/branch.entity';
export declare class UpdateBranchDto {
    name?: string;
    slug?: string;
    description?: string | null;
    logo_url?: string | null;
    cover_image_url?: string | null;
    primary_color?: string | null;
    instagram_url?: string | null;
    facebook_url?: string | null;
    address?: string;
    phone?: string;
    lat?: number | null;
    lng?: number | null;
    opening_hours?: BranchOpeningHours | null;
}
