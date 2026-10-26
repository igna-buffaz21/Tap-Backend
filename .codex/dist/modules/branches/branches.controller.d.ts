import { User } from '../users/entities/user.entity';
import { BranchesService } from './branches.service';
import { BranchImageUploadSignatureDto } from './dto/branch-image-upload-signature.dto';
import { BranchStatsService } from './branch-stats.service';
import { GetBranchDemandStatsQueryDto } from './dto/get-branch-demand-stats-query.dto';
import { GetBranchStatsQueryDto } from './dto/get-branch-stats-query.dto';
import { CreateBranchDto } from './dto/create-branch.dto';
import { CreateBranchImageUploadSignatureDto } from './dto/create-branch-image-upload-signature.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
export declare class BranchesController {
    private readonly branchesService;
    private readonly branchStatsService;
    constructor(branchesService: BranchesService, branchStatsService: BranchStatsService);
    create(createBranchDto: CreateBranchDto, currentUser: User): Promise<import("./entities/branch.entity").Branch>;
    findAll(currentUser: User): Promise<import("./entities/branch.entity").Branch[]>;
    getStats(branchId: string, query: GetBranchStatsQueryDto, currentUser: User): Promise<{
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
    getDemandStats(branchId: string, query: GetBranchDemandStatsQueryDto, currentUser: User): Promise<{
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
    findOne(id: string, currentUser: User): Promise<import("./entities/branch.entity").Branch | null>;
    createImageUploadSignature(id: string, dto: CreateBranchImageUploadSignatureDto, currentUser: User): Promise<BranchImageUploadSignatureDto>;
    update(id: string, updateBranchDto: UpdateBranchDto, currentUser: User): Promise<import("./entities/branch.entity").Branch | null>;
    remove(id: string, currentUser: User): Promise<boolean>;
}
