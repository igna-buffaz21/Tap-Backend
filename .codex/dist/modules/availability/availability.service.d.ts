import { DatabaseService } from '../../database/database.service';
import { BookingRulesService } from '../bookings/booking-rules.service';
import { User } from '../users/entities/user.entity';
import { GetDayBoundsDto } from './dto/get-day-bounds.dto';
import { GetAvailabilityDto } from './dto/get-availability.dto';
export declare class AvailabilityService {
    private readonly bookingRulesService;
    private readonly databaseService;
    constructor(bookingRulesService: BookingRulesService, databaseService: DatabaseService);
    findAvailability(query: GetAvailabilityDto, allowedResourceIds?: number[]): Promise<import("../bookings/booking-rules.service").AvailabilityResponse>;
    findAvailabilityForBusiness(query: GetAvailabilityDto, currentUser: User): Promise<import("../bookings/booking-rules.service").AvailabilityResponse>;
    findDayBounds(query: GetDayBoundsDto, allowedResourceIds?: number[]): Promise<import("../bookings/booking-rules.service").DayBoundsResponse>;
    findDayBoundsForBusiness(query: GetDayBoundsDto, currentUser: User): Promise<import("../bookings/booking-rules.service").DayBoundsResponse>;
    getBusinessOrFail(businessId: number | string): Promise<import("../bookings/booking-rules.repository").BusinessRow>;
    findSingleActiveBranchForBusiness(businessId: number | string): Promise<import("../bookings/booking-rules.repository").BranchRow | null>;
    findSingleActiveServiceForBranch(businessId: number | string, branchId: number | string): Promise<import("../bookings/booking-rules.repository").ServiceRow | null>;
    findActiveServicesForBranch(businessId: number | string, branchId: number | string, limit?: number | string): Promise<import("../bookings/booking-rules.repository").ServiceRow[]>;
    findActiveServiceForBranch(businessId: number | string, branchId: number | string, serviceId: number | string): Promise<import("../bookings/booking-rules.repository").ServiceRow | null>;
    findActiveServiceResourceOptionsForBranch(businessId: number | string, branchId: number | string, limit?: number | string): Promise<import("../bookings/booking-rules.repository").ServiceResourceOptionRow[]>;
    findEligibleResourcesForService(businessId: number | string, branchId: number | string, serviceId: number | string, resourcePreferences?: {
        isIndoor?: boolean;
    }): Promise<import("../bookings/booking-rules.repository").ResourceRow[]>;
    findActiveResourceForService(businessId: number | string, branchId: number | string, serviceId: number | string, resourceId: number | string): Promise<import("../bookings/booking-rules.repository").ResourceRow | null>;
    private resolveBookingAccess;
    private resolveOwnBookingAccess;
    private findAssignedResourceIdsForBranch;
    private requireBusinessUserBusinessId;
    private parsePositiveInteger;
}
