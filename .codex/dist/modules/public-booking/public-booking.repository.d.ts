import { DatabaseService } from '../../database/database.service';
import { BranchOpeningHours } from '../branches/entities/branch.entity';
export interface PublicBranchRow {
    id: number;
    slug: string;
    name: string;
    description: string | null;
    logo_url: string | null;
    cover_image_url: string | null;
    primary_color: string | null;
    instagram_url: string | null;
    facebook_url: string | null;
    address: string | null;
    phone: string | null;
    lat: number | string | null;
    lng: number | string | null;
    opening_hours: BranchOpeningHours | string | null;
    business_id: number;
    business_name: string;
    timezone: string;
}
export interface PublicBookingRow {
    id: number;
    start_at: Date | string;
    end_at: Date | string;
    status: string;
    confirmation_status: string;
    reconfirmed_at: Date | string | null;
    cancelled_at: Date | string | null;
    total_price: number;
    reservation_name: string | null;
    notes: string | null;
    service_id: number;
    service_name: string;
    resource_id: number;
    resource_name: string;
    resource_is_indoor: boolean | null;
    customer_name: string;
    customer_phone: string;
    customer_email: string;
}
export interface PublicBookingCustomerMatch {
    customer_id: number;
}
export declare class PublicBookingRepository {
    private readonly databaseService;
    constructor(databaseService: DatabaseService);
    findActiveBranchesBySlug(slug: string): Promise<PublicBranchRow[]>;
    findUpcomingBookingsByCustomerEmail(filters: {
        businessId: number;
        branchId: number;
        email: string;
        now: Date;
        limit: number;
    }): Promise<PublicBookingRow[]>;
    findUpcomingBookingsByCustomerPhone(filters: {
        businessId: number;
        branchId: number;
        phones: string[];
        now: Date;
        limit: number;
    }): Promise<PublicBookingRow[]>;
    findActiveBookingCustomerByEmail(filters: {
        businessId: number;
        branchId: number;
        bookingId: number;
        email: string;
        now: Date;
    }): Promise<PublicBookingCustomerMatch | null>;
    findActiveBookingCustomerByPhone(filters: {
        businessId: number;
        branchId: number;
        bookingId: number;
        phones: string[];
        now: Date;
    }): Promise<PublicBookingCustomerMatch | null>;
}
