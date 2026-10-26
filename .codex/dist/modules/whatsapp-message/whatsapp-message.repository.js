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
exports.WhatsappMessageRepository = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../database/database.service");
const whatsapp_message_entity_1 = require("./entities/whatsapp-message.entity");
const TABLE_NAME = 'whatsapp_message';
let WhatsappMessageRepository = class WhatsappMessageRepository {
    databaseService;
    constructor(databaseService) {
        this.databaseService = databaseService;
    }
    async createInboundMessage(record) {
        const result = await this.databaseService.query(`
        INSERT INTO ${TABLE_NAME} (
          conversation_id,
          whatsapp_account_id,
          customer_id,
          direction,
          message_type,
          provider_message_id,
          content,
          status,
          sent_at,
          received_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7::jsonb, $8, NULL, COALESCE($9, NOW())
        )
        RETURNING *
      `, [
            record.conversationId,
            record.whatsappAccountId,
            record.customerId,
            whatsapp_message_entity_1.WhatsappMessageDirection.INBOUND,
            record.messageType,
            record.providerMessageId,
            JSON.stringify(record.content),
            whatsapp_message_entity_1.WhatsappMessageStatus.RECEIVED,
            record.receivedAt,
        ]);
        return result.rows[0];
    }
    async createInboundMessageIfNotExists(record) {
        if (!record.providerMessageId) {
            return this.createInboundMessage(record);
        }
        const result = await this.databaseService.query(`
        INSERT INTO ${TABLE_NAME} (
          conversation_id,
          whatsapp_account_id,
          customer_id,
          direction,
          message_type,
          provider_message_id,
          content,
          status,
          sent_at,
          received_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7::jsonb, $8, NULL, COALESCE($9, NOW())
        )
        ON CONFLICT (provider_message_id)
          WHERE provider_message_id IS NOT NULL
          DO NOTHING
        RETURNING *
      `, [
            record.conversationId,
            record.whatsappAccountId,
            record.customerId,
            whatsapp_message_entity_1.WhatsappMessageDirection.INBOUND,
            record.messageType,
            record.providerMessageId,
            JSON.stringify(record.content),
            whatsapp_message_entity_1.WhatsappMessageStatus.RECEIVED,
            record.receivedAt,
        ]);
        return result.rows[0] ?? null;
    }
    async createOutboundMessage(record) {
        const result = await this.databaseService.query(`
        INSERT INTO ${TABLE_NAME} (
          conversation_id,
          whatsapp_account_id,
          customer_id,
          direction,
          message_type,
          provider_message_id,
          content,
          status,
          sent_at,
          received_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7::jsonb, $8, NULL, NULL
        )
        RETURNING *
      `, [
            record.conversationId,
            record.whatsappAccountId,
            record.customerId,
            whatsapp_message_entity_1.WhatsappMessageDirection.OUTBOUND,
            record.messageType,
            record.providerMessageId,
            JSON.stringify(record.content),
            whatsapp_message_entity_1.WhatsappMessageStatus.PENDING,
        ]);
        return result.rows[0];
    }
    async updateProviderMessageId(id, businessId, providerMessageId) {
        const result = await this.databaseService.query(`
        UPDATE ${TABLE_NAME} wm
        SET
          provider_message_id = $3,
          updated_at = NOW()
        FROM whatsapp_conversation wc
        WHERE wm.id = $1
          AND wc.id = wm.conversation_id
          AND wc.business_id = $2
        RETURNING wm.*
      `, [id, businessId, providerMessageId]);
        return result.rows[0] ?? null;
    }
    async updateMessageStatus(providerMessageId, businessId, status) {
        const result = await this.databaseService.query(`
        UPDATE ${TABLE_NAME} wm
        SET
          status = $3,
          sent_at = CASE
            WHEN $4 = TRUE AND wm.sent_at IS NULL THEN NOW()
            ELSE wm.sent_at
          END,
          updated_at = NOW()
        FROM whatsapp_conversation wc
        WHERE wm.provider_message_id = $1
          AND wm.direction = $5
          AND wc.id = wm.conversation_id
          AND wc.business_id = $2
        RETURNING wm.*
      `, [
            providerMessageId,
            businessId,
            status,
            status === whatsapp_message_entity_1.WhatsappMessageStatus.SENT,
            whatsapp_message_entity_1.WhatsappMessageDirection.OUTBOUND,
        ]);
        return result.rows[0] ?? null;
    }
    async updateMessageStatusById(id, businessId, status) {
        const result = await this.databaseService.query(`
        UPDATE ${TABLE_NAME} wm
        SET
          status = $3,
          sent_at = CASE
            WHEN $4 = TRUE AND wm.sent_at IS NULL THEN NOW()
            ELSE wm.sent_at
          END,
          updated_at = NOW()
        FROM whatsapp_conversation wc
        WHERE wm.id = $1
          AND wm.direction = $5
          AND wc.id = wm.conversation_id
          AND wc.business_id = $2
        RETURNING wm.*
      `, [
            id,
            businessId,
            status,
            status === whatsapp_message_entity_1.WhatsappMessageStatus.SENT,
            whatsapp_message_entity_1.WhatsappMessageDirection.OUTBOUND,
        ]);
        return result.rows[0] ?? null;
    }
    async findByProviderMessageId(providerMessageId, businessId) {
        const result = await this.databaseService.query(`
        SELECT wm.*
        FROM ${TABLE_NAME} wm
        INNER JOIN whatsapp_conversation wc
          ON wc.id = wm.conversation_id
        WHERE wm.provider_message_id = $1
          AND wc.business_id = $2
      `, [providerMessageId, businessId]);
        return result.rows[0] ?? null;
    }
    async findByConversationId(conversationId, businessId, limit, offset) {
        const result = await this.databaseService.query(`
        SELECT wm.*
        FROM ${TABLE_NAME} wm
        INNER JOIN whatsapp_conversation wc
          ON wc.id = wm.conversation_id
        WHERE wm.conversation_id = $1
          AND wc.business_id = $2
        ORDER BY wm.created_at ASC, wm.id ASC
        LIMIT $3
        OFFSET $4
      `, [conversationId, businessId, limit, offset]);
        return result.rows;
    }
    async findRecentByConversationId(conversationId, businessId, limit) {
        const result = await this.databaseService.query(`
        SELECT recent.*
        FROM (
          SELECT wm.*
          FROM ${TABLE_NAME} wm
          INNER JOIN whatsapp_conversation wc
            ON wc.id = wm.conversation_id
          WHERE wm.conversation_id = $1
            AND wc.business_id = $2
          ORDER BY wm.created_at DESC, wm.id DESC
          LIMIT $3
        ) recent
        ORDER BY recent.created_at ASC, recent.id ASC
      `, [conversationId, businessId, limit]);
        return result.rows;
    }
    async findById(id, businessId) {
        const result = await this.databaseService.query(`
        SELECT wm.*
        FROM ${TABLE_NAME} wm
        INNER JOIN whatsapp_conversation wc
          ON wc.id = wm.conversation_id
        WHERE wm.id = $1
          AND wc.business_id = $2
      `, [id, businessId]);
        return result.rows[0] ?? null;
    }
    async getConversationMessageScope(conversationId, businessId) {
        const result = await this.databaseService.query(`
          SELECT
            wc.whatsapp_account_id,
            wc.customer_id
          FROM whatsapp_conversation wc
          INNER JOIN whatsapp_account wa
            ON wa.id = wc.whatsapp_account_id
            AND wa.business_id = wc.business_id
          WHERE wc.id = $1
            AND wc.business_id = $2
        `, [conversationId, businessId]);
        return result.rows[0] ?? null;
    }
};
exports.WhatsappMessageRepository = WhatsappMessageRepository;
exports.WhatsappMessageRepository = WhatsappMessageRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], WhatsappMessageRepository);
//# sourceMappingURL=whatsapp-message.repository.js.map