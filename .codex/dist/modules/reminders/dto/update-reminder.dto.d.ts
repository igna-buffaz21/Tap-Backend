export declare class UpdateReminderDto {
    booking_id?: number;
    channel?: string;
    scheduled_at?: Date;
    sent_at?: Date | null;
    status?: string;
    message_type?: string;
    provider_message_id?: string | null;
    cost_usd?: number | null;
}
