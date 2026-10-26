export declare class UpdateBookingDto {
    businessId?: number | string;
    business_id?: number | string;
    branch_id?: number;
    resource_id?: number;
    customer_id?: number;
    service_id?: number;
    start_at?: Date;
    end_at?: Date;
    status?: string;
    confirmation_status?: string;
    reconfirmed_at?: Date | null;
    cancelled_at?: Date | null;
    source?: string;
    total_price?: number;
    reservation_name?: string | null;
    notes?: string | null;
}
