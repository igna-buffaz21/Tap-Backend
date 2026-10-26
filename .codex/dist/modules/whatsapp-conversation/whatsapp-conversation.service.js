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
exports.WhatsappConversationService = void 0;
const common_1 = require("@nestjs/common");
const whatsapp_conversation_entity_1 = require("./entities/whatsapp-conversation.entity");
const whatsapp_conversation_repository_1 = require("./whatsapp-conversation.repository");
let WhatsappConversationService = class WhatsappConversationService {
    whatsappConversationRepository;
    constructor(whatsappConversationRepository) {
        this.whatsappConversationRepository = whatsappConversationRepository;
    }
    async findActiveConversation(whatsappAccountId, customerId) {
        return this.whatsappConversationRepository.findActiveConversation(this.parsePositiveInteger(whatsappAccountId, 'whatsappAccountId'), this.parsePositiveInteger(customerId, 'customerId'));
    }
    async createConversation(input) {
        const record = await this.normalizeCreateInput(input);
        return this.whatsappConversationRepository.create(record);
    }
    async getOrCreateActiveConversation(input) {
        const record = await this.normalizeCreateInput(input);
        const active = await this.whatsappConversationRepository.findActiveConversation(record.whatsappAccountId, record.customerId);
        if (active) {
            return active;
        }
        try {
            return await this.whatsappConversationRepository.create(record);
        }
        catch (error) {
            if (!this.isUniqueViolation(error)) {
                throw error;
            }
            const concurrentActive = await this.whatsappConversationRepository.findActiveConversation(record.whatsappAccountId, record.customerId);
            if (!concurrentActive) {
                throw error;
            }
            return concurrentActive;
        }
    }
    async updateIntent(id, businessId, intent) {
        return this.updateConversationState(id, businessId, {
            intent: this.validateIntent(intent),
        });
    }
    async updateContext(id, businessId, context) {
        this.assertJsonObject(context, 'context');
        return this.updateConversationState(id, businessId, { context });
    }
    async updateConversationState(id, businessId, updates) {
        const conversationId = this.parsePositiveInteger(id, 'id');
        const scopedBusinessId = this.parsePositiveInteger(businessId, 'businessId');
        const normalizedUpdates = await this.normalizeStateUpdates(scopedBusinessId, updates);
        const updated = await this.whatsappConversationRepository.updateState(conversationId, scopedBusinessId, normalizedUpdates);
        if (!updated) {
            throw new common_1.NotFoundException('Whatsapp conversation not found');
        }
        return updated;
    }
    async touchConversation(id, businessId, lastMessageAt = new Date()) {
        return this.updateConversationState(id, businessId, {
            lastMessageAt,
        });
    }
    async completeConversation(id, businessId) {
        return this.updateConversationState(id, businessId, {
            status: whatsapp_conversation_entity_1.WhatsappConversationStatus.COMPLETED,
        });
    }
    async expireConversation(id, businessId) {
        return this.updateConversationState(id, businessId, {
            status: whatsapp_conversation_entity_1.WhatsappConversationStatus.EXPIRED,
        });
    }
    async requireHuman(id, businessId) {
        return this.updateConversationState(id, businessId, {
            status: whatsapp_conversation_entity_1.WhatsappConversationStatus.HUMAN_REQUIRED,
        });
    }
    async assignHuman(id, businessId, assignedUserId) {
        return this.updateConversationState(id, businessId, {
            assignedUserId,
            status: whatsapp_conversation_entity_1.WhatsappConversationStatus.HUMAN_ACTIVE,
        });
    }
    async returnToBot(id, businessId) {
        return this.updateConversationState(id, businessId, {
            assignedUserId: null,
            status: whatsapp_conversation_entity_1.WhatsappConversationStatus.ACTIVE,
        });
    }
    async findById(id, businessId) {
        return this.whatsappConversationRepository.findById(this.parsePositiveInteger(id, 'id'), businessId === undefined
            ? undefined
            : this.parsePositiveInteger(businessId, 'businessId'));
    }
    async normalizeCreateInput(input) {
        const whatsappAccountId = this.parsePositiveInteger(input.whatsappAccountId, 'whatsappAccountId');
        const businessId = this.parsePositiveInteger(input.businessId, 'businessId');
        const branchId = this.parseOptionalPositiveInteger(input.branchId, 'branchId');
        const customerId = this.parsePositiveInteger(input.customerId, 'customerId');
        await this.assertWhatsappAccountBelongsToBusiness(whatsappAccountId, businessId);
        await this.assertOptionalBranchBelongsToBusiness(branchId, businessId);
        return {
            whatsappAccountId,
            businessId,
            branchId,
            customerId,
            lastMessageAt: this.parseOptionalDate(input.lastMessageAt, 'lastMessageAt') ??
                new Date(),
            expiresAt: this.parseNullableDate(input.expiresAt, 'expiresAt'),
        };
    }
    async normalizeStateUpdates(businessId, updates) {
        const normalizedUpdates = {};
        if (updates.intent !== undefined) {
            normalizedUpdates.intent = this.validateIntent(updates.intent);
        }
        if (updates.status !== undefined) {
            normalizedUpdates.status = this.validateStatus(updates.status);
        }
        if (updates.context !== undefined) {
            this.assertJsonObject(updates.context, 'context');
            normalizedUpdates.context = updates.context;
        }
        if (updates.branchId !== undefined) {
            normalizedUpdates.branchId = this.parseOptionalPositiveInteger(updates.branchId, 'branchId');
            await this.assertOptionalBranchBelongsToBusiness(normalizedUpdates.branchId, businessId);
        }
        if (updates.assignedUserId !== undefined) {
            normalizedUpdates.assignedUserId = this.parseOptionalPositiveInteger(updates.assignedUserId, 'assignedUserId');
            if (normalizedUpdates.assignedUserId !== null) {
                await this.assertUserBelongsToBusiness(normalizedUpdates.assignedUserId, businessId);
            }
        }
        if (updates.lastMessageAt !== undefined) {
            normalizedUpdates.lastMessageAt = this.parseRequiredDate(updates.lastMessageAt, 'lastMessageAt');
        }
        if (updates.expiresAt !== undefined) {
            normalizedUpdates.expiresAt = this.parseNullableDate(updates.expiresAt, 'expiresAt');
        }
        return normalizedUpdates;
    }
    async assertWhatsappAccountBelongsToBusiness(whatsappAccountId, businessId) {
        const exists = await this.whatsappConversationRepository.whatsappAccountBelongsToBusiness(whatsappAccountId, businessId);
        if (!exists) {
            throw new common_1.BadRequestException('Whatsapp account does not belong to business');
        }
    }
    async assertOptionalBranchBelongsToBusiness(branchId, businessId) {
        if (branchId === null) {
            return;
        }
        const exists = await this.whatsappConversationRepository.branchBelongsToBusiness(branchId, businessId);
        if (!exists) {
            throw new common_1.BadRequestException('Branch does not belong to business');
        }
    }
    async assertUserBelongsToBusiness(userId, businessId) {
        const exists = await this.whatsappConversationRepository.userBelongsToBusiness(userId, businessId);
        if (!exists) {
            throw new common_1.BadRequestException('User does not belong to business');
        }
    }
    validateIntent(intent) {
        if (!Object.values(whatsapp_conversation_entity_1.WhatsappConversationIntent).includes(intent)) {
            throw new common_1.BadRequestException('Invalid whatsapp conversation intent');
        }
        return intent;
    }
    validateStatus(status) {
        if (!Object.values(whatsapp_conversation_entity_1.WhatsappConversationStatus).includes(status)) {
            throw new common_1.BadRequestException('Invalid whatsapp conversation status');
        }
        return status;
    }
    parsePositiveInteger(value, field) {
        const parsedValue = typeof value === 'string' ? Number(value) : value;
        if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
            throw new common_1.BadRequestException(`${field} must be a positive integer`);
        }
        return parsedValue;
    }
    parseOptionalPositiveInteger(value, field) {
        if (value === undefined || value === null) {
            return null;
        }
        return this.parsePositiveInteger(value, field);
    }
    parseRequiredDate(value, field) {
        const parsedDate = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(parsedDate.getTime())) {
            throw new common_1.BadRequestException(`${field} must be a valid date`);
        }
        return parsedDate;
    }
    parseOptionalDate(value, field) {
        if (value === undefined) {
            return null;
        }
        return this.parseRequiredDate(value, field);
    }
    parseNullableDate(value, field) {
        if (value === undefined || value === null) {
            return null;
        }
        return this.parseRequiredDate(value, field);
    }
    assertJsonObject(value, field) {
        if (!this.isJsonObject(value)) {
            throw new common_1.BadRequestException(`${field} must be a JSON object`);
        }
    }
    isJsonObject(value) {
        return typeof value === 'object' && value !== null && !Array.isArray(value);
    }
    isUniqueViolation(error) {
        if (typeof error !== 'object' || error === null || !('code' in error)) {
            return false;
        }
        return error.code === '23505';
    }
};
exports.WhatsappConversationService = WhatsappConversationService;
exports.WhatsappConversationService = WhatsappConversationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [whatsapp_conversation_repository_1.WhatsappConversationRepository])
], WhatsappConversationService);
//# sourceMappingURL=whatsapp-conversation.service.js.map