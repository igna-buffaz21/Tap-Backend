export type BranchOpeningHoursDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export interface BranchOpeningHoursRange {
    open: string;
    close: string;
}
export type BranchOpeningHours = Record<BranchOpeningHoursDay, BranchOpeningHoursRange[]>;
export declare class Branch {
    id: number;
    business_id: number;
    name: string;
    slug: string;
    description: string | null;
    logo_url: string | null;
    cover_image_url: string | null;
    primary_color: string | null;
    instagram_url: string | null;
    facebook_url: string | null;
    address: string | null;
    phone: string | null;
    lat: number | null;
    lng: number | null;
    opening_hours: BranchOpeningHours | null;
    status: string;
    created_at: Date;
    updated_at: Date;
}
