import { User } from '../users/entities/user.entity';
import { BranchesRepository } from './branches.repository';
import { BranchStatsRepository } from './branch-stats.repository';
import { GetBranchDemandStatsQueryDto } from './dto/get-branch-demand-stats-query.dto';
import { GetBranchStatsQueryDto } from './dto/get-branch-stats-query.dto';
export declare class BranchStatsService {
    private readonly branchStatsRepository;
    private readonly branchesRepository;
    constructor(branchStatsRepository: BranchStatsRepository, branchesRepository: BranchesRepository);
    getSummary(branchIdValue: unknown, query: GetBranchStatsQueryDto, currentUser: User): Promise<{
        period: "year" | "month" | "day" | "week";
        from: string;
        to: string;
        bookings: number;
        estimatedRevenue: number;
        occupancyPercentage: number;
        cancellations: {
            count: number;
            percentage: number;
        };
    }>;
    getDemand(branchIdValue: unknown, query: GetBranchDemandStatsQueryDto, currentUser: User): Promise<{
        period: "year" | "month" | "week";
        from: string;
        to: string;
        resourceId: number | null;
        serviceId: number | null;
        heatmap: {
            dayOfWeek: number;
            day: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
            slots: {
                hour: string;
                reservedMinutes: number;
                availableMinutes: number;
                occupancyPercentage: number;
            }[];
        }[];
        peak: {
            dayOfWeek: number;
            day: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
            hour: string;
            occupancyPercentage: number;
        } | null;
    }>;
    private getBranchContextOrFail;
    private loadCapacityRows;
    private resolvePeriodRange;
    private calculateAvailableMinutes;
    private addAvailableMinutesToCells;
    private addReservedMinutesToCells;
    private getMergedScheduleRangesForDate;
    private getAvailableMinutesForRange;
    private scheduleToUtcRange;
    private hourToUtcRange;
    private createHeatmapCells;
    private findPeakCell;
    private isValidBooking;
    private startsInsideRange;
    private getOverlapMinutes;
    private mergeRanges;
    private enumerateDates;
    private parsePeriod;
    private parsePositiveInteger;
    private parseOptionalPositiveInteger;
    private lastDayOfMonth;
    private compareLocalDates;
    private formatDate;
    private toApiDayOfWeek;
    private hours;
    private cellKey;
    private percentage;
    private toDate;
    private maxDate;
    private minDate;
}
