export declare class Reminder {
    id: number;
    booking_id: number;
    channel: string;
    scheduled_at: Date;
    sent_at: Date | null;
    failed_at: Date | null;
    status: string;
    message_type: string;
    provider_message_id: string | null;
    retry_count: number;
    last_error: string | null;
    cost_usd: number | null;
    created_at: Date;
    updated_at: Date;
}
