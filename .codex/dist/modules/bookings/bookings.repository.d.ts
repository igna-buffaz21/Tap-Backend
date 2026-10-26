import { QueryResult, QueryResultRow } from 'pg';
import { DatabaseService } from '../../database/database.service';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { Booking } from './entities/booking.entity';
interface QueryExecutor {
    query<T extends QueryResultRow = QueryResultRow>(text: string, values?: unknown[]): Promise<QueryResult<T>>;
}
export interface CreateBookingRecord {
    businessId: number;
    branchId: number;
    resourceId: number;
    customerId: number | null;
    serviceId: number;
    startAt: Date;
    endAt: Date;
    status: string;
    confirmationStatus: string;
    source: string;
    totalPrice: number;
    reservationName: string | null;
    notes: string | null;
    recurringBookingId?: number | null;
}
export interface BookingQueryFilters {
    businessId: number;
    allowedBranchIds?: number[];
    allowedResourceIds?: number[];
    from: Date;
    to: Date;
    branchId?: number;
    resourceId?: number;
    serviceId?: number;
    customerId?: number;
    status?: string;
    page: number;
    limit: number;
}
export interface CustomerActiveBookingFilters {
    businessId: number;
    customerId: number;
    now: Date;
    from?: Date;
    to?: Date;
    branchId?: number;
    limit: number;
}
export interface DetailedBookingRow {
    id: number;
    business_id: number;
    branch_id: number;
    branch_name: string;
    resource_id: number;
    resource_name: string;
    resource_priority: number;
    resource_is_indoor: boolean | null;
    service_id: number;
    service_name: string;
    customer_id: number | null;
    customer_name: string | null;
    customer_phone: string | null;
    customer_no_show_count?: number | string;
    customer_completed_count?: number | string;
    customer_completed_last_window_count?: number | string;
    start_at: Date | string;
    end_at: Date | string;
    status: string;
    confirmation_status: string;
    reconfirmed_at: Date | string | null;
    cancelled_at: Date | string | null;
    source: string;
    total_price: number;
    reservation_name: string | null;
    notes: string | null;
    recurring_booking_id: number | null;
}
export interface AutoCompletedBookingRow {
    id: number;
    business_id: number;
}
export declare class BookingsRepository {
    private readonly databaseService;
    constructor(databaseService: DatabaseService);
    create(record: CreateBookingRecord, executor?: QueryExecutor): Promise<Booking>;
    updateInitialConfirmationStatus(id: number, reconfirmationRequiredAfterMs: number, executor?: QueryExecutor): Promise<Booking>;
    findAll(): Promise<Booking[]>;
    findById(id: number): Promise<Booking | null>;
    findDetailed(filters: BookingQueryFilters): Promise<DetailedBookingRow[]>;
    findUpcomingDetailedForCustomer(filters: CustomerActiveBookingFilters): Promise<DetailedBookingRow[]>;
    findDetailedById(id: number, businessId: number, allowedBranchIds?: number[], allowedResourceIds?: number[]): Promise<DetailedBookingRow | null>;
    cancelForBusinessAndCustomer(id: number, businessId: number, customerId: number): Promise<Booking | null>;
    findByIdForBusiness(id: number, businessId: number, allowedBranchIds?: number[], allowedResourceIds?: number[]): Promise<Booking | null>;
    customerBelongsToBusiness(customerId: number, businessId: number): Promise<boolean>;
    bookingContextBelongsToBusiness(input: {
        businessId: number;
        branchId: number;
        resourceId: number;
        serviceId: number;
        customerId: number | null;
    }): Promise<boolean>;
    update(id: number, businessId: number, updateBookingDto: UpdateBookingDto, allowedBranchIds?: number[], allowedResourceIds?: number[]): Promise<Booking | null>;
    markReconfirmed(id: number, businessId: number, allowedBranchIds?: number[], allowedResourceIds?: number[]): Promise<Booking | null>;
    cancelForBusiness(id: number, businessId: number, allowedBranchIds?: number[], allowedResourceIds?: number[]): Promise<Booking | null>;
    markConfirmedBookingsCompletedAfter(cutoff: Date): Promise<AutoCompletedBookingRow[]>;
    remove(id: number, businessId: number, allowedBranchIds?: number[], allowedResourceIds?: number[]): Promise<boolean>;
    private addOptionalCondition;
    private addAllowedBranchCondition;
    private addAllowedResourceCondition;
}
export {};
