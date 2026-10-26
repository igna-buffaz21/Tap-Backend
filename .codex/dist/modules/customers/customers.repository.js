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
exports.CustomersRepository = void 0;
const common_1 = require("@nestjs/common");
const sql_query_builder_1 = require("../../common/utils/sql-query-builder");
const database_service_1 = require("../../database/database.service");
const booking_constants_1 = require("../bookings/booking.constants");
const TABLE_NAME = 'customer';
const UPDATE_COLUMNS = ['phone', 'email'];
let CustomersRepository = class CustomersRepository {
    databaseService;
    constructor(databaseService) {
        this.databaseService = databaseService;
    }
    async create(createCustomerDto, executor = this.databaseService) {
        const result = await executor.query(`
        INSERT INTO ${TABLE_NAME} (
          name,
          phone,
          email
        )
        VALUES ($1, $2, $3)
        RETURNING *
      `, [
            createCustomerDto.name,
            createCustomerDto.phone,
            createCustomerDto.email,
        ]);
        return result.rows[0];
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
    async findAllForBusiness(businessId) {
        const result = await this.databaseService.query(`
        SELECT c.*
        FROM ${TABLE_NAME} c
        INNER JOIN customer_business cb
          ON cb.customer_id = c.id
        WHERE cb.business_id = $1
        ORDER BY c.name ASC, c.id ASC
      `, [businessId]);
        return result.rows;
    }
    async getStatsForBusiness(businessId, accessFilter) {
        const values = [businessId];
        const accessCondition = this.buildCustomerAccessCondition('cb.customer_id', 'cb.business_id', values, accessFilter);
        const result = await this.databaseService.query(`
        SELECT
          COUNT(*) AS total_customers,
          COUNT(*) FILTER (
            WHERE cb.created_at >= date_trunc('month', NOW())
          ) AS new_customers_this_month
        FROM customer_business cb
        WHERE cb.business_id = $1
          ${accessCondition}
      `, values);
        return result.rows[0];
    }
    async findPageForBusiness(businessId, limit, offset, searchPattern, phoneSearchPatterns, accessFilter) {
        const values = [
            businessId,
            limit,
            offset,
            searchPattern,
            phoneSearchPatterns,
            booking_constants_1.ACTIVE_BOOKING_STATUSES,
            booking_constants_1.FREQUENT_CUSTOMER_WINDOW_DAYS,
            booking_constants_1.FREQUENT_CUSTOMER_MIN_BOOKINGS,
        ];
        const bookingJoinBranchCondition = this.buildBranchAccessCondition('b.branch_id', values, accessFilter?.allowedBranchIds);
        const accessCondition = this.buildCustomerAccessCondition('c.id', 'cb.business_id', values, accessFilter);
        const result = await this.databaseService.query(`
        SELECT
          c.*,
          cb.created_at AS customer_since,
          COUNT(b.id) AS bookings_count,
          COUNT(b.id) FILTER (WHERE b.status = 'NO_SHOW') AS no_show_count,
          COUNT(b.id) FILTER (
            WHERE b.status = 'CANCELLED'
          ) AS cancellations_count,
          COUNT(b.id) FILTER (WHERE b.status = 'COMPLETED') AS completed_count,
          COUNT(b.id) FILTER (
            WHERE b.status = 'COMPLETED'
              AND b.start_at >= NOW() - ($7::integer * INTERVAL '1 day')
          ) AS completed_last_window_count,
          MAX(b.start_at) FILTER (WHERE b.start_at < NOW()) AS last_booking_at,
          MIN(b.start_at) FILTER (
            WHERE b.start_at >= NOW()
              AND b.status = ANY($6::varchar[])
          ) AS next_booking_at,
          COUNT(*) OVER() AS total_count
        FROM customer c
        INNER JOIN customer_business cb
          ON cb.customer_id = c.id
        LEFT JOIN booking b
          ON b.customer_id = c.id
          AND b.business_id = cb.business_id
          ${bookingJoinBranchCondition}
        WHERE cb.business_id = $1
          AND (
            $4::text IS NULL
            OR c.name ILIKE $4
            OR c.email ILIKE $4
            OR c.phone ILIKE ANY($5::text[])
          )
          ${accessCondition}
        GROUP BY c.id, cb.created_at
        ORDER BY
          CASE
            WHEN COUNT(b.id) FILTER (WHERE b.status = 'COMPLETED') <= 1 THEN 3
            WHEN COUNT(b.id) FILTER (
              WHERE b.status = 'COMPLETED'
                AND b.start_at >= NOW() - ($7::integer * INTERVAL '1 day')
            ) >= $8::integer THEN 1
            ELSE 2
          END ASC,
          c.name ASC,
          c.id ASC
        LIMIT $2
        OFFSET $3
      `, values);
        return result.rows;
    }
    async findByIdForBusiness(id, businessId) {
        const result = await this.databaseService.query(`
        SELECT c.*
        FROM ${TABLE_NAME} c
        INNER JOIN customer_business cb
          ON cb.customer_id = c.id
        WHERE c.id = $1
          AND cb.business_id = $2
      `, [id, businessId]);
        return result.rows[0] ?? null;
    }
    async findDetailForBusiness(id, businessId, accessFilter) {
        const values = [
            id,
            businessId,
            booking_constants_1.FREQUENT_CUSTOMER_WINDOW_DAYS,
        ];
        const bookingJoinBranchCondition = this.buildBranchAccessCondition('bk.branch_id', values, accessFilter?.allowedBranchIds);
        const accessCondition = this.buildCustomerAccessCondition('c.id', 'cb.business_id', values, accessFilter);
        const result = await this.databaseService.query(`
        SELECT
          c.*,
          cb.created_at AS customer_since,
          COUNT(bk.id) AS bookings_count,
          COUNT(bk.id) FILTER (WHERE bk.status = 'NO_SHOW') AS no_show_count,
          COUNT(bk.id) FILTER (
            WHERE bk.status = 'CANCELLED'
          ) AS cancellations_count,
          COUNT(bk.id) FILTER (
            WHERE bk.status = 'COMPLETED'
          ) AS completed_count,
          COUNT(bk.id) FILTER (
            WHERE bk.status = 'COMPLETED'
              AND bk.start_at >= NOW() - ($3::integer * INTERVAL '1 day')
          ) AS completed_last_window_count,
          MAX(bk.start_at) FILTER (
            WHERE bk.start_at < NOW()
          ) AS last_booking_at,
          b.timezone AS business_timezone
        FROM customer c
        INNER JOIN customer_business cb
          ON cb.customer_id = c.id
        INNER JOIN business b
          ON b.id = cb.business_id
        LEFT JOIN booking bk
          ON bk.customer_id = c.id
          AND bk.business_id = cb.business_id
          ${bookingJoinBranchCondition}
        WHERE c.id = $1
          AND cb.business_id = $2
          ${accessCondition}
        GROUP BY c.id, cb.created_at, b.timezone
      `, values);
        return result.rows[0] ?? null;
    }
    async findBookingHistoryForBusiness(customerId, businessId, limit, offset, allowedBranchIds) {
        const values = [customerId, businessId, limit, offset];
        const branchCondition = this.buildBranchAccessCondition('bk.branch_id', values, allowedBranchIds);
        const result = await this.databaseService.query(`
        SELECT
          bk.id,
          bk.branch_id,
          br.name AS branch_name,
          bk.resource_id,
          r.name AS resource_name,
          bk.service_id,
          s.name AS service_name,
          bk.start_at,
          bk.end_at,
          bk.status,
          bk.confirmation_status,
          bk.cancelled_at,
          bk.source,
          bk.total_price,
          bk.reservation_name,
          bk.notes,
          COUNT(*) OVER() AS total_count
        FROM booking bk
        INNER JOIN branch br
          ON br.id = bk.branch_id
          AND br.business_id = bk.business_id
        INNER JOIN resource r
          ON r.id = bk.resource_id
          AND r.branch_id = br.id
        INNER JOIN service s
          ON s.id = bk.service_id
          AND s.branch_id = br.id
        WHERE bk.customer_id = $1
          AND bk.business_id = $2
          ${branchCondition}
        ORDER BY bk.start_at DESC, bk.id DESC
        LIMIT $3
        OFFSET $4
      `, values);
        return result.rows;
    }
    async findByPhone(phone) {
        const result = await this.databaseService.query(`
        SELECT *
        FROM ${TABLE_NAME}
        WHERE phone = $1
        LIMIT 1
      `, [phone]);
        return result.rows[0] ?? null;
    }
    async findByPhones(phones) {
        if (phones.length === 0) {
            return null;
        }
        const result = await this.databaseService.query(`
        SELECT *
        FROM ${TABLE_NAME}
        WHERE phone = ANY($1::text[])
        ORDER BY array_position($1::text[], phone)
        LIMIT 1
      `, [phones]);
        return result.rows[0] ?? null;
    }
    async findByPhonesForBusiness(phones, businessId, accessFilter) {
        if (phones.length === 0) {
            return null;
        }
        const values = [phones, businessId];
        const accessCondition = this.buildCustomerAccessCondition('c.id', 'cb.business_id', values, accessFilter);
        const result = await this.databaseService.query(`
        SELECT c.*
        FROM ${TABLE_NAME} c
        INNER JOIN customer_business cb
          ON cb.customer_id = c.id
        WHERE cb.business_id = $2
          AND c.phone = ANY($1::text[])
          ${accessCondition}
        ORDER BY array_position($1::text[], c.phone)
        LIMIT 1
      `, values);
        return result.rows[0] ?? null;
    }
    async addToBusiness(customerId, businessId, executor = this.databaseService) {
        await executor.query(`
        INSERT INTO customer_business (
          customer_id,
          business_id
        )
        VALUES ($1, $2)
        ON CONFLICT (customer_id, business_id) DO NOTHING
      `, [customerId, businessId]);
    }
    async update(id, updateCustomerDto) {
        const builtQuery = (0, sql_query_builder_1.buildUpdateQuery)(TABLE_NAME, updateCustomerDto, UPDATE_COLUMNS, id);
        if (!builtQuery) {
            return this.findById(id);
        }
        const result = await this.databaseService.query(builtQuery.query, builtQuery.values);
        return result.rows[0] ?? null;
    }
    async updateForBusiness(id, businessId, updateCustomerDto, accessFilter) {
        const builtQuery = (0, sql_query_builder_1.buildUpdateQuery)(TABLE_NAME, updateCustomerDto, UPDATE_COLUMNS, id);
        if (!builtQuery) {
            const customer = await this.findDetailForBusiness(id, businessId, accessFilter);
            return customer;
        }
        const idParamIndex = builtQuery.values.length;
        builtQuery.values.push(businessId);
        const businessIdParamIndex = builtQuery.values.length;
        const accessCondition = this.buildCustomerAccessCondition('customer.id', 'cb.business_id', builtQuery.values, accessFilter);
        builtQuery.query = builtQuery.query.replace('WHERE id = $' + idParamIndex, 'WHERE id = $' +
            idParamIndex +
            ' AND EXISTS (' +
            'SELECT 1 FROM customer_business cb ' +
            'WHERE cb.customer_id = customer.id ' +
            'AND cb.business_id = $' +
            businessIdParamIndex +
            ' ' +
            accessCondition +
            ')');
        const result = await this.databaseService.query(builtQuery.query, builtQuery.values);
        return result.rows[0] ?? null;
    }
    async removeFromBusiness(customerId, businessId, accessFilter) {
        const values = [customerId, businessId];
        const accessCondition = this.buildCustomerAccessCondition('customer_business.customer_id', 'customer_business.business_id', values, accessFilter);
        const result = await this.databaseService.query(`
        DELETE FROM customer_business
        WHERE customer_id = $1
          AND business_id = $2
          ${accessCondition}
      `, values);
        return result.rowCount === 1;
    }
    async remove(id) {
        const result = await this.databaseService.query(`
        DELETE FROM ${TABLE_NAME}
        WHERE id = $1
      `, [id]);
        return result.rowCount === 1;
    }
    buildCustomerAccessCondition(customerIdExpression, businessIdExpression, values, accessFilter) {
        if (!accessFilter) {
            return '';
        }
        const predicates = [];
        if (accessFilter.allowedBranchIds !== undefined) {
            predicates.push(this.buildCustomerBranchPredicate(customerIdExpression, businessIdExpression, values, accessFilter.allowedBranchIds));
        }
        if (accessFilter.ownOnly &&
            accessFilter.assignedUserId !== undefined &&
            accessFilter.assignedUserId !== null) {
            values.push(accessFilter.assignedUserId);
            const assignedUserParam = `$${values.length}`;
            predicates.push(`
        EXISTS (
          SELECT 1
          FROM whatsapp_conversation wc_own
          WHERE wc_own.customer_id = ${customerIdExpression}
            AND wc_own.business_id = ${businessIdExpression}
            AND wc_own.assigned_user_id = ${assignedUserParam}
        )
      `);
        }
        if (predicates.length === 0) {
            return 'AND FALSE';
        }
        return `AND (${predicates.join(' OR ')})`;
    }
    buildCustomerBranchPredicate(customerIdExpression, businessIdExpression, values, allowedBranchIds) {
        if (allowedBranchIds.length === 0) {
            return 'FALSE';
        }
        values.push(allowedBranchIds);
        const branchIdsParam = `$${values.length}`;
        return `
      (
        EXISTS (
          SELECT 1
          FROM booking bk_access
          WHERE bk_access.customer_id = ${customerIdExpression}
            AND bk_access.business_id = ${businessIdExpression}
            AND bk_access.branch_id = ANY(${branchIdsParam}::bigint[])
        )
        OR EXISTS (
          SELECT 1
          FROM whatsapp_conversation wc_access
          WHERE wc_access.customer_id = ${customerIdExpression}
            AND wc_access.business_id = ${businessIdExpression}
            AND wc_access.branch_id = ANY(${branchIdsParam}::bigint[])
        )
      )
    `;
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
exports.CustomersRepository = CustomersRepository;
exports.CustomersRepository = CustomersRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], CustomersRepository);
//# sourceMappingURL=customers.repository.js.map