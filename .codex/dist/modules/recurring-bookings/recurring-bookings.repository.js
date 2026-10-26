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
exports.RecurringBookingsRepository = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../database/database.service");
const booking_constants_1 = require("../bookings/booking.constants");
const TABLE_NAME = 'recurring_booking';
const UPDATE_COLUMNS = [
    'branch_id',
    'resource_id',
    'service_id',
    'customer_id',
    'day_of_week',
    'start_time',
    'start_date',
    'end_date',
    'status',
];
let RecurringBookingsRepository = class RecurringBookingsRepository {
    databaseService;
    constructor(databaseService) {
        this.databaseService = databaseService;
    }
    async create(record, executor = this.databaseService) {
        const result = await executor.query(`
        INSERT INTO ${TABLE_NAME} (
          branch_id,
          resource_id,
          service_id,
          customer_id,
          day_of_week,
          start_time,
          start_date,
          end_date,
          status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
            record.branchId,
            record.resourceId,
            record.serviceId,
            record.customerId,
            record.dayOfWeek,
            record.startTime,
            record.startDate,
            record.endDate,
            record.status ?? 'ACTIVE',
        ]);
        return result.rows[0];
    }
    async findAllForBusiness(businessId, searchPattern, phoneSearchPatterns, limit, offset, accessFilter) {
        const values = [
            businessId,
            searchPattern,
            phoneSearchPatterns,
            ['PENDING', 'CONFIRMED'],
            limit,
            offset,
        ];
        const branchAccessCondition = this.buildBranchAccessCondition('rb.branch_id', values, accessFilter?.allowedBranchIds);
        const result = await this.databaseService.query(`
        SELECT
          rb.id,
          rb.branch_id,
          rb.status,
          c.id AS customer_id,
          c.name AS customer_name,
          c.phone AS customer_phone,
          c.email AS customer_email,
          s.id AS service_id,
          s.name AS service_name,
          s.duration_minutes AS service_duration_minutes,
          r.id AS resource_id,
          r.name AS resource_name,
          rb.day_of_week,
          rb.start_time,
          rb.start_date,
          rb.end_date,
          MIN(b.start_at) FILTER (
            WHERE b.start_at >= NOW()
              AND b.status = ANY($4::varchar[])
          ) AS next_booking_at,
          business.timezone AS business_timezone,
          COUNT(*) OVER() AS total_count
        FROM ${TABLE_NAME} rb
        INNER JOIN branch br ON br.id = rb.branch_id
        INNER JOIN business ON business.id = br.business_id
        INNER JOIN customer c ON c.id = rb.customer_id
        INNER JOIN service s
          ON s.id = rb.service_id
          AND s.branch_id = br.id
        INNER JOIN resource r
          ON r.id = rb.resource_id
          AND r.branch_id = br.id
        LEFT JOIN booking b
          ON b.recurring_booking_id = rb.id
          AND b.business_id = br.business_id
        WHERE br.business_id = $1
          ${branchAccessCondition}
          AND (
            $2::text IS NULL
            OR c.name ILIKE $2
            OR c.email ILIKE $2
            OR c.phone ILIKE $2
            OR c.phone ILIKE ANY($3::text[])
          )
        GROUP BY
          rb.id,
          rb.branch_id,
          c.id,
          s.id,
          r.id,
          business.timezone
        ORDER BY rb.start_date ASC, rb.start_time ASC, rb.id ASC
        LIMIT $5
        OFFSET $6
      `, values);
        return result.rows;
    }
    async findByIdForBusiness(id, businessId, accessFilter) {
        const values = [id, businessId];
        const branchAccessCondition = this.buildBranchAccessCondition('rb.branch_id', values, accessFilter?.allowedBranchIds);
        const result = await this.databaseService.query(`
        SELECT rb.*
        FROM ${TABLE_NAME} rb
        INNER JOIN branch br ON br.id = rb.branch_id
        WHERE rb.id = $1
          AND br.business_id = $2
          ${branchAccessCondition}
      `, values);
        return result.rows[0] ?? null;
    }
    async findDetailForBusiness(id, businessId, accessFilter) {
        const values = [id, businessId, ['PENDING', 'CONFIRMED']];
        const branchAccessCondition = this.buildBranchAccessCondition('rb.branch_id', values, accessFilter?.allowedBranchIds);
        const result = await this.databaseService.query(`
        SELECT
          rb.id,
          rb.branch_id,
          rb.status,
          c.id AS customer_id,
          c.name AS customer_name,
          c.phone AS customer_phone,
          c.email AS customer_email,
          s.id AS service_id,
          s.name AS service_name,
          s.duration_minutes AS service_duration_minutes,
          r.id AS resource_id,
          r.name AS resource_name,
          rb.day_of_week,
          rb.start_time,
          rb.start_date,
          rb.end_date,
          COUNT(b.id) AS total_count,
          COUNT(b.id) FILTER (WHERE b.status = 'COMPLETED') AS attended_count,
          COUNT(b.id) FILTER (
            WHERE b.status = ANY($3::varchar[])
          ) AS pending_count,
          COUNT(b.id) FILTER (WHERE b.status = 'NO_SHOW') AS no_show_count,
          COUNT(b.id) FILTER (WHERE b.status = 'CANCELLED') AS cancelled_count,
          MIN(b.start_at) FILTER (
            WHERE b.start_at >= NOW()
              AND b.status = ANY($3::varchar[])
          ) AS next_booking_at,
          business.timezone AS business_timezone
        FROM ${TABLE_NAME} rb
        INNER JOIN branch br ON br.id = rb.branch_id
        INNER JOIN business ON business.id = br.business_id
        INNER JOIN customer c ON c.id = rb.customer_id
        INNER JOIN service s
          ON s.id = rb.service_id
          AND s.branch_id = br.id
        INNER JOIN resource r
          ON r.id = rb.resource_id
          AND r.branch_id = br.id
        LEFT JOIN booking b
          ON b.recurring_booking_id = rb.id
          AND b.business_id = br.business_id
        WHERE rb.id = $1
          AND br.business_id = $2
          ${branchAccessCondition}
        GROUP BY
          rb.id,
          rb.branch_id,
          c.id,
          s.id,
          r.id,
          business.timezone
      `, values);
        return result.rows[0] ?? null;
    }
    async findServiceDurationForBusiness(serviceId, branchId, businessId) {
        const result = await this.databaseService.query(`
        SELECT s.duration_minutes
        FROM service s
        INNER JOIN branch br ON br.id = s.branch_id
        WHERE s.id = $1
          AND s.branch_id = $2
          AND br.business_id = $3
        LIMIT 1
      `, [serviceId, branchId, businessId]);
        const duration = result.rows[0]?.duration_minutes;
        return duration === undefined ? null : Number(duration);
    }
    async update(id, businessId, updateRecurringBookingDto, accessFilter, executor = this.databaseService) {
        const entries = UPDATE_COLUMNS.filter((column) => Object.prototype.hasOwnProperty.call(updateRecurringBookingDto, column))
            .map((column) => [
            column,
            updateRecurringBookingDto[column],
        ])
            .filter(([, value]) => value !== undefined);
        if (entries.length === 0) {
            return this.findByIdForBusiness(id, businessId, accessFilter);
        }
        const assignments = entries.map(([column], index) => `${column} = $${index + 1}`);
        const values = entries.map(([, value]) => value);
        values.push(id, businessId);
        const idParamIndex = values.length - 1;
        const businessIdParamIndex = values.length;
        const branchAccessCondition = this.buildBranchAccessCondition(`${TABLE_NAME}.branch_id`, values, accessFilter?.allowedBranchIds);
        const result = await executor.query(`
        UPDATE ${TABLE_NAME}
        SET
          ${assignments.join(', ')}
        WHERE id = $${idParamIndex}
          AND EXISTS (
            SELECT 1
            FROM branch br
            WHERE br.id = ${TABLE_NAME}.branch_id
              AND br.business_id = $${businessIdParamIndex}
          )
          ${branchAccessCondition}
        RETURNING *
      `, values);
        return result.rows[0] ?? null;
    }
    async findActiveBookingsForRecurring(recurringBookingId, businessId, executor = this.databaseService) {
        const result = await executor.query(`
        SELECT b.id, b.start_at
        FROM booking b
        WHERE b.recurring_booking_id = $1
          AND b.business_id = $2
          AND b.status = ANY($3::varchar[])
        ORDER BY b.start_at ASC, b.id ASC
      `, [recurringBookingId, businessId, booking_constants_1.ACTIVE_BOOKING_STATUSES]);
        return result.rows;
    }
    async updateActiveBookingOccurrence(input, executor) {
        await executor.query(`
        UPDATE booking
        SET
          branch_id = $4,
          resource_id = $5,
          customer_id = $6,
          service_id = $7,
          start_at = $8,
          end_at = $9,
          updated_at = NOW()
        WHERE id = $1
          AND business_id = $2
          AND recurring_booking_id = $3
          AND status = ANY($10::varchar[])
      `, [
            input.bookingId,
            input.businessId,
            input.recurringBookingId,
            input.branchId,
            input.resourceId,
            input.customerId,
            input.serviceId,
            input.startAt,
            input.endAt,
            booking_constants_1.ACTIVE_BOOKING_STATUSES,
        ]);
    }
    async cancelActiveBookingOccurrence(input, executor) {
        await executor.query(`
        UPDATE booking
        SET
          status = 'CANCELLED',
          cancelled_at = COALESCE(cancelled_at, NOW()),
          updated_at = NOW()
        WHERE id = $1
          AND business_id = $2
          AND recurring_booking_id = $3
          AND status = ANY($4::varchar[])
      `, [
            input.bookingId,
            input.businessId,
            input.recurringBookingId,
            booking_constants_1.ACTIVE_BOOKING_STATUSES,
        ]);
    }
    async cancelActiveBookingsForRecurring(recurringBookingId, businessId, accessFilter, executor = this.databaseService) {
        const values = [
            recurringBookingId,
            businessId,
            booking_constants_1.ACTIVE_BOOKING_STATUSES,
        ];
        const branchAccessCondition = this.buildBranchAccessCondition('booking.branch_id', values, accessFilter?.allowedBranchIds);
        await executor.query(`
        UPDATE booking
        SET
          status = 'CANCELLED',
          cancelled_at = COALESCE(cancelled_at, NOW()),
          updated_at = NOW()
        WHERE recurring_booking_id = $1
          AND business_id = $2
          AND status = ANY($3::varchar[])
          ${branchAccessCondition}
      `, values);
    }
    async remove(id, businessId, accessFilter) {
        const values = [id, businessId];
        const branchAccessCondition = this.buildBranchAccessCondition(`${TABLE_NAME}.branch_id`, values, accessFilter?.allowedBranchIds);
        const result = await this.databaseService.query(`
        DELETE FROM ${TABLE_NAME}
        WHERE id = $1
          AND EXISTS (
            SELECT 1
            FROM branch br
            WHERE br.id = ${TABLE_NAME}.branch_id
              AND br.business_id = $2
          )
          ${branchAccessCondition}
      `, values);
        return result.rowCount === 1;
    }
    async businessExists(businessId) {
        const result = await this.databaseService.query(`
        SELECT 1
        FROM business
        WHERE id = $1
        LIMIT 1
      `, [businessId]);
        return result.rowCount === 1;
    }
    async contextBelongsToBusiness(record, executor = this.databaseService) {
        const result = await executor.query(`
        SELECT 1
        FROM branch br
        INNER JOIN resource r
          ON r.id = $3
          AND r.branch_id = br.id
        INNER JOIN service s
          ON s.id = $4
          AND s.branch_id = br.id
        INNER JOIN resource_service rs
          ON rs.resource_id = r.id
          AND rs.service_id = s.id
        INNER JOIN customer_business cb
          ON cb.customer_id = $5
          AND cb.business_id = br.business_id
        WHERE br.id = $2
          AND br.business_id = $1
        LIMIT 1
      `, [
            record.businessId,
            record.branchId,
            record.resourceId,
            record.serviceId,
            record.customerId,
        ]);
        return result.rowCount === 1;
    }
    buildBranchAccessCondition(branchIdExpression, values, allowedBranchIds) {
        if (allowedBranchIds === undefined) {
            return '';
        }
        if (allowedBranchIds.length === 0) {
            return 'AND FALSE';
        }
        values.push(allowedBranchIds);
        return `AND ${branchIdExpression} = ANY($${values.length}::bigint[])`;
    }
};
exports.RecurringBookingsRepository = RecurringBookingsRepository;
exports.RecurringBookingsRepository = RecurringBookingsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], RecurringBookingsRepository);
//# sourceMappingURL=recurring-bookings.repository.js.map