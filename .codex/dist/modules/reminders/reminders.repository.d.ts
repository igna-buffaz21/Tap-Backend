import { QueryResult, QueryResultRow } from 'pg';
import { DatabaseService } from '../../database/database.service';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { Reminder } from './entities/reminder.entity';
interface QueryExecutor {
    query<T extends QueryResultRow = QueryResultRow>(text: string, values?: unknown[]): Promise<QueryResult<T>>;
}
export interface CreateReminderRecord {
    bookingId: number;
    channel: string;
    messageType: string;
    scheduledAt: Date;
    status: string;
}
export interface DueWhatsappReminder {
    id: number;
    booking_id: number;
    channel: string;
    message_type: string;
    scheduled_at: Date;
    sent_at: Date | null;
    failed_at: Date | null;
    status: string;
    provider_message_id: string | null;
    retry_count: number;
    last_error: string | null;
    cost_usd: number | null;
    created_at: Date;
    updated_at: Date;
    business_id: number;
    business_name: string;
    business_timezone: string;
    branch_id: number;
    branch_name: string;
    resource_id: number;
    resource_name: string;
    service_id: number;
    service_name: string;
    customer_id: number;
    customer_name: string | null;
    customer_phone: string | null;
    booking_start_at: Date;
    booking_end_at: Date;
    booking_status: string;
    booking_confirmation_status: string;
    booking_source: string | null;
    reservation_name: string | null;
    whatsapp_account_id: number | null;
}
export declare class RemindersRepository {
    private readonly databaseService;
    constructor(databaseService: DatabaseService);
    create(record: CreateReminderRecord, executor?: QueryExecutor): Promise<Reminder>;
    createReconfirmationIfRequired(record: CreateReminderRecord, reconfirmationRequiredAfterMs: number, executor?: QueryExecutor): Promise<Reminder | null>;
    repairMissingWhatsappReconfirmationReminders(reconfirmationRequiredAfterMs: number, reminderOffsetMs: number): Promise<number>;
    findAll(businessId: number, allowedBranchIds?: number[], allowedResourceIds?: number[]): Promise<Reminder[]>;
    findById(id: number, businessId: number, allowedBranchIds?: number[], allowedResourceIds?: number[]): Promise<Reminder | null>;
    update(id: number, businessId: number, updateReminderDto: UpdateReminderDto, allowedBranchIds?: number[], allowedResourceIds?: number[]): Promise<Reminder | null>;
    remove(id: number, businessId: number, allowedBranchIds?: number[], allowedResourceIds?: number[]): Promise<boolean>;
    claimDueWhatsappReconfirmationReminders(limit: number, now: Date): Promise<DueWhatsappReminder[]>;
    markSent(id: number, providerMessageId: string | null): Promise<Reminder | null>;
    markFailedAttempt(id: number, errorMessage: string, maxAttempts: number): Promise<Reminder | null>;
    markCancelled(id: number, reason: string): Promise<Reminder | null>;
    cancelPendingForBooking(bookingId: number, businessId: number, reason: string): Promise<number>;
    releaseStuckProcessingReminders(olderThan: Date): Promise<number>;
    findAssignedResourceIds(userId: number, businessId: number, allowedBranchIds?: number[]): Promise<number[]>;
    private addAllowedBranchCondition;
    private addAllowedResourceCondition;
}
export {};
