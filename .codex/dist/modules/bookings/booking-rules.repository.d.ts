import { DatabaseService } from '../../database/database.service';
import { ResourceSelectionMode } from './resource-selection.types';
export interface BusinessRow {
    id: number;
    name: string;
    business_type: string;
    timezone: string;
}
export interface BranchRow {
    id: number;
    name: string;
}
export interface ServiceRow {
    id: number;
    name: string;
    duration_minutes: number;
    price: number;
    resource_selection_mode: ResourceSelectionMode;
    icon_key?: string | null;
    image_url?: string | null;
}
export interface ResourceRow {
    id: number;
    name: string;
    type: string | null;
    photo_url: string | null;
    is_indoor: boolean | null;
    priority: number;
}
export interface ServiceResourceOptionRow {
    service_id: number;
    service_name: string;
    service_duration_minutes: number;
    service_resource_selection_mode: ResourceSelectionMode;
    resource_id: number;
    resource_name: string;
    resource_is_indoor: boolean | null;
    resource_priority: number;
}
export interface CustomerRow {
    id: number;
    name: string;
    phone: string;
}
export interface ResourceScheduleRow {
    resource_id: number;
    start_time: string;
    end_time: string;
}
export interface TimeRangeRow {
    resource_id: number;
    start_at: Date | string;
    end_at: Date | string;
}
export interface BookingTimeRangeRow extends TimeRangeRow {
    booking_id: number;
}
export interface ResourceDayScheduleRow extends ResourceScheduleRow {
    resource_name: string;
}
export interface ResourceDayBlockRow extends TimeRangeRow {
    id: number;
    resource_name: string;
    reason: string | null;
}
export declare class BookingRulesRepository {
    private readonly databaseService;
    constructor(databaseService: DatabaseService);
    findBusiness(businessId: number): Promise<BusinessRow | null>;
    findBranchForBusiness(branchId: number, businessId: number): Promise<BranchRow | null>;
    findActiveBranchesForBusiness(businessId: number, limit: number): Promise<BranchRow[]>;
    findServiceForBusiness(serviceId: number, businessId: number, branchId: number): Promise<ServiceRow | null>;
    findActiveServiceForBranch(serviceId: number, businessId: number, branchId: number): Promise<ServiceRow | null>;
    findActiveServicesForBranch(businessId: number, branchId: number, limit: number): Promise<ServiceRow[]>;
    findActiveServiceResourceOptionsForBranch(businessId: number, branchId: number, limit: number): Promise<ServiceResourceOptionRow[]>;
    findResourceForBranch(resourceId: number, branchId: number, businessId: number): Promise<ResourceRow | null>;
    findActiveResourceForService(resourceId: number, businessId: number, branchId: number, serviceId: number): Promise<ResourceRow | null>;
    resourceOffersService(resourceId: number, serviceId: number): Promise<boolean>;
    findEligibleResources(businessId: number, branchId: number, serviceId: number, resourceId?: number, isIndoor?: boolean, allowedResourceIds?: number[]): Promise<ResourceRow[]>;
    findCustomer(customerId: number): Promise<CustomerRow | null>;
    findSchedules(resourceIds: number[], dayOfWeek: number): Promise<ResourceScheduleRow[]>;
    findActiveSchedulesForBranchDay(businessId: number, branchId: number, dayOfWeek: number, resourceId?: number, allowedResourceIds?: number[]): Promise<ResourceDayScheduleRow[]>;
    findBlocks(resourceIds: number[], rangeStart: Date, rangeEnd: Date): Promise<TimeRangeRow[]>;
    findBlocksForBranchDay(businessId: number, branchId: number, rangeStart: Date, rangeEnd: Date, resourceId?: number, allowedResourceIds?: number[]): Promise<ResourceDayBlockRow[]>;
    findActiveBookings(resourceIds: number[], rangeStart: Date, rangeEnd: Date): Promise<BookingTimeRangeRow[]>;
}
