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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappConversationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const create_whatsapp_conversation_dto_1 = require("./dto/create-whatsapp-conversation.dto");
const get_active_whatsapp_conversation_dto_1 = require("./dto/get-active-whatsapp-conversation.dto");
const update_whatsapp_conversation_dto_1 = require("./dto/update-whatsapp-conversation.dto");
const whatsapp_conversation_service_1 = require("./whatsapp-conversation.service");
let WhatsappConversationController = class WhatsappConversationController {
    whatsappConversationService;
    constructor(whatsappConversationService) {
        this.whatsappConversationService = whatsappConversationService;
    }
    create(createWhatsappConversationDto) {
        return this.whatsappConversationService.createConversation(createWhatsappConversationDto);
    }
    getOrCreateActive(createWhatsappConversationDto) {
        return this.whatsappConversationService.getOrCreateActiveConversation(createWhatsappConversationDto);
    }
    findActive(query) {
        return this.whatsappConversationService.findActiveConversation(Number(query.whatsappAccountId), Number(query.customerId));
    }
    findById(id, businessId) {
        return this.whatsappConversationService.findById(Number(id), businessId === undefined ? undefined : Number(businessId));
    }
    updateIntent(id, updateIntentDto) {
        return this.whatsappConversationService.updateIntent(Number(id), updateIntentDto.businessId, updateIntentDto.intent);
    }
    updateContext(id, updateContextDto) {
        return this.whatsappConversationService.updateContext(Number(id), updateContextDto.businessId, updateContextDto.context);
    }
    updateState(id, updateStateDto) {
        const { businessId, ...updates } = updateStateDto;
        return this.whatsappConversationService.updateConversationState(Number(id), businessId, updates);
    }
    touch(id, touchDto) {
        return this.whatsappConversationService.touchConversation(Number(id), touchDto.businessId, touchDto.lastMessageAt);
    }
    complete(id, scopedDto) {
        return this.whatsappConversationService.completeConversation(Number(id), scopedDto.businessId);
    }
    expire(id, scopedDto) {
        return this.whatsappConversationService.expireConversation(Number(id), scopedDto.businessId);
    }
    requireHuman(id, scopedDto) {
        return this.whatsappConversationService.requireHuman(Number(id), scopedDto.businessId);
    }
    assignHuman(id, assignHumanDto) {
        return this.whatsappConversationService.assignHuman(Number(id), assignHumanDto.businessId, assignHumanDto.assignedUserId);
    }
    returnToBot(id, scopedDto) {
        return this.whatsappConversationService.returnToBot(Number(id), scopedDto.businessId);
    }
};
exports.WhatsappConversationController = WhatsappConversationController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Crear conversacion de WhatsApp' }),
    (0, swagger_1.ApiBody)({ type: create_whatsapp_conversation_dto_1.CreateWhatsappConversationDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_whatsapp_conversation_dto_1.CreateWhatsappConversationDto]),
    __metadata("design:returntype", void 0)
], WhatsappConversationController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('active'),
    (0, swagger_1.ApiOperation)({
        summary: 'Obtener o crear conversacion activa de WhatsApp',
    }),
    (0, swagger_1.ApiBody)({ type: create_whatsapp_conversation_dto_1.CreateWhatsappConversationDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_whatsapp_conversation_dto_1.CreateWhatsappConversationDto]),
    __metadata("design:returntype", void 0)
], WhatsappConversationController.prototype, "getOrCreateActive", null);
__decorate([
    (0, common_1.Get)('active'),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar conversacion activa de WhatsApp' }),
    (0, swagger_1.ApiQuery)({ name: 'whatsappAccountId', example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'customerId', example: 20 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_active_whatsapp_conversation_dto_1.GetActiveWhatsappConversationDto]),
    __metadata("design:returntype", void 0)
], WhatsappConversationController.prototype, "findActive", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar conversacion de WhatsApp por id' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 10 }),
    (0, swagger_1.ApiQuery)({ name: 'businessId', required: false, example: 1 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('businessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], WhatsappConversationController.prototype, "findById", null);
__decorate([
    (0, common_1.Patch)(':id/intent'),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar intent de conversacion' }),
    (0, swagger_1.ApiBody)({ type: update_whatsapp_conversation_dto_1.UpdateWhatsappConversationIntentDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_whatsapp_conversation_dto_1.UpdateWhatsappConversationIntentDto]),
    __metadata("design:returntype", void 0)
], WhatsappConversationController.prototype, "updateIntent", null);
__decorate([
    (0, common_1.Patch)(':id/context'),
    (0, swagger_1.ApiOperation)({ summary: 'Mergear contexto de conversacion' }),
    (0, swagger_1.ApiBody)({ type: update_whatsapp_conversation_dto_1.UpdateWhatsappConversationContextDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_whatsapp_conversation_dto_1.UpdateWhatsappConversationContextDto]),
    __metadata("design:returntype", void 0)
], WhatsappConversationController.prototype, "updateContext", null);
__decorate([
    (0, common_1.Patch)(':id/state'),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar estado conversacional' }),
    (0, swagger_1.ApiBody)({ type: update_whatsapp_conversation_dto_1.UpdateWhatsappConversationStateDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_whatsapp_conversation_dto_1.UpdateWhatsappConversationStateDto]),
    __metadata("design:returntype", void 0)
], WhatsappConversationController.prototype, "updateState", null);
__decorate([
    (0, common_1.Patch)(':id/touch'),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar last_message_at' }),
    (0, swagger_1.ApiBody)({ type: update_whatsapp_conversation_dto_1.TouchWhatsappConversationDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_whatsapp_conversation_dto_1.TouchWhatsappConversationDto]),
    __metadata("design:returntype", void 0)
], WhatsappConversationController.prototype, "touch", null);
__decorate([
    (0, common_1.Patch)(':id/complete'),
    (0, swagger_1.ApiOperation)({ summary: 'Completar conversacion' }),
    (0, swagger_1.ApiBody)({ type: update_whatsapp_conversation_dto_1.BusinessScopedConversationDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_whatsapp_conversation_dto_1.BusinessScopedConversationDto]),
    __metadata("design:returntype", void 0)
], WhatsappConversationController.prototype, "complete", null);
__decorate([
    (0, common_1.Patch)(':id/expire'),
    (0, swagger_1.ApiOperation)({ summary: 'Expirar conversacion' }),
    (0, swagger_1.ApiBody)({ type: update_whatsapp_conversation_dto_1.BusinessScopedConversationDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_whatsapp_conversation_dto_1.BusinessScopedConversationDto]),
    __metadata("design:returntype", void 0)
], WhatsappConversationController.prototype, "expire", null);
__decorate([
    (0, common_1.Patch)(':id/require-human'),
    (0, swagger_1.ApiOperation)({ summary: 'Marcar conversacion como requiere humano' }),
    (0, swagger_1.ApiBody)({ type: update_whatsapp_conversation_dto_1.BusinessScopedConversationDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_whatsapp_conversation_dto_1.BusinessScopedConversationDto]),
    __metadata("design:returntype", void 0)
], WhatsappConversationController.prototype, "requireHuman", null);
__decorate([
    (0, common_1.Patch)(':id/assign-human'),
    (0, swagger_1.ApiOperation)({ summary: 'Asignar conversacion a un usuario humano' }),
    (0, swagger_1.ApiBody)({ type: update_whatsapp_conversation_dto_1.AssignHumanDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_whatsapp_conversation_dto_1.AssignHumanDto]),
    __metadata("design:returntype", void 0)
], WhatsappConversationController.prototype, "assignHuman", null);
__decorate([
    (0, common_1.Patch)(':id/return-to-bot'),
    (0, swagger_1.ApiOperation)({ summary: 'Devolver conversacion al bot' }),
    (0, swagger_1.ApiBody)({ type: update_whatsapp_conversation_dto_1.BusinessScopedConversationDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_whatsapp_conversation_dto_1.BusinessScopedConversationDto]),
    __metadata("design:returntype", void 0)
], WhatsappConversationController.prototype, "returnToBot", null);
exports.WhatsappConversationController = WhatsappConversationController = __decorate([
    (0, swagger_1.ApiTags)('whatsapp-conversations'),
    (0, swagger_1.ApiExcludeController)(),
    (0, common_1.Controller)('whatsapp-conversations'),
    __metadata("design:paramtypes", [whatsapp_conversation_service_1.WhatsappConversationService])
], WhatsappConversationController);
//# sourceMappingURL=whatsapp-conversation.controller.js.map