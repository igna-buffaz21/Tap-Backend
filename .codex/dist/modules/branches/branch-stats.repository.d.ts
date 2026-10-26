import { DatabaseService } from '../../database/database.service';
export interface BranchStatsContextRow {
    id: number;
    name: string;
    business_id: number;
    timezone: string;
}
export interface BranchStatsResourceRow {
    id: number;
    name: string;
}
export interface BranchStatsScheduleRow {
    resource_id: number;
    day_of_week: number;
    start_time: string;
    end_time: string;
}
export interface BranchStatsBlockRow {
    id: number;
    resource_id: number;
    start_at: Date | string;
    end_at: Date | string;
}
export interface BranchStatsBookingRow {
    id: number;
    resource_id: number;
    service_id: number;
    start_at: Date | string;
    end_at: Date | string;
    status: string;
    service_price: number | string;
}
export declare class BranchStatsRepository {
    private readonly databaseService;
    constructor(databaseService: DatabaseService);
    findBranchContext(branchId: number): Promise<BranchStatsContextRow | null>;
    findActiveResources(branchId: number, resourceId?: number, allowedResourceIds?: number[]): Promise<BranchStatsResourceRow[]>;
    findActiveSchedules(resourceIds: number[]): Promise<BranchStatsScheduleRow[]>;
    findBlocks(resourceIds: number[], rangeStart: Date, rangeEnd: Date): Promise<BranchStatsBlockRow[]>;
    findBookings(branchId: number, rangeStart: Date, rangeEnd: Date, resourceId?: number, serviceId?: number, allowedResourceIds?: number[]): Promise<BranchStatsBookingRow[]>;
    serviceBelongsToBranch(serviceId: number, branchId: number): Promise<boolean>;
    findAssignedResourceIds(userId: number, branchId: number): Promise<number[]>;
}
