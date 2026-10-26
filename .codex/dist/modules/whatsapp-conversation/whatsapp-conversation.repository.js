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
exports.WhatsappConversationRepository = exports.ACTIVE_WHATSAPP_CONVERSATION_STATUSES = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../database/database.service");
const whatsapp_conversation_entity_1 = require("./entities/whatsapp-conversation.entity");
const TABLE_NAME = 'whatsapp_conversation';
exports.ACTIVE_WHATSAPP_CONVERSATION_STATUSES = [
    whatsapp_conversation_entity_1.WhatsappConversationStatus.ACTIVE,
    whatsapp_conversation_entity_1.WhatsappConversationStatus.HUMAN_REQUIRED,
    whatsapp_conversation_entity_1.WhatsappConversationStatus.HUMAN_ACTIVE,
];
let WhatsappConversationRepository = class WhatsappConversationRepository {
    databaseService;
    constructor(databaseService) {
        this.databaseService = databaseService;
    }
    async findActiveConversation(whatsappAccountId, customerId) {
        const result = await this.databaseService.query(`
        SELECT *
        FROM ${TABLE_NAME}
        WHERE whatsapp_account_id = $1
          AND customer_id = $2
          AND status::text = ANY($3)
        ORDER BY last_message_at DESC
        LIMIT 1
      `, [
            whatsappAccountId,
            customerId,
            [...exports.ACTIVE_WHATSAPP_CONVERSATION_STATUSES],
        ]);
        return result.rows[0] ?? null;
    }
    async create(record) {
        const result = await this.databaseService.query(`
        INSERT INTO ${TABLE_NAME} (
          whatsapp_account_id,
          business_id,
          branch_id,
          customer_id,
          intent,
          status,
          context,
          assigned_user_id,
          last_message_at,
          expires_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, '{}'::jsonb, NULL, $7, $8)
        RETURNING *
      `, [
            record.whatsappAccountId,
            record.businessId,
            record.branchId,
            record.customerId,
            whatsapp_conversation_entity_1.WhatsappConversationIntent.UNKNOWN,
            whatsapp_conversation_entity_1.WhatsappConversationStatus.ACTIVE,
            record.lastMessageAt,
            record.expiresAt,
        ]);
        return result.rows[0];
    }
    async findById(id, businessId) {
        const values = [id];
        const conditions = ['id = $1'];
        if (businessId !== undefined) {
            values.push(businessId);
            conditions.push(`business_id = $${values.length}`);
        }
        const result = await this.databaseService.query(`
        SELECT *
        FROM ${TABLE_NAME}
        WHERE ${conditions.join('\n          AND ')}
      `, values);
        return result.rows[0] ?? null;
    }
    async updateState(id, businessId, updates) {
        const values = [id, businessId];
        const assignments = [];
        if (updates.intent !== undefined) {
            values.push(updates.intent);
            assignments.push(`intent = $${values.length}`);
        }
        if (updates.status !== undefined) {
            values.push(updates.status);
            assignments.push(`status = $${values.length}`);
        }
        if (updates.context !== undefined) {
            values.push(JSON.stringify(updates.context));
            assignments.push(`context = COALESCE(context, '{}'::jsonb) || $${values.length}::jsonb`);
        }
        if (updates.branchId !== undefined) {
            values.push(updates.branchId);
            assignments.push(`branch_id = $${values.length}`);
        }
        if (updates.assignedUserId !== undefined) {
            values.push(updates.assignedUserId);
            assignments.push(`assigned_user_id = $${values.length}`);
        }
        if (updates.lastMessageAt !== undefined) {
            values.push(updates.lastMessageAt);
            assignments.push(`last_message_at = $${values.length}`);
        }
        if (updates.expiresAt !== undefined) {
            values.push(updates.expiresAt);
            assignments.push(`expires_at = $${values.length}`);
        }
        if (assignments.length === 0) {
            return this.findById(id, businessId);
        }
        const result = await this.databaseService.query(`
        UPDATE ${TABLE_NAME}
        SET
          ${assignments.join(',\n          ')},
          updated_at = NOW()
        WHERE id = $1
          AND business_id = $2
        RETURNING *
      `, values);
        return result.rows[0] ?? null;
    }
    async whatsappAccountBelongsToBusiness(whatsappAccountId, businessId) {
        const result = await this.databaseService.query(`
        SELECT EXISTS (
          SELECT 1
          FROM whatsapp_account
          WHERE id = $1
            AND business_id = $2
        )
      `, [whatsappAccountId, businessId]);
        return result.rows[0]?.exists ?? false;
    }
    async branchBelongsToBusiness(branchId, businessId) {
        const result = await this.databaseService.query(`
        SELECT EXISTS (
          SELECT 1
          FROM branch
          WHERE id = $1
            AND business_id = $2
        )
      `, [branchId, businessId]);
        return result.rows[0]?.exists ?? false;
    }
    async userBelongsToBusiness(userId, businessId) {
        const result = await this.databaseService.query(`
        SELECT EXISTS (
          SELECT 1
          FROM "user"
          WHERE id = $1
            AND business_id = $2
        )
      `, [userId, businessId]);
        return result.rows[0]?.exists ?? false;
    }
};
exports.WhatsappConversationRepository = WhatsappConversationRepository;
exports.WhatsappConversationRepository = WhatsappConversationRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], WhatsappConversationRepository);
//# sourceMappingURL=whatsapp-conversation.repository.js.map