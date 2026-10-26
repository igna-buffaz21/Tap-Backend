import { BranchStatsPeriod } from './get-branch-stats-query.dto';
export type BranchDemandStatsPeriod = Exclude<BranchStatsPeriod, 'day'>;
export declare class GetBranchDemandStatsQueryDto {
    period: BranchDemandStatsPeriod;
    resourceId?: string;
    serviceId?: string;
}
