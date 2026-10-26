import { DatabaseService } from '../../database/database.service';
import { User } from '../users/entities/user.entity';
import { CreateRecurringBookingDto } from './dto/create-recurring-booking.dto';
import { UpdateRecurringBookingDto } from './dto/update-recurring-booking.dto';
import { CreateRecurringBookingRecord, QueryExecutor, RecurringBookingAccessFilter, RecurringBookingsRepository } from './recurring-bookings.repository';
export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}
export declare class RecurringBookingsService {
    private readonly recurringBookingsRepository;
    private readonly databaseService;
    constructor(recurringBookingsRepository: RecurringBookingsRepository, databaseService: DatabaseService);
    create(businessIdValue: unknown, createRecurringBookingDto: CreateRecurringBookingDto): Promise<import("./entities/recurring-booking.entity").RecurringBooking>;
    createForBusiness(createRecurringBookingDto: CreateRecurringBookingDto, currentUser: User, businessIdValue?: unknown): Promise<import("./entities/recurring-booking.entity").RecurringBooking>;
    findAll(businessIdValue: unknown, searchValue?: unknown, pageValue?: unknown, limitValue?: unknown, accessFilter?: RecurringBookingAccessFilter): Promise<{
        data: {
            id: number;
            status: string;
            customer: {
                id: number;
                name: string;
                phone: string;
            };
            service: {
                id: number;
                name: string;
            };
            resource: {
                id: number;
                name: string;
            };
            schedule: {
                day_of_week: number;
                start_time: string;
                start_date: string;
                end_date: string;
            };
            next_booking_at: string | null;
        }[];
        pagination: Pagination;
    }>;
    findAllForBusiness(currentUser: User, businessIdValue?: unknown, searchValue?: unknown, pageValue?: unknown, limitValue?: unknown): Promise<{
        data: {
            id: number;
            status: string;
            customer: {
                id: number;
                name: string;
                phone: string;
            };
            service: {
                id: number;
                name: string;
            };
            resource: {
                id: number;
                name: string;
            };
            schedule: {
                day_of_week: number;
                start_time: string;
                start_date: string;
                end_date: string;
            };
            next_booking_at: string | null;
        }[];
        pagination: Pagination;
    }>;
    findOne(idValue: unknown, businessIdValue: unknown, accessFilter?: RecurringBookingAccessFilter): Promise<{
        id: number;
        status: string;
        customer: {
            id: number;
            name: string;
            phone: string;
        };
        service: {
            id: number;
            name: string;
        };
        resource: {
            id: number;
            name: string;
        };
        schedule: {
            day_of_week: number;
            start_time: string;
            start_date: string;
            end_date: string;
        };
        stats: {
            total: number;
            attended: number;
            pending: number;
            no_show: number;
            cancelled: number;
        };
        next_booking_at: string | null;
    }>;
    findOneForBusiness(idValue: unknown, currentUser: User, businessIdValue?: unknown): Promise<{
        id: number;
        status: string;
        customer: {
            id: number;
            name: string;
            phone: string;
        };
        service: {
            id: number;
            name: string;
        };
        resource: {
            id: number;
            name: string;
        };
        schedule: {
            day_of_week: number;
            start_time: string;
            start_date: string;
            end_date: string;
        };
        stats: {
            total: number;
            attended: number;
            pending: number;
            no_show: number;
            cancelled: number;
        };
        next_booking_at: string | null;
    }>;
    update(idValue: unknown, businessIdValue: unknown, updateRecurringBookingDto: UpdateRecurringBookingDto, accessFilter?: RecurringBookingAccessFilter): Promise<{
        id: number;
        status: string;
        customer: {
            id: number;
            name: string;
            phone: string;
        };
        service: {
            id: number;
            name: string;
        };
        resource: {
            id: number;
            name: string;
        };
        schedule: {
            day_of_week: number;
            start_time: string;
            start_date: string;
            end_date: string;
        };
        stats: {
            total: number;
            attended: number;
            pending: number;
            no_show: number;
            cancelled: number;
        };
        next_booking_at: string | null;
    }>;
    updateForBusiness(idValue: unknown, updateRecurringBookingDto: UpdateRecurringBookingDto, currentUser: User, businessIdValue?: unknown): Promise<{
        id: number;
        status: string;
        customer: {
            id: number;
            name: string;
            phone: string;
        };
        service: {
            id: number;
            name: string;
        };
        resource: {
            id: number;
            name: string;
        };
        schedule: {
            day_of_week: number;
            start_time: string;
            start_date: string;
            end_date: string;
        };
        stats: {
            total: number;
            attended: number;
            pending: number;
            no_show: number;
            cancelled: number;
        };
        next_booking_at: string | null;
    }>;
    remove(idValue: unknown, businessIdValue: unknown, accessFilter?: RecurringBookingAccessFilter): Promise<{
        deleted: boolean;
    }>;
    removeForBusiness(idValue: unknown, currentUser: User, businessIdValue?: unknown): Promise<{
        deleted: boolean;
    }>;
    createRecord(record: CreateRecurringBookingRecord, executor: QueryExecutor): Promise<import("./entities/recurring-booking.entity").RecurringBooking>;
    private toCreateRecord;
    private normalizeUpdateDto;
    private parsePositiveInteger;
    private resolveRecurringBookingAccess;
    private requireBusinessUserBusinessId;
    private assertBranchAllowed;
    private parseDayOfWeek;
    private parseDateOnly;
    private parseTime;
    private parseOptionalStatus;
    private shouldPropagateToActiveBookings;
    private updateActiveBookingOccurrences;
    private shouldUpdateDescending;
    private buildTargetStarts;
    private buildRecurringStarts;
    private hasScheduleChange;
    private hasOnlyStartTimeChange;
    private nextDateOnOrAfter;
    private toRecurringDayOfWeek;
    private compareLocalDates;
    private maxLocalDate;
    private parseLocalDate;
    private parseLocalTime;
    private parseSearch;
    private parsePagination;
    private buildPagination;
    private toLikePattern;
    private mapSummary;
    private mapDetail;
    private mapCustomer;
    private mapService;
    private mapResource;
    private mapSchedule;
    private formatNullableInstant;
    private toDate;
    private formatTime;
    private formatTimeWithSeconds;
    private formatDate;
    private assertDateRange;
    private toDateOnlyString;
    private assertBusinessExists;
    private assertContextBelongsToBusiness;
    private getServiceDurationOrFail;
    private isBookingOverlapDatabaseError;
}
