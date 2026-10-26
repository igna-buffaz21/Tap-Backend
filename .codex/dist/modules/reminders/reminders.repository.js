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
exports.RemindersRepository = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../database/database.service");
const TABLE_NAME = 'reminder';
const UPDATE_COLUMNS = [
    'channel',
    'scheduled_at',
    'sent_at',
    'status',
    'message_type',
    'provider_message_id',
    'cost_usd',
];
let RemindersRepository = class RemindersRepository {
    databaseService;
    constructor(databaseService) {
        this.databaseService = databaseService;
    }
    async create(record, executor = this.databaseService) {
        const result = await executor.query(`
        INSERT INTO ${TABLE_NAME} (
          booking_id,
          channel,
          message_type,
          scheduled_at,
          status
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
            record.bookingId,
            record.channel,
            record.messageType,
            record.scheduledAt,
            record.status,
        ]);
        return result.rows[0];
    }
    async createReconfirmationIfRequired(record, reconfirmationRequiredAfterMs, executor = this.databaseService) {
        const result = await executor.query(`
        INSERT INTO ${TABLE_NAME} (
          booking_id,
          channel,
          message_type,
          scheduled_at,
          status
        )
        SELECT
          b.id,
          $2::varchar,
          $3::varchar,
          $4::timestamptz,
          $5::varchar
        FROM booking b
        WHERE b.id = $1
          AND b.status = 'CONFIRMED'
          AND b.confirmation_status = 'pending'
          AND b.start_at - NOW() >= ($6::bigint * INTERVAL '1 millisecond')
          AND NOT EXISTS (
            SELECT 1
            FROM ${TABLE_NAME} existing
            WHERE existing.booking_id = b.id
              AND existing.channel = $2::varchar
              AND existing.message_type = $3::varchar
              AND existing.status IN (
                'pending',
                'processing',
                'sent'
              )
          )
        RETURNING *
      `, [
            record.bookingId,
            record.channel,
            record.messageType,
            record.scheduledAt,
            record.status,
            reconfirmationRequiredAfterMs,
        ]);
        return result.rows[0] ?? null;
    }
    async repairMissingWhatsappReconfirmationReminders(reconfirmationRequiredAfterMs, reminderOffsetMs) {
        const result = await this.databaseService.query(`
        WITH eligible AS (
          UPDATE booking b
          SET
            confirmation_status = 'pending',
            updated_at = NOW()
          WHERE b.status = 'CONFIRMED'
            AND b.start_at - NOW() >= ($1::bigint * INTERVAL '1 millisecond')
            AND b.confirmation_status <> 'reconfirmed'
            AND NOT EXISTS (
              SELECT 1
              FROM ${TABLE_NAME} existing
              WHERE existing.booking_id = b.id
                AND existing.channel = 'WHATSAPP'
                AND existing.message_type = 'BOOKING_RECONFIRMATION'
                AND existing.status IN (
                  'pending',
                  'processing',
                  'sent'
                )
            )
          RETURNING b.id, b.start_at
        )
        INSERT INTO ${TABLE_NAME} (
          booking_id,
          channel,
          message_type,
          scheduled_at,
          status
        )
        SELECT
          eligible.id,
          'WHATSAPP',
          'BOOKING_RECONFIRMATION',
          eligible.start_at - ($2::bigint * INTERVAL '1 millisecond'),
          'pending'
        FROM eligible
        RETURNING id
      `, [reconfirmationRequiredAfterMs, reminderOffsetMs]);
        return result.rowCount ?? 0;
    }
    async findAll(businessId, allowedBranchIds, allowedResourceIds) {
        const values = [businessId];
        const conditions = ['b.business_id = $1'];
        this.addAllowedBranchCondition(conditions, values, allowedBranchIds);
        this.addAllowedResourceCondition(conditions, values, allowedResourceIds);
        const result = await this.databaseService.query(`
      SELECT r.*
      FROM ${TABLE_NAME} r
      INNER JOIN booking b ON b.id = r.booking_id
      WHERE ${conditions.join('\n        AND ')}
      ORDER BY r.scheduled_at ASC
    `, values);
        return result.rows;
    }
    async findById(id, businessId, allowedBranchIds, allowedResourceIds) {
        const values = [id, businessId];
        const conditions = ['r.id = $1', 'b.business_id = $2'];
        this.addAllowedBranchCondition(conditions, values, allowedBranchIds);
        this.addAllowedResourceCondition(conditions, values, allowedResourceIds);
        const result = await this.databaseService.query(`
        SELECT r.*
        FROM ${TABLE_NAME} r
        INNER JOIN booking b ON b.id = r.booking_id
        WHERE ${conditions.join('\n          AND ')}
      `, values);
        return result.rows[0] ?? null;
    }
    async update(id, businessId, updateReminderDto, allowedBranchIds, allowedResourceIds) {
        const entries = UPDATE_COLUMNS.filter((column) => Object.prototype.hasOwnProperty.call(updateReminderDto, column))
            .map((column) => [column, updateReminderDto[column]])
            .filter(([, value]) => value !== undefined);
        if (entries.length === 0) {
            return this.findById(id, businessId, allowedBranchIds, allowedResourceIds);
        }
        const assignments = entries.map(([column], index) => `${column} = $${index + 1}`);
        const values = entries.map(([, value]) => value);
        values.push(id, businessId);
        const conditions = [
            `r.id = $${values.length - 1}`,
            'r.booking_id = b.id',
            `b.business_id = $${values.length}`,
        ];
        this.addAllowedBranchCondition(conditions, values, allowedBranchIds);
        this.addAllowedResourceCondition(conditions, values, allowedResourceIds);
        const result = await this.databaseService.query(`
        UPDATE ${TABLE_NAME} r
        SET
          ${assignments.join(', ')}
        FROM booking b
        WHERE ${conditions.join('\n          AND ')}
        RETURNING r.*
      `, values);
        return result.rows[0] ?? null;
    }
    async remove(id, businessId, allowedBranchIds, allowedResourceIds) {
        const values = [id, businessId];
        const conditions = ['r.id = $1', 'r.booking_id = b.id', 'b.business_id = $2'];
        this.addAllowedBranchCondition(conditions, values, allowedBranchIds);
        this.addAllowedResourceCondition(conditions, values, allowedResourceIds);
        const result = await this.databaseService.query(`
        DELETE FROM ${TABLE_NAME} r
        USING booking b
        WHERE ${conditions.join('\n          AND ')}
      `, values);
        return result.rowCount === 1;
    }
    async claimDueWhatsappReconfirmationReminders(limit, now) {
        const result = await this.databaseService.query(`
        WITH due AS (
          SELECT
            r.id AS reminder_id,
            b.id AS booking_id,
            b.business_id,
            bu.name AS business_name,
            COALESCE(
              bu.timezone,
              'America/Argentina/Buenos_Aires'
            ) AS business_timezone,
            b.branch_id,
            br.name AS branch_name,
            b.resource_id,
            res.name AS resource_name,
            b.service_id,
            svc.name AS service_name,
            b.customer_id,
            c.name AS customer_name,
            c.phone AS customer_phone,
            b.start_at AS booking_start_at,
            b.end_at AS booking_end_at,
            b.status AS booking_status,
            b.confirmation_status AS booking_confirmation_status,
            b.source AS booking_source,
            b.reservation_name,
            wa.id AS whatsapp_account_id
          FROM ${TABLE_NAME} r
          INNER JOIN booking b
            ON b.id = r.booking_id
          INNER JOIN business bu
            ON bu.id = b.business_id
          INNER JOIN branch br
            ON br.id = b.branch_id
            AND br.business_id = b.business_id
          INNER JOIN resource res
            ON res.id = b.resource_id
            AND res.branch_id = br.id
          INNER JOIN service svc
            ON svc.id = b.service_id
            AND svc.branch_id = br.id
          INNER JOIN customer c
            ON c.id = b.customer_id
          LEFT JOIN LATERAL (
            SELECT id
            FROM whatsapp_account account
            WHERE account.business_id = b.business_id
              AND UPPER(account.status) = 'ACTIVE'
              AND (
                account.branch_id = b.branch_id
                OR account.branch_id IS NULL
              )
            ORDER BY
              CASE WHEN account.branch_id = b.branch_id THEN 0 ELSE 1 END,
              account.id ASC
            LIMIT 1
          ) wa ON TRUE
          WHERE r.status = 'pending'
            AND r.channel = 'WHATSAPP'
            AND r.message_type = 'BOOKING_RECONFIRMATION'
            AND r.scheduled_at <= $1
          ORDER BY r.scheduled_at ASC
          LIMIT $2
          FOR UPDATE OF r SKIP LOCKED
        )
        UPDATE ${TABLE_NAME} r
        SET
          status = 'processing',
          updated_at = NOW()
        FROM due
        WHERE r.id = due.reminder_id
        RETURNING
          r.id,
          r.booking_id,
          r.channel,
          r.message_type,
          r.scheduled_at,
          r.sent_at,
          r.failed_at,
          r.status,
          r.provider_message_id,
          r.retry_count,
          r.last_error,
          r.cost_usd,
          r.created_at,
          r.updated_at,
          due.business_id,
          due.business_name,
          due.business_timezone,
          due.branch_id,
          due.branch_name,
          due.resource_id,
          due.resource_name,
          due.service_id,
          due.service_name,
          due.customer_id,
          due.customer_name,
          due.customer_phone,
          due.booking_start_at,
          due.booking_end_at,
          due.booking_status,
          due.booking_confirmation_status,
          due.booking_source,
          due.reservation_name,
          due.whatsapp_account_id
      `, [now, limit]);
        return result.rows;
    }
    async markSent(id, providerMessageId) {
        const result = await this.databaseService.query(`
        UPDATE ${TABLE_NAME}
        SET
          status = 'sent',
          sent_at = NOW(),
          provider_message_id = $2,
          last_error = NULL,
          updated_at = NOW()
        WHERE id = $1
          AND status = 'processing'
        RETURNING *
      `, [id, providerMessageId]);
        return result.rows[0] ?? null;
    }
    async markFailedAttempt(id, errorMessage, maxAttempts) {
        const result = await this.databaseService.query(`
        UPDATE ${TABLE_NAME}
        SET
          retry_count = COALESCE(retry_count, 0) + 1,
          status = CASE
            WHEN COALESCE(retry_count, 0) + 1 >= $3 THEN 'failed'
            ELSE 'pending'
          END,
          failed_at = CASE
            WHEN COALESCE(retry_count, 0) + 1 >= $3 THEN NOW()
            ELSE failed_at
          END,
          last_error = $2,
          updated_at = NOW()
        WHERE id = $1
          AND status = 'processing'
        RETURNING *
      `, [id, errorMessage, maxAttempts]);
        return result.rows[0] ?? null;
    }
    async markCancelled(id, reason) {
        const result = await this.databaseService.query(`
        UPDATE ${TABLE_NAME}
        SET
          status = 'cancelled',
          last_error = $2,
          updated_at = NOW()
        WHERE id = $1
          AND status = 'processing'
        RETURNING *
      `, [id, reason]);
        return result.rows[0] ?? null;
    }
    async cancelPendingForBooking(bookingId, businessId, reason) {
        const result = await this.databaseService.query(`
        UPDATE ${TABLE_NAME} r
        SET
          status = 'cancelled',
          last_error = $3,
          updated_at = NOW()
        FROM booking b
        WHERE r.booking_id = b.id
          AND r.booking_id = $1
          AND b.business_id = $2
          AND r.status IN ('pending', 'processing')
        `, [bookingId, businessId, reason]);
        return result.rowCount ?? 0;
    }
    async releaseStuckProcessingReminders(olderThan) {
        const result = await this.databaseService.query(`
        UPDATE ${TABLE_NAME}
        SET
          status = 'pending',
          retry_count = COALESCE(retry_count, 0) + 1,
          last_error = 'Reminder processing lock recovered',
          updated_at = NOW()
        WHERE status = 'processing'
          AND channel = 'WHATSAPP'
          AND message_type = 'BOOKING_RECONFIRMATION'
          AND updated_at < $1
      `, [olderThan]);
        return result.rowCount ?? 0;
    }
    async findAssignedResourceIds(userId, businessId, allowedBranchIds) {
        const values = [userId, businessId];
        const branchCondition = allowedBranchIds === undefined
            ? ''
            : allowedBranchIds.length === 0
                ? 'AND FALSE'
                : `AND r.branch_id = ANY($${values.push(allowedBranchIds)}::bigint[])`;
        const result = await this.databaseService.query(`
        SELECT r.id
        FROM user_resource ur
        INNER JOIN resource r ON r.id = ur.resource_id
        INNER JOIN branch b ON b.id = r.branch_id
        WHERE ur.user_id = $1
          AND b.business_id = $2
          ${branchCondition}
      `, values);
        return result.rows.map((row) => Number(row.id));
    }
    addAllowedBranchCondition(conditions, values, allowedBranchIds) {
        if (allowedBranchIds === undefined) {
            return;
        }
        if (allowedBranchIds.length === 0) {
            conditions.push('FALSE');
            return;
        }
        values.push(allowedBranchIds);
        conditions.push(`b.branch_id = ANY($${values.length}::bigint[])`);
    }
    addAllowedResourceCondition(conditions, values, allowedResourceIds) {
        if (allowedResourceIds === undefined) {
            return;
        }
        if (allowedResourceIds.length === 0) {
            conditions.push('FALSE');
            return;
        }
        values.push(allowedResourceIds);
        conditions.push(`b.resource_id = ANY($${values.length}::bigint[])`);
    }
};
exports.RemindersRepository = RemindersRepository;
exports.RemindersRepository = RemindersRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], RemindersRepository);
//# sourceMappingURL=reminders.repository.js.map