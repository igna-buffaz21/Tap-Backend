export declare class RecurringBooking {
    id: number;
    branch_id: number;
    resource_id: number;
    service_id: number;
    customer_id: number;
    day_of_week: number;
    start_time: string;
    start_date: Date | string;
    end_date: Date | string;
    status: string;
    created_at: Date;
    updated_at: Date;
}
