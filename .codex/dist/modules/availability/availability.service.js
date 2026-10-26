"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvailabilityService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../database/database.service");
const booking_rules_service_1 = require("../bookings/booking-rules.service");
let AvailabilityService = class AvailabilityService {
    bookingRulesService;
    databaseService;
    constructor(bookingRulesService, databaseService) {
        this.bookingRulesService = bookingRulesService;
        this.databaseService = databaseService;
    }
    findAvailability(query, allowedResourceIds) {
        return this.bookingRulesService.getAvailability(query, allowedResourceIds);
    }
    async findAvailabilityForBusiness(query, currentUser) {
        const access = await this.resolveBookingAccess(currentUser, query.businessId, query.branchId, query.resourceId);
        return this.findAvailability({
            ...query,
            businessId: String(access.businessId),
        }, access.allowedResourceIds);
    }
    findDayBounds(query, allowedResourceIds) {
        return this.bookingRulesService.getDayBounds(query, allowedResourceIds);
    }
    async findDayBoundsForBusiness(query, currentUser) {
        const access = await this.resolveBookingAccess(currentUser, query.businessId, query.branchId, query.resourceId);
        return this.findDayBounds({
            ...query,
            businessId: String(access.businessId),
        }, access.allowedResourceIds);
    }
    getBusinessOrFail(businessId) {
        return this.bookingRulesService.getBusinessOrFail(Number(businessId));
    }
    findSingleActiveBranchForBusiness(businessId) {
        return this.bookingRulesService.findSingleActiveBranchForBusiness(businessId);
    }
    findSingleActiveServiceForBranch(businessId, branchId) {
        return this.bookingRulesService.findSingleActiveServiceForBranch(businessId, branchId);
    }
    findActiveServicesForBranch(businessId, branchId, limit = 10) {
        return this.bookingRulesService.findActiveServicesForBranch(businessId, branchId, limit);
    }
    findActiveServiceForBranch(businessId, branchId, serviceId) {
        return this.bookingRulesService.findActiveServiceForBranch(businessId, branchId, serviceId);
    }
    findActiveServiceResourceOptionsForBranch(businessId, branchId, limit = 7) {
        return this.bookingRulesService.findActiveServiceResourceOptionsForBranch(businessId, branchId, limit);
    }
    findEligibleResourcesForService(businessId, branchId, serviceId, resourcePreferences = {}) {
        return this.bookingRulesService.findEligibleResourcesForService(businessId, branchId, serviceId, resourcePreferences);
    }
    findActiveResourceForService(businessId, branchId, serviceId, resourceId) {
        return this.bookingRulesService.findActiveResourceForService(businessId, branchId, serviceId, resourceId);
    }
    async resolveBookingAccess(currentUser, businessIdValue, branchIdValue, resourceIdValue) {
        const authorization = currentUser.authorization;
        if (!authorization) {
            throw new common_1.ForbiddenException('Authorization context is required');
        }
        if (authorization.isSuperadmin) {
            return {
                businessId: this.parsePositiveInteger(businessIdValue, 'businessId'),
                accessScope: 'business',
            };
        }
        const accessScope = authorization.permissions['booking.manage'];
        if (!accessScope) {
            throw new common_1.ForbiddenException('Missing permission booking.manage');
        }
        const businessId = this.requireBusinessUserBusinessId(authorization.businessId);
        if (businessIdValue !== undefined) {
            const requestedBusinessId = this.parsePositiveInteger(businessIdValue, 'businessId');
            if (requestedBusinessId !== businessId) {
                throw new common_1.ForbiddenException('Cannot access another business');
            }
        }
        if (accessScope !== 'business') {
            const branchId = this.parsePositiveInteger(branchIdValue, 'branchId');
            if (!authorization.branchIds.includes(branchId)) {
                throw new common_1.ForbiddenException('Branch is not assigned to user');
            }
            if (accessScope === 'own') {
                return this.resolveOwnBookingAccess(businessId, accessScope, authorization.userId, branchId, resourceIdValue);
            }
        }
        return { businessId, accessScope };
    }
    async resolveOwnBookingAccess(businessId, accessScope, userId, branchId, resourceIdValue) {
        const assignedResourceIds = await this.findAssignedResourceIdsForBranch(userId, businessId, branchId);
        if (assignedResourceIds.length === 0) {
            throw new common_1.ForbiddenException('User has no assigned resources');
        }
        if (resourceIdValue !== undefined &&
            resourceIdValue !== null &&
            resourceIdValue !== '') {
            const resourceId = this.parsePositiveInteger(resourceIdValue, 'resourceId');
            if (!assignedResourceIds.includes(resourceId)) {
                throw new common_1.ForbiddenException('Resource is not assigned to user');
            }
        }
        return {
            businessId,
            accessScope,
            allowedResourceIds: assignedResourceIds,
        };
    }
    async findAssignedResourceIdsForBranch(userId, businessId, branchId) {
        const result = await this.databaseService.query(`
        SELECT r.id
        FROM user_resource ur
        INNER JOIN resource r ON r.id = ur.resource_id
        INNER JOIN branch b ON b.id = r.branch_id
        WHERE ur.user_id = $1
          AND b.business_id = $2
          AND r.branch_id = $3
          AND UPPER(r.status) = 'ACTIVE'
        ORDER BY r.priority ASC, r.name ASC, r.id ASC
      `, [userId, businessId, branchId]);
        return result.rows.map((row) => Number(row.id));
    }
    requireBusinessUserBusinessId(businessId) {
        if (businessId === undefined || businessId === null || businessId === '') {
            throw new common_1.ForbiddenException('User must belong to a business');
        }
        return this.parsePositiveInteger(businessId, 'businessId');
    }
    parsePositiveInteger(value, field) {
        const parsed = Number(value);
        if (value === undefined ||
            value === null ||
            value === '' ||
            !Number.isInteger(parsed) ||
            parsed <= 0) {
            throw new common_1.BadRequestException(`${field} must be a positive integer`);
        }
        return parsed;
    }
};
exports.AvailabilityService = AvailabilityService;
exports.AvailabilityService = AvailabilityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [booking_rules_service_1.BookingRulesService,
        database_service_1.DatabaseService])
], AvailabilityService);
//# sourceMappingURL=availability.service.js.map