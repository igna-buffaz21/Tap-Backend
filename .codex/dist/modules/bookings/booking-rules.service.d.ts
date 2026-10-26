import { LocalDateParts } from '../../common/utils/timezone';
import { GetAvailabilityDto } from '../availability/dto/get-availability.dto';
import { GetDayBoundsDto } from '../availability/dto/get-day-bounds.dto';
import { BookingRulesRepository, BranchRow, BusinessRow, ResourceRow, ServiceResourceOptionRow, ServiceRow } from './booking-rules.repository';
import { ResourcePreferences, ResourceSelectionMode } from './resource-selection.types';
export interface AvailabilitySlot {
    resourceId: number;
    resourceName: string;
    resourcePriority: number;
    resourceIsIndoor: boolean | null;
    startAt: string;
    endAt: string;
}
export interface AvailabilityResponse {
    date: string;
    service: {
        id: number;
        name: string;
        durationMinutes: number;
        price: number;
        resourceSelectionMode: ResourceSelectionMode;
        iconKey?: string | null;
        imageUrl?: string | null;
    };
    slots: AvailabilitySlot[];
}
export interface DayBoundsBlock {
    id: number;
    resource: {
        id: number;
        name: string;
    };
    startAt: string;
    endAt: string;
    reason: string | null;
}
export interface DayBoundsResponse {
    date: string;
    businessId: number;
    branch: {
        id: number;
        name: string;
    };
    timezone: string;
    earliestTime: string | null;
    latestTime: string | null;
    hasBlocks: boolean;
    blocks: DayBoundsBlock[];
}
export interface BookingContext {
    business: BusinessRow;
    branch: {
        id: number;
        name: string;
    };
    service: ServiceRow;
    resource: ResourceRow;
}
export interface BookingAvailabilityConflict {
    bookingId: number;
    resourceId: number;
    startAt: string;
    endAt: string;
}
export declare class BookingRulesService {
    private readonly bookingRulesRepository;
    constructor(bookingRulesRepository: BookingRulesRepository);
    getAvailability(query: GetAvailabilityDto, allowedResourceIds?: number[]): Promise<AvailabilityResponse>;
    getDayBounds(query: GetDayBoundsDto, allowedResourceIds?: number[]): Promise<DayBoundsResponse>;
    getBusinessOrFail(businessId: number): Promise<BusinessRow>;
    private assertResourceAllowed;
    findSingleActiveBranchForBusiness(businessIdValue: unknown): Promise<BranchRow | null>;
    validateBookingContext(businessId: number, branchId: number, serviceId: number, resourceId: number | undefined, startAt: Date, resourcePreferences?: ResourcePreferences, allowedResourceIds?: number[]): Promise<BookingContext>;
    validateCustomer(customerId: number): Promise<void>;
    findSingleActiveServiceForBranch(businessIdValue: unknown, branchIdValue: unknown): Promise<ServiceRow | null>;
    findActiveServicesForBranch(businessIdValue: unknown, branchIdValue: unknown, limitValue?: unknown): Promise<ServiceRow[]>;
    findActiveServiceForBranch(businessIdValue: unknown, branchIdValue: unknown, serviceIdValue: unknown): Promise<ServiceRow | null>;
    findActiveServiceResourceOptionsForBranch(businessIdValue: unknown, branchIdValue: unknown, limitValue?: unknown): Promise<ServiceResourceOptionRow[]>;
    findEligibleResourcesForService(businessIdValue: unknown, branchIdValue: unknown, serviceIdValue: unknown, resourcePreferences?: ResourcePreferences): Promise<ResourceRow[]>;
    findActiveResourceForService(businessIdValue: unknown, branchIdValue: unknown, serviceIdValue: unknown, resourceIdValue: unknown): Promise<ResourceRow | null>;
    assertResourceAvailable(resourceId: number, startAt: Date, endAt: Date, timeZone: string): Promise<void>;
    assertDateIsTodayOrFuture(date: LocalDateParts, timeZone: string, field: string): void;
    assertInstantIsNowOrFuture(date: Date, field: string): void;
    parsePositiveInteger(value: unknown, field: string): number;
    parseOptionalPositiveInteger(value: unknown, field: string): number | undefined;
    parseOptionalBoolean(value: unknown, field: string): boolean | undefined;
    parseRequiredDate(value: unknown, field: string): LocalDateParts;
    parseInstant(value: unknown, field: string): Date;
    private compareLocalDates;
    private getScheduleBoundsFromRows;
    private parseScheduleMinutes;
    private formatMinutes;
    private mapDayBoundsBlock;
    formatInstant(date: Date, timeZone: string): string;
    private validateBusinessBranchService;
    private validateResourceForService;
    private selectAvailableResourceForBooking;
    private buildAvailabilitySlots;
    private isInsideAnySchedule;
    private overlapsAny;
    private findOverlappingBookings;
    private scheduleToUtcRange;
    private groupByResource;
    private toDate;
    private mapService;
}
