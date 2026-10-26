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
exports.BookingsRepository = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../database/database.service");
const booking_constants_1 = require("./booking.constants");
const TABLE_NAME = 'booking';
const UPDATE_COLUMNS = [
    'branch_id',
    'resource_id',
    'customer_id',
    'service_id',
    'start_at',
    'end_at',
    'status',
    'confirmation_status',
    'reconfirmed_at',
    'cancelled_at',
    'source',
    'total_price',
    'reservation_name',
    'notes',
];
let BookingsRepository = class BookingsRepository {
    databaseService;
    constructor(databaseService) {
        this.databaseService = databaseService;
    }
    async create(record, executor = this.databaseService) {
        const result = await executor.query(`
        INSERT INTO ${TABLE_NAME} (
          business_id,
          branch_id,
          resource_id,
          customer_id,
          service_id,
          start_at,
          end_at,
          status,
          confirmation_status,
          source,
          total_price,
          reservation_name,
          notes,
          recurring_booking_id
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
        )
        RETURNING *
      `, [
            record.businessId,
            record.branchId,
            record.resourceId,
            record.customerId,
            record.serviceId,
            record.startAt,
            record.endAt,
            record.status,
            record.confirmationStatus,
            record.source,
            record.totalPrice,
            record.reservationName,
            record.notes,
            record.recurringBookingId ?? null,
        ]);
        return result.rows[0];
    }
    async updateInitialConfirmationStatus(id, reconfirmationRequiredAfterMs, executor = this.databaseService) {
        const result = await executor.query(`
        UPDATE ${TABLE_NAME}
        SET
          confirmation_status = CASE
            WHEN start_at - NOW() >= ($2::bigint * INTERVAL '1 millisecond')
              THEN 'pending'
            ELSE 'not_required'
          END,
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `, [id, reconfirmationRequiredAfterMs]);
        return result.rows[0];
    }
    async findAll() {
        const result = await this.databaseService.query(`
      SELECT *
      FROM ${TABLE_NAME}
    `);
        return result.rows;
    }
    async findById(id) {
        const result = await this.databaseService.query(`
        SELECT *
        FROM ${TABLE_NAME}
        WHERE id = $1
      `, [id]);
        return result.rows[0] ?? null;
    }
    async findDetailed(filters) {
        const values = [
            filters.businessId,
            filters.from,
            filters.to,
            booking_constants_1.FREQUENT_CUSTOMER_WINDOW_DAYS,
        ];
        const conditions = [
            'b.business_id = $1',
            'b.start_at >= $2',
            'b.start_at < $3',
        ];
        this.addOptionalCondition(conditions, values, 'b.branch_id', filters.branchId);
        this.addOptionalCondition(conditions, values, 'b.resource_id', filters.resourceId);
        this.addOptionalCondition(conditions, values, 'b.service_id', filters.serviceId);
        this.addOptionalCondition(conditions, values, 'b.customer_id', filters.customerId);
        this.addOptionalCondition(conditions, values, 'b.status', filters.status);
        this.addAllowedBranchCondition(conditions, values, 'b.branch_id', filters.allowedBranchIds);
        this.addAllowedResourceCondition(conditions, values, 'b.resource_id', filters.allowedResourceIds);
        values.push(filters.limit, (filters.page - 1) * filters.limit);
        const result = await this.databaseService.query(`
        SELECT
          b.id,
          b.business_id,
          b.branch_id,
          br.name AS branch_name,
          b.resource_id,
          r.name AS resource_name,
          r.priority AS resource_priority,
          r.is_indoor AS resource_is_indoor,
          b.service_id,
          s.name AS service_name,
          b.customer_id,
          c.name AS customer_name,
          c.phone AS customer_phone,
          customer_stats.no_show_count AS customer_no_show_count,
          customer_stats.completed_count AS customer_completed_count,
          customer_stats.completed_last_window_count AS customer_completed_last_window_count,
          b.start_at,
          b.end_at,
          b.status,
          b.confirmation_status,
          b.reconfirmed_at,
          b.cancelled_at,
          b.source,
          b.total_price,
          b.reservation_name,
          b.notes,
          b.recurring_booking_id
        FROM booking b
        INNER JOIN branch br
          ON br.id = b.branch_id
          AND br.business_id = b.business_id
        INNER JOIN resource r
          ON r.id = b.resource_id
          AND r.branch_id = br.id
        INNER JOIN service s
          ON s.id = b.service_id
          AND s.branch_id = br.id
        LEFT JOIN customer c ON c.id = b.customer_id
        LEFT JOIN LATERAL (
          SELECT
            COUNT(*) FILTER (
              WHERE customer_booking.status = 'NO_SHOW'
            ) AS no_show_count,
            COUNT(*) FILTER (
              WHERE customer_booking.status = 'COMPLETED'
            ) AS completed_count,
            COUNT(*) FILTER (
              WHERE customer_booking.status = 'COMPLETED'
                AND customer_booking.start_at >= NOW() - ($4::integer * INTERVAL '1 day')
            ) AS completed_last_window_count
          FROM booking customer_booking
          WHERE customer_booking.business_id = b.business_id
            AND customer_booking.customer_id = b.customer_id
        ) customer_stats ON TRUE
        WHERE ${conditions.join('\n          AND ')}
        ORDER BY b.start_at ASC
        LIMIT $${values.length - 1}
        OFFSET $${values.length}
      `, values);
        return result.rows;
    }
    async findUpcomingDetailedForCustomer(filters) {
        const values = [
            filters.businessId,
            filters.customerId,
            filters.now,
            booking_constants_1.ACTIVE_BOOKING_STATUSES,
        ];
        const conditions = [
            'b.business_id = $1',
            'b.customer_id = $2',
            'b.end_at >= $3',
            'b.status = ANY($4::varchar[])',
        ];
        if (filters.from) {
            values.push(filters.from);
            conditions.push(`b.start_at >= $${values.length}`);
        }
        if (filters.to) {
            values.push(filters.to);
            conditions.push(`b.start_at < $${values.length}`);
        }
        this.addOptionalCondition(conditions, values, 'b.branch_id', filters.branchId);
        values.push(filters.limit);
        const result = await this.databaseService.query(`
        SELECT
          b.id,
          b.business_id,
          b.branch_id,
          br.name AS branch_name,
          b.resource_id,
          r.name AS resource_name,
          r.priority AS resource_priority,
          r.is_indoor AS resource_is_indoor,
          b.service_id,
          s.name AS service_name,
          b.customer_id,
          c.name AS customer_name,
          c.phone AS customer_phone,
          b.start_at,
          b.end_at,
          b.status,
          b.confirmation_status,
          b.reconfirmed_at,
          b.cancelled_at,
          b.source,
          b.total_price,
          b.reservation_name,
          b.notes,
          b.recurring_booking_id
        FROM booking b
        INNER JOIN branch br
          ON br.id = b.branch_id
          AND br.business_id = b.business_id
        INNER JOIN resource r
          ON r.id = b.resource_id
          AND r.branch_id = br.id
        INNER JOIN service s
          ON s.id = b.service_id
          AND s.branch_id = br.id
        LEFT JOIN customer c ON c.id = b.customer_id
        WHERE ${conditions.join('\n          AND ')}
        ORDER BY b.start_at ASC
        LIMIT $${values.length}
      `, values);
        return result.rows;
    }
    async findDetailedById(id, businessId, allowedBranchIds, allowedResourceIds) {
        const values = [id, businessId];
        const conditions = ['b.id = $1', 'b.business_id = $2'];
        this.addAllowedBranchCondition(conditions, values, 'b.branch_id', allowedBranchIds);
        this.addAllowedResourceCondition(conditions, values, 'b.resource_id', allowedResourceIds);
        const result = await this.databaseService.query(`
        SELECT
          b.id,
          b.business_id,
          b.branch_id,
          br.name AS branch_name,
          b.resource_id,
          r.name AS resource_name,
          r.priority AS resource_priority,
          r.is_indoor AS resource_is_indoor,
          b.service_id,
          s.name AS service_name,
          b.customer_id,
          c.name AS customer_name,
          c.phone AS customer_phone,
          b.start_at,
          b.end_at,
          b.status,
          b.confirmation_status,
          b.reconfirmed_at,
          b.cancelled_at,
          b.source,
          b.total_price,
          b.reservation_name,
          b.notes,
          b.recurring_booking_id
        FROM booking b
        INNER JOIN branch br
          ON br.id = b.branch_id
          AND br.business_id = b.business_id
        INNER JOIN resource r
          ON r.id = b.resource_id
          AND r.branch_id = br.id
        INNER JOIN service s
          ON s.id = b.service_id
          AND s.branch_id = br.id
        LEFT JOIN customer c ON c.id = b.customer_id
        WHERE ${conditions.join('\n          AND ')}
      `, values);
        return result.rows[0] ?? null;
    }
    async cancelForBusinessAndCustomer(id, businessId, customerId) {
        const result = await this.databaseService.query(`
        UPDATE ${TABLE_NAME}
        SET
          status = 'CANCELLED',
          cancelled_at = NOW(),
          updated_at = NOW()
        WHERE id = $1
          AND business_id = $2
          AND customer_id = $3
          AND status = ANY($4::varchar[])
        RETURNING *
      `, [id, businessId, customerId, booking_constants_1.ACTIVE_BOOKING_STATUSES]);
        return result.rows[0] ?? null;
    }
    async findByIdForBusiness(id, businessId, allowedBranchIds, allowedResourceIds) {
        const values = [id, businessId];
        const conditions = ['id = $1', 'business_id = $2'];
        this.addAllowedBranchCondition(conditions, values, 'branch_id', allowedBranchIds);
        this.addAllowedResourceCondition(conditions, values, 'resource_id', allowedResourceIds);
        const result = await this.databaseService.query(`
        SELECT *
        FROM ${TABLE_NAME}
        WHERE ${conditions.join('\n          AND ')}
      `, values);
        return result.rows[0] ?? null;
    }
    async customerBelongsToBusiness(customerId, businessId) {
        const result = await this.databaseService.query(`
        SELECT 1
        FROM customer_business
        WHERE customer_id = $1
          AND business_id = $2
        LIMIT 1
      `, [customerId, businessId]);
        return result.rowCount === 1;
    }
    async bookingContextBelongsToBusiness(input) {
        const result = await this.databaseService.query(`
        SELECT 1
        FROM branch br
        INNER JOIN resource r
          ON r.id = $3
          AND r.branch_id = br.id
        INNER JOIN service s
          ON s.id = $4
          AND s.branch_id = br.id
        WHERE br.id = $2
          AND br.business_id = $1
          AND (
            $5::bigint IS NULL
            OR EXISTS (
              SELECT 1
              FROM customer_business cb
              WHERE cb.customer_id = $5
                AND cb.business_id = $1
            )
          )
        LIMIT 1
      `, [
            input.businessId,
            input.branchId,
            input.resourceId,
            input.serviceId,
            input.customerId,
        ]);
        return result.rowCount === 1;
    }
    async update(id, businessId, updateBookingDto, allowedBranchIds, allowedResourceIds) {
        const entries = UPDATE_COLUMNS.filter((column) => Object.prototype.hasOwnProperty.call(updateBookingDto, column))
            .map((column) => [column, updateBookingDto[column]])
            .filter(([, value]) => value !== undefined);
        if (entries.length === 0) {
            return this.findByIdForBusiness(id, businessId, allowedBranchIds, allowedResourceIds);
        }
        const assignments = entries.map(([column], index) => `${column} = $${index + 1}`);
        const values = entries.map(([, value]) => value);
        values.push(id, businessId);
        const conditions = [
            `id = $${values.length - 1}`,
            `business_id = $${values.length}`,
        ];
        this.addAllowedBranchCondition(conditions, values, 'branch_id', allowedBranchIds);
        this.addAllowedResourceCondition(conditions, values, 'resource_id', allowedResourceIds);
        const result = await this.databaseService.query(`
        UPDATE ${TABLE_NAME}
        SET
          ${assignments.join(', ')}
        WHERE ${conditions.join('\n          AND ')}
        RETURNING *
      `, values);
        return result.rows[0] ?? null;
    }
    async markReconfirmed(id, businessId, allowedBranchIds, allowedResourceIds) {
        const values = [id, businessId];
        const conditions = [
            'id = $1',
            'business_id = $2',
            "status = 'CONFIRMED'",
            "confirmation_status = 'pending'",
        ];
        this.addAllowedBranchCondition(conditions, values, 'branch_id', allowedBranchIds);
        this.addAllowedResourceCondition(conditions, values, 'resource_id', allowedResourceIds);
        const result = await this.databaseService.query(`
        UPDATE ${TABLE_NAME}
        SET
          confirmation_status = 'reconfirmed',
          reconfirmed_at = NOW(),
          updated_at = NOW()
        WHERE ${conditions.join('\n          AND ')}
        RETURNING *
      `, values);
        return result.rows[0] ?? null;
    }
    async cancelForBusiness(id, businessId, allowedBranchIds, allowedResourceIds) {
        const values = [id, businessId];
        const conditions = ['id = $1', 'business_id = $2', "status <> 'CANCELLED'"];
        this.addAllowedBranchCondition(conditions, values, 'branch_id', allowedBranchIds);
        this.addAllowedResourceCondition(conditions, values, 'resource_id', allowedResourceIds);
        const result = await this.databaseService.query(`
        UPDATE ${TABLE_NAME}
        SET
          status = 'CANCELLED',
          cancelled_at = NOW(),
          updated_at = NOW()
        WHERE ${conditions.join('\n          AND ')}
        RETURNING *
      `, values);
        return result.rows[0] ?? null;
    }
    async markConfirmedBookingsCompletedAfter(cutoff) {
        const result = await this.databaseService.query(`
        UPDATE ${TABLE_NAME}
        SET
          status = 'COMPLETED',
          updated_at = NOW()
        WHERE status = 'CONFIRMED'
          AND end_at <= $1
        RETURNING id, business_id
      `, [cutoff]);
        return result.rows;
    }
    async remove(id, businessId, allowedBranchIds, allowedResourceIds) {
        const values = [id, businessId];
        const conditions = ['id = $1', 'business_id = $2'];
        this.addAllowedBranchCondition(conditions, values, 'branch_id', allowedBranchIds);
        this.addAllowedResourceCondition(conditions, values, 'resource_id', allowedResourceIds);
        const result = await this.databaseService.query(`
        DELETE FROM ${TABLE_NAME}
        WHERE ${conditions.join('\n          AND ')}
      `, values);
        return result.rowCount === 1;
    }
    addOptionalCondition(conditions, values, column, value) {
        if (value === undefined) {
            return;
        }
        values.push(value);
        conditions.push(`${column} = $${values.length}`);
    }
    addAllowedBranchCondition(conditions, values, column, allowedBranchIds) {
        if (allowedBranchIds === undefined) {
            return;
        }
        if (allowedBranchIds.length === 0) {
            conditions.push('FALSE');
            return;
        }
        values.push(allowedBranchIds);
        conditions.push(`${column} = ANY($${values.length}::bigint[])`);
    }
    addAllowedResourceCondition(conditions, values, column, allowedResourceIds) {
        if (allowedResourceIds === undefined) {
            return;
        }
        if (allowedResourceIds.length === 0) {
            conditions.push('FALSE');
            return;
        }
        values.push(allowedResourceIds);
        conditions.push(`${column} = ANY($${values.length}::bigint[])`);
    }
};
exports.BookingsRepository = BookingsRepository;
exports.BookingsRepository = BookingsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], BookingsRepository);
//# sourceMappingURL=bookings.repository.js.map