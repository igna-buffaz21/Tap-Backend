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
exports.PublicBookingRepository = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../database/database.service");
const booking_constants_1 = require("../bookings/booking.constants");
let PublicBookingRepository = class PublicBookingRepository {
    databaseService;
    constructor(databaseService) {
        this.databaseService = databaseService;
    }
    async findActiveBranchesBySlug(slug) {
        const result = await this.databaseService.query(`
        SELECT
          br.id,
          br.slug,
          br.name,
          br.description,
          br.logo_url,
          br.cover_image_url,
          br.primary_color,
          br.instagram_url,
          br.facebook_url,
          br.address,
          br.phone,
          br.lat,
          br.lng,
          br.opening_hours,
          b.id AS business_id,
          b.name AS business_name,
          b.timezone
        FROM branch br
        INNER JOIN business b ON b.id = br.business_id
        WHERE br.slug = $1
          AND UPPER(br.status) = 'ACTIVE'
          AND UPPER(b.status) = 'ACTIVE'
        ORDER BY br.id ASC
        LIMIT 2
      `, [slug]);
        return result.rows;
    }
    async findUpcomingBookingsByCustomerEmail(filters) {
        const result = await this.databaseService.query(`
        SELECT
          b.id,
          b.start_at,
          b.end_at,
          b.status,
          b.confirmation_status,
          b.reconfirmed_at,
          b.cancelled_at,
          b.total_price,
          b.reservation_name,
          b.notes,
          s.id AS service_id,
          s.name AS service_name,
          r.id AS resource_id,
          r.name AS resource_name,
          r.is_indoor AS resource_is_indoor,
          c.name AS customer_name,
          c.phone AS customer_phone,
          c.email AS customer_email
        FROM booking b
        INNER JOIN branch br
          ON br.id = b.branch_id
          AND br.business_id = b.business_id
        INNER JOIN service s
          ON s.id = b.service_id
          AND s.branch_id = br.id
        INNER JOIN resource r
          ON r.id = b.resource_id
          AND r.branch_id = br.id
        INNER JOIN customer c ON c.id = b.customer_id
        WHERE b.business_id = $1
          AND b.branch_id = $2
          AND b.end_at >= $3
          AND b.status = ANY($4::varchar[])
          AND LOWER(c.email) = $5
        ORDER BY b.start_at ASC
        LIMIT $6
      `, [
            filters.businessId,
            filters.branchId,
            filters.now,
            booking_constants_1.ACTIVE_BOOKING_STATUSES,
            filters.email,
            filters.limit,
        ]);
        return result.rows;
    }
    async findUpcomingBookingsByCustomerPhone(filters) {
        const result = await this.databaseService.query(`
        SELECT
          b.id,
          b.start_at,
          b.end_at,
          b.status,
          b.confirmation_status,
          b.reconfirmed_at,
          b.cancelled_at,
          b.total_price,
          b.reservation_name,
          b.notes,
          s.id AS service_id,
          s.name AS service_name,
          r.id AS resource_id,
          r.name AS resource_name,
          r.is_indoor AS resource_is_indoor,
          c.name AS customer_name,
          c.phone AS customer_phone,
          c.email AS customer_email
        FROM booking b
        INNER JOIN branch br
          ON br.id = b.branch_id
          AND br.business_id = b.business_id
        INNER JOIN service s
          ON s.id = b.service_id
          AND s.branch_id = br.id
        INNER JOIN resource r
          ON r.id = b.resource_id
          AND r.branch_id = br.id
        INNER JOIN customer c ON c.id = b.customer_id
        WHERE b.business_id = $1
          AND b.branch_id = $2
          AND b.end_at >= $3
          AND b.status = ANY($4::varchar[])
          AND c.phone = ANY($5::text[])
        ORDER BY b.start_at ASC
        LIMIT $6
      `, [
            filters.businessId,
            filters.branchId,
            filters.now,
            booking_constants_1.ACTIVE_BOOKING_STATUSES,
            filters.phones,
            filters.limit,
        ]);
        return result.rows;
    }
    async findActiveBookingCustomerByEmail(filters) {
        const result = await this.databaseService.query(`
          SELECT b.customer_id
          FROM booking b
          INNER JOIN branch br
            ON br.id = b.branch_id
            AND br.business_id = b.business_id
          INNER JOIN customer c ON c.id = b.customer_id
          WHERE b.id = $1
            AND b.business_id = $2
            AND b.branch_id = $3
            AND b.end_at >= $4
            AND b.status = ANY($5::varchar[])
            AND LOWER(c.email) = $6
          LIMIT 1
        `, [
            filters.bookingId,
            filters.businessId,
            filters.branchId,
            filters.now,
            booking_constants_1.ACTIVE_BOOKING_STATUSES,
            filters.email,
        ]);
        return result.rows[0] ?? null;
    }
    async findActiveBookingCustomerByPhone(filters) {
        const result = await this.databaseService.query(`
          SELECT b.customer_id
          FROM booking b
          INNER JOIN branch br
            ON br.id = b.branch_id
            AND br.business_id = b.business_id
          INNER JOIN customer c ON c.id = b.customer_id
          WHERE b.id = $1
            AND b.business_id = $2
            AND b.branch_id = $3
            AND b.end_at >= $4
            AND b.status = ANY($5::varchar[])
            AND c.phone = ANY($6::text[])
          LIMIT 1
        `, [
            filters.bookingId,
            filters.businessId,
            filters.branchId,
            filters.now,
            booking_constants_1.ACTIVE_BOOKING_STATUSES,
            filters.phones,
        ]);
        return result.rows[0] ?? null;
    }
};
exports.PublicBookingRepository = PublicBookingRepository;
exports.PublicBookingRepository = PublicBookingRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], PublicBookingRepository);
//# sourceMappingURL=public-booking.repository.js.map