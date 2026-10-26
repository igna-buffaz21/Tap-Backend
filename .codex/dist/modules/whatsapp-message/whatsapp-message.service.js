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
exports.WhatsappMessageService = void 0;
const common_1 = require("@nestjs/common");
const whatsapp_message_entity_1 = require("./entities/whatsapp-message.entity");
const whatsapp_message_repository_1 = require("./whatsapp-message.repository");
const OUTBOUND_STATUS_UPDATES = [
    whatsapp_message_entity_1.WhatsappMessageStatus.SENT,
    whatsapp_message_entity_1.WhatsappMessageStatus.DELIVERED,
    whatsapp_message_entity_1.WhatsappMessageStatus.READ,
    whatsapp_message_entity_1.WhatsappMessageStatus.FAILED,
];
let WhatsappMessageService = class WhatsappMessageService {
    whatsappMessageRepository;
    constructor(whatsappMessageRepository) {
        this.whatsappMessageRepository = whatsappMessageRepository;
    }
    async createInboundMessage(input) {
        const result = await this.createInboundMessageIfNotExists(input);
        return result.message;
    }
    async createInboundMessageIfNotExists(input) {
        const businessId = this.parsePositiveInteger(input.businessId, 'businessId');
        const conversationId = this.parsePositiveInteger(input.conversationId, 'conversationId');
        const scope = await this.getConversationScopeOrFail(conversationId, businessId);
        const providerMessageId = this.normalizeOptionalProviderMessageId(input.providerMessageId);
        const record = {
            conversationId,
            whatsappAccountId: scope.whatsapp_account_id,
            customerId: scope.customer_id,
            messageType: this.validateMessageType(input.messageType),
            providerMessageId,
            content: this.validateContent(input.content),
            receivedAt: this.parseOptionalDate(input.receivedAt, 'receivedAt'),
        };
        const created = await this.whatsappMessageRepository.createInboundMessageIfNotExists(record);
        if (created) {
            return {
                message: created,
                isDuplicate: false,
            };
        }
        if (!providerMessageId) {
            return {
                message: await this.whatsappMessageRepository.createInboundMessage(record),
                isDuplicate: false,
            };
        }
        const existingMessage = await this.whatsappMessageRepository.findByProviderMessageId(providerMessageId, businessId);
        if (!existingMessage) {
            throw new common_1.BadRequestException('Inbound Whatsapp message already exists');
        }
        return {
            message: existingMessage,
            isDuplicate: true,
        };
    }
    async createOutboundMessage(input) {
        const businessId = this.parsePositiveInteger(input.businessId, 'businessId');
        const conversationId = this.parsePositiveInteger(input.conversationId, 'conversationId');
        const scope = await this.getConversationScopeOrFail(conversationId, businessId);
        return this.whatsappMessageRepository.createOutboundMessage({
            conversationId,
            whatsappAccountId: scope.whatsapp_account_id,
            customerId: scope.customer_id,
            messageType: this.validateMessageType(input.messageType),
            providerMessageId: this.normalizeOptionalProviderMessageId(input.providerMessageId),
            content: this.validateContent(input.content),
        });
    }
    async updateProviderMessageId(id, businessId, providerMessageId) {
        const updated = await this.whatsappMessageRepository.updateProviderMessageId(this.parsePositiveInteger(id, 'id'), this.parsePositiveInteger(businessId, 'businessId'), this.validateProviderMessageId(providerMessageId));
        if (!updated) {
            throw new common_1.NotFoundException('Whatsapp message not found');
        }
        return updated;
    }
    async updateMessageStatus(providerMessageId, businessId, status) {
        const updated = await this.whatsappMessageRepository.updateMessageStatus(this.validateProviderMessageId(providerMessageId), this.parsePositiveInteger(businessId, 'businessId'), this.validateOutboundStatusUpdate(status));
        if (!updated) {
            throw new common_1.NotFoundException('Whatsapp message not found');
        }
        return updated;
    }
    async updateMessageStatusById(id, businessId, status) {
        const updated = await this.whatsappMessageRepository.updateMessageStatusById(this.parsePositiveInteger(id, 'id'), this.parsePositiveInteger(businessId, 'businessId'), this.validateOutboundStatusUpdate(status));
        if (!updated) {
            throw new common_1.NotFoundException('Whatsapp message not found');
        }
        return updated;
    }
    async findByProviderMessageId(providerMessageId, businessId) {
        return this.whatsappMessageRepository.findByProviderMessageId(this.validateProviderMessageId(providerMessageId), this.parsePositiveInteger(businessId, 'businessId'));
    }
    async findByConversationId(conversationId, businessId, limitValue = 50, offsetValue = 0) {
        const limit = this.parseOptionalNonNegativeInteger(limitValue, 'limit') ?? 50;
        const offset = this.parseOptionalNonNegativeInteger(offsetValue, 'offset') ?? 0;
        if (limit <= 0) {
            throw new common_1.BadRequestException('limit must be greater than 0');
        }
        if (limit > 100) {
            throw new common_1.BadRequestException('limit must be less than or equal to 100');
        }
        return this.whatsappMessageRepository.findByConversationId(this.parsePositiveInteger(conversationId, 'conversationId'), this.parsePositiveInteger(businessId, 'businessId'), limit, offset);
    }
    async findRecentByConversationId(conversationId, businessId, limitValue = 12) {
        const limit = this.parseOptionalNonNegativeInteger(limitValue, 'limit') ?? 12;
        if (limit <= 0) {
            throw new common_1.BadRequestException('limit must be greater than 0');
        }
        if (limit > 30) {
            throw new common_1.BadRequestException('limit must be less than or equal to 30');
        }
        return this.whatsappMessageRepository.findRecentByConversationId(this.parsePositiveInteger(conversationId, 'conversationId'), this.parsePositiveInteger(businessId, 'businessId'), limit);
    }
    async findById(id, businessId) {
        return this.whatsappMessageRepository.findById(this.parsePositiveInteger(id, 'id'), this.parsePositiveInteger(businessId, 'businessId'));
    }
    async getConversationScopeOrFail(conversationId, businessId) {
        const scope = await this.whatsappMessageRepository.getConversationMessageScope(conversationId, businessId);
        if (!scope) {
            throw new common_1.BadRequestException('Whatsapp conversation does not belong to business');
        }
        return scope;
    }
    validateOutboundStatusUpdate(status) {
        if (!OUTBOUND_STATUS_UPDATES.includes(status)) {
            throw new common_1.BadRequestException('Invalid whatsapp message status update');
        }
        return status;
    }
    validateMessageType(messageType) {
        const trimmedMessageType = messageType.trim();
        if (trimmedMessageType.length === 0) {
            throw new common_1.BadRequestException('messageType is required');
        }
        const normalizedMessageType = trimmedMessageType.toUpperCase();
        if (!Object.values(whatsapp_message_entity_1.WhatsappMessageType).includes(normalizedMessageType)) {
            throw new common_1.BadRequestException('Invalid whatsapp message type');
        }
        return normalizedMessageType;
    }
    validateContent(content) {
        if (typeof content !== 'object' ||
            content === null ||
            Array.isArray(content)) {
            throw new common_1.BadRequestException('content must be a JSON object');
        }
        return content;
    }
    normalizeOptionalProviderMessageId(providerMessageId) {
        if (providerMessageId === undefined || providerMessageId === null) {
            return null;
        }
        return this.validateProviderMessageId(providerMessageId);
    }
    validateProviderMessageId(providerMessageId) {
        const trimmedProviderMessageId = providerMessageId.trim();
        if (trimmedProviderMessageId.length === 0) {
            throw new common_1.BadRequestException('providerMessageId is required');
        }
        return trimmedProviderMessageId;
    }
    parsePositiveInteger(value, field) {
        const parsedValue = typeof value === 'string' ? Number(value) : value;
        if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
            throw new common_1.BadRequestException(`${field} must be a positive integer`);
        }
        return parsedValue;
    }
    parseOptionalNonNegativeInteger(value, field) {
        if (value === undefined) {
            return null;
        }
        const parsedValue = typeof value === 'string' ? Number(value) : value;
        if (!Number.isInteger(parsedValue) || parsedValue < 0) {
            throw new common_1.BadRequestException(`${field} must be a non-negative integer`);
        }
        return parsedValue;
    }
    parseOptionalDate(value, field) {
        if (value === undefined) {
            return null;
        }
        const parsedDate = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(parsedDate.getTime())) {
            throw new common_1.BadRequestException(`${field} must be a valid date`);
        }
        return parsedDate;
    }
    isUniqueViolation(error) {
        if (typeof error !== 'object' || error === null || !('code' in error)) {
            return false;
        }
        return error.code === '23505';
    }
};
exports.WhatsappMessageService = WhatsappMessageService;
exports.WhatsappMessageService = WhatsappMessageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [whatsapp_message_repository_1.WhatsappMessageRepository])
], WhatsappMessageService);
//# sourceMappingURL=whatsapp-message.service.js.map