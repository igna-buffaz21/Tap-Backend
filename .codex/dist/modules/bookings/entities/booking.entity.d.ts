export declare class Booking {
    id: number;
    business_id: number;
    branch_id: number;
    resource_id: number;
    customer_id: number | null;
    service_id: number;
    start_at: Date;
    end_at: Date;
    status: string;
    confirmation_status: string;
    reconfirmed_at: Date | null;
    cancelled_at: Date | null;
    source: string;
    total_price: number;
    reservation_name: string | null;
    notes: string | null;
    recurring_booking_id: number | null;
    created_at: Date;
    updated_at: Date;
}
