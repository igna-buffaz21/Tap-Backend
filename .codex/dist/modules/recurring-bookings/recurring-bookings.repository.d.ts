import { QueryResult, QueryResultRow } from 'pg';
import { DatabaseService } from '../../database/database.service';
import { UpdateRecurringBookingDto } from './dto/update-recurring-booking.dto';
import { RecurringBooking } from './entities/recurring-booking.entity';
export interface QueryExecutor {
    query<T extends QueryResultRow = QueryResultRow>(text: string, values?: unknown[]): Promise<QueryResult<T>>;
}
export interface CreateRecurringBookingRecord {
    businessId: number;
    branchId: number;
    resourceId: number;
    serviceId: number;
    customerId: number;
    dayOfWeek: number;
    startTime: string;
    startDate: string;
    endDate: string;
    status?: string;
}
export interface RecurringBookingAccessFilter {
    allowedBranchIds?: number[];
}
export interface RecurringBookingSummaryRow {
    id: number;
    branch_id: number;
    status: string;
    customer_id: number;
    customer_name: string;
    customer_phone: string;
    customer_email: string;
    service_id: number;
    service_name: string;
    service_duration_minutes: number | string;
    resource_id: number;
    resource_name: string;
    day_of_week: number;
    start_time: string;
    start_date: Date | string;
    end_date: Date | string;
    next_booking_at: Date | string | null;
    business_timezone: string;
    total_count: number | string;
}
export interface RecurringBookingDetailRow extends RecurringBookingSummaryRow {
    total_count: number | string;
    attended_count: number | string;
    pending_count: number | string;
    no_show_count: number | string;
    cancelled_count: number | string;
}
export interface RecurringBookingActiveBookingRow {
    id: number;
    start_at: Date | string;
}
export declare class RecurringBookingsRepository {
    private readonly databaseService;
    constructor(databaseService: DatabaseService);
    create(record: CreateRecurringBookingRecord, executor?: QueryExecutor): Promise<RecurringBooking>;
    findAllForBusiness(businessId: number, searchPattern: string | null, phoneSearchPatterns: string[], limit: number, offset: number, accessFilter?: RecurringBookingAccessFilter): Promise<RecurringBookingSummaryRow[]>;
    findByIdForBusiness(id: number, businessId: number, accessFilter?: RecurringBookingAccessFilter): Promise<RecurringBooking | null>;
    findDetailForBusiness(id: number, businessId: number, accessFilter?: RecurringBookingAccessFilter): Promise<RecurringBookingDetailRow | null>;
    findServiceDurationForBusiness(serviceId: number, branchId: number, businessId: number): Promise<number | null>;
    update(id: number, businessId: number, updateRecurringBookingDto: UpdateRecurringBookingDto, accessFilter?: RecurringBookingAccessFilter, executor?: QueryExecutor): Promise<RecurringBooking | null>;
    findActiveBookingsForRecurring(recurringBookingId: number, businessId: number, executor?: QueryExecutor): Promise<RecurringBookingActiveBookingRow[]>;
    updateActiveBookingOccurrence(input: {
        bookingId: number;
        businessId: number;
        recurringBookingId: number;
        branchId: number;
        resourceId: number;
        customerId: number;
        serviceId: number;
        startAt: Date;
        endAt: Date;
    }, executor: QueryExecutor): Promise<void>;
    cancelActiveBookingOccurrence(input: {
        bookingId: number;
        businessId: number;
        recurringBookingId: number;
    }, executor: QueryExecutor): Promise<void>;
    cancelActiveBookingsForRecurring(recurringBookingId: number, businessId: number, accessFilter?: RecurringBookingAccessFilter, executor?: QueryExecutor): Promise<void>;
    remove(id: number, businessId: number, accessFilter?: RecurringBookingAccessFilter): Promise<boolean>;
    businessExists(businessId: number): Promise<boolean>;
    contextBelongsToBusiness(record: {
        businessId: number;
        branchId: number;
        resourceId: number;
        serviceId: number;
        customerId: number;
    }, executor?: QueryExecutor): Promise<boolean>;
    private buildBranchAccessCondition;
}
