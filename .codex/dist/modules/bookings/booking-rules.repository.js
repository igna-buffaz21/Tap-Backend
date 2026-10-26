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
exports.BookingRulesRepository = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../database/database.service");
const booking_constants_1 = require("./booking.constants");
let BookingRulesRepository = class BookingRulesRepository {
    databaseService;
    constructor(databaseService) {
        this.databaseService = databaseService;
    }
    async findBusiness(businessId) {
        const result = await this.databaseService.query(`
        SELECT id, name, business_type, timezone
        FROM business
        WHERE id = $1
      `, [businessId]);
        return result.rows[0] ?? null;
    }
    async findBranchForBusiness(branchId, businessId) {
        const result = await this.databaseService.query(`
        SELECT id, name
        FROM branch
        WHERE id = $1
          AND business_id = $2
      `, [branchId, businessId]);
        return result.rows[0] ?? null;
    }
    async findActiveBranchesForBusiness(businessId, limit) {
        const result = await this.databaseService.query(`
        SELECT id, name
        FROM branch
        WHERE business_id = $1
          AND UPPER(status) = 'ACTIVE'
        ORDER BY name ASC
        LIMIT $2
      `, [businessId, limit]);
        return result.rows;
    }
    async findServiceForBusiness(serviceId, businessId, branchId) {
        const result = await this.databaseService.query(`
        SELECT
          s.id,
          s.name,
          s.duration_minutes,
          s.price,
          s.resource_selection_mode,
          s.icon_key,
          s.image_url
        FROM service s
        INNER JOIN branch b ON b.id = s.branch_id
        WHERE s.id = $1
          AND b.business_id = $2
          AND s.branch_id = $3
      `, [serviceId, businessId, branchId]);
        return result.rows[0] ?? null;
    }
    async findActiveServiceForBranch(serviceId, businessId, branchId) {
        const result = await this.databaseService.query(`
        SELECT
          s.id,
          s.name,
          s.duration_minutes,
          s.price,
          s.resource_selection_mode,
          s.icon_key,
          s.image_url
        FROM service s
        INNER JOIN branch b ON b.id = s.branch_id
        WHERE s.id = $1
          AND b.business_id = $2
          AND s.branch_id = $3
          AND UPPER(s.status) = 'ACTIVE'
      `, [serviceId, businessId, branchId]);
        return result.rows[0] ?? null;
    }
    async findActiveServicesForBranch(businessId, branchId, limit) {
        const result = await this.databaseService.query(`
        SELECT
          s.id,
          s.name,
          s.duration_minutes,
          s.price,
          s.resource_selection_mode,
          s.icon_key,
          s.image_url
        FROM service s
        INNER JOIN branch b ON b.id = s.branch_id
        WHERE b.business_id = $1
          AND s.branch_id = $2
          AND UPPER(s.status) = 'ACTIVE'
        ORDER BY s.name ASC
        LIMIT $3
      `, [businessId, branchId, limit]);
        return result.rows;
    }
    async findActiveServiceResourceOptionsForBranch(businessId, branchId, limit) {
        const result = await this.databaseService.query(`
        SELECT
          s.id AS service_id,
          s.name AS service_name,
          s.duration_minutes AS service_duration_minutes,
          s.resource_selection_mode AS service_resource_selection_mode,
          r.id AS resource_id,
          r.name AS resource_name,
          r.is_indoor AS resource_is_indoor,
          r.priority AS resource_priority
        FROM service s
        INNER JOIN branch b ON b.id = s.branch_id
        INNER JOIN resource_service rs ON rs.service_id = s.id
        INNER JOIN resource r ON r.id = rs.resource_id
        WHERE b.business_id = $1
          AND s.branch_id = $2
          AND r.branch_id = $2
          AND UPPER(s.status) = 'ACTIVE'
          AND UPPER(r.status) = 'ACTIVE'
        ORDER BY s.name ASC, r.priority ASC, r.name ASC
        LIMIT $3
      `, [businessId, branchId, limit]);
        return result.rows;
    }
    async findResourceForBranch(resourceId, branchId, businessId) {
        const result = await this.databaseService.query(`
        SELECT r.id, r.name, r.type, r.photo_url, r.is_indoor, r.priority
        FROM resource r
        INNER JOIN branch b ON b.id = r.branch_id
        WHERE r.id = $1
          AND r.branch_id = $2
          AND b.business_id = $3
          AND UPPER(r.status) = 'ACTIVE'
      `, [resourceId, branchId, businessId]);
        return result.rows[0] ?? null;
    }
    async findActiveResourceForService(resourceId, businessId, branchId, serviceId) {
        const result = await this.databaseService.query(`
        SELECT r.id, r.name, r.type, r.photo_url, r.is_indoor, r.priority
        FROM resource r
        INNER JOIN branch b ON b.id = r.branch_id
        INNER JOIN resource_service rs ON rs.resource_id = r.id
        WHERE r.id = $1
          AND b.business_id = $2
          AND r.branch_id = $3
          AND rs.service_id = $4
          AND UPPER(r.status) = 'ACTIVE'
      `, [resourceId, businessId, branchId, serviceId]);
        return result.rows[0] ?? null;
    }
    async resourceOffersService(resourceId, serviceId) {
        const result = await this.databaseService.query(`
        SELECT EXISTS (
          SELECT 1
          FROM resource_service
          WHERE resource_id = $1
            AND service_id = $2
        ) AS exists
      `, [resourceId, serviceId]);
        return result.rows[0]?.exists === true;
    }
    async findEligibleResources(businessId, branchId, serviceId, resourceId, isIndoor, allowedResourceIds) {
        const values = [businessId, branchId, serviceId];
        let resourceFilter = '';
        let indoorFilter = '';
        let allowedResourceFilter = '';
        if (resourceId) {
            values.push(resourceId);
            resourceFilter = `AND r.id = $${values.length}`;
        }
        else if (allowedResourceIds !== undefined) {
            if (allowedResourceIds.length === 0) {
                allowedResourceFilter = 'AND FALSE';
            }
            else {
                values.push(allowedResourceIds);
                allowedResourceFilter = `AND r.id = ANY($${values.length}::int[])`;
            }
        }
        if (isIndoor !== undefined) {
            values.push(isIndoor);
            indoorFilter = `AND r.is_indoor = $${values.length}`;
        }
        const result = await this.databaseService.query(`
        SELECT r.id, r.name, r.type, r.photo_url, r.is_indoor, r.priority
        FROM resource r
        INNER JOIN branch b ON b.id = r.branch_id
        INNER JOIN resource_service rs ON rs.resource_id = r.id
        WHERE b.business_id = $1
          AND r.branch_id = $2
          AND rs.service_id = $3
          AND UPPER(r.status) = 'ACTIVE'
          ${resourceFilter}
          ${allowedResourceFilter}
          ${indoorFilter}
        ORDER BY r.priority ASC, r.name ASC
      `, values);
        return result.rows;
    }
    async findCustomer(customerId) {
        const result = await this.databaseService.query(`
        SELECT id, name, phone
        FROM customer
        WHERE id = $1
      `, [customerId]);
        return result.rows[0] ?? null;
    }
    async findSchedules(resourceIds, dayOfWeek) {
        if (resourceIds.length === 0) {
            return [];
        }
        const result = await this.databaseService.query(`
        SELECT resource_id, start_time::text, end_time::text
        FROM resource_schedule
        WHERE resource_id = ANY($1::int[])
          AND day_of_week = $2
          AND UPPER(status) = 'ACTIVE'
        ORDER BY start_time ASC
      `, [resourceIds, dayOfWeek]);
        return result.rows;
    }
    async findActiveSchedulesForBranchDay(businessId, branchId, dayOfWeek, resourceId, allowedResourceIds) {
        const values = [businessId, branchId, dayOfWeek];
        let resourceFilter = '';
        if (resourceId) {
            resourceFilter = `AND r.id = $${values.push(resourceId)}`;
        }
        else if (allowedResourceIds !== undefined) {
            resourceFilter =
                allowedResourceIds.length === 0
                    ? 'AND FALSE'
                    : `AND r.id = ANY($${values.push(allowedResourceIds)}::int[])`;
        }
        const result = await this.databaseService.query(`
        SELECT
          rs.resource_id,
          r.name AS resource_name,
          rs.start_time::text,
          rs.end_time::text
        FROM resource_schedule rs
        INNER JOIN resource r ON r.id = rs.resource_id
        INNER JOIN branch b ON b.id = r.branch_id
        WHERE b.business_id = $1
          AND r.branch_id = $2
          AND rs.day_of_week = $3
          AND UPPER(rs.status) = 'ACTIVE'
          AND UPPER(r.status) = 'ACTIVE'
          ${resourceFilter}
        ORDER BY rs.start_time ASC, rs.end_time ASC, r.priority ASC, r.name ASC
      `, values);
        return result.rows;
    }
    async findBlocks(resourceIds, rangeStart, rangeEnd) {
        if (resourceIds.length === 0) {
            return [];
        }
        const result = await this.databaseService.query(`
        SELECT resource_id, start_at, end_at
        FROM resource_block
        WHERE resource_id = ANY($1::int[])
          AND start_at < $3
          AND end_at > $2
      `, [resourceIds, rangeStart, rangeEnd]);
        return result.rows;
    }
    async findBlocksForBranchDay(businessId, branchId, rangeStart, rangeEnd, resourceId, allowedResourceIds) {
        const values = [businessId, branchId, rangeStart, rangeEnd];
        let resourceFilter = '';
        if (resourceId) {
            resourceFilter = `AND r.id = $${values.push(resourceId)}`;
        }
        else if (allowedResourceIds !== undefined) {
            resourceFilter =
                allowedResourceIds.length === 0
                    ? 'AND FALSE'
                    : `AND r.id = ANY($${values.push(allowedResourceIds)}::int[])`;
        }
        const result = await this.databaseService.query(`
        SELECT
          rb.id,
          rb.resource_id,
          r.name AS resource_name,
          rb.start_at,
          rb.end_at,
          rb.reason
        FROM resource_block rb
        INNER JOIN resource r ON r.id = rb.resource_id
        INNER JOIN branch b ON b.id = r.branch_id
        WHERE b.business_id = $1
          AND r.branch_id = $2
          AND UPPER(r.status) = 'ACTIVE'
          AND rb.start_at < $4
          AND rb.end_at > $3
          ${resourceFilter}
        ORDER BY rb.start_at ASC, rb.end_at ASC, r.priority ASC, r.name ASC
      `, values);
        return result.rows;
    }
    async findActiveBookings(resourceIds, rangeStart, rangeEnd) {
        if (resourceIds.length === 0) {
            return [];
        }
        const result = await this.databaseService.query(`
        SELECT id AS booking_id, resource_id, start_at, end_at
        FROM booking
        WHERE resource_id = ANY($1::int[])
          AND status = ANY($4::text[])
          AND start_at < $3
          AND end_at > $2
      `, [resourceIds, rangeStart, rangeEnd, booking_constants_1.ACTIVE_BOOKING_STATUSES]);
        return result.rows;
    }
};
exports.BookingRulesRepository = BookingRulesRepository;
exports.BookingRulesRepository = BookingRulesRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], BookingRulesRepository);
//# sourceMappingURL=booking-rules.repository.js.map