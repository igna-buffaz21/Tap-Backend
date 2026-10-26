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
exports.WhatsappMessageController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const create_whatsapp_message_dto_1 = require("./dto/create-whatsapp-message.dto");
const get_whatsapp_message_query_dto_1 = require("./dto/get-whatsapp-message-query.dto");
const update_whatsapp_message_dto_1 = require("./dto/update-whatsapp-message.dto");
const whatsapp_message_service_1 = require("./whatsapp-message.service");
let WhatsappMessageController = class WhatsappMessageController {
    whatsappMessageService;
    constructor(whatsappMessageService) {
        this.whatsappMessageService = whatsappMessageService;
    }
    createInboundMessage(createInboundMessageDto) {
        return this.whatsappMessageService.createInboundMessage(createInboundMessageDto);
    }
    createOutboundMessage(createOutboundMessageDto) {
        return this.whatsappMessageService.createOutboundMessage(createOutboundMessageDto);
    }
    updateProviderMessageId(id, updateProviderIdDto) {
        return this.whatsappMessageService.updateProviderMessageId(id, updateProviderIdDto.businessId, updateProviderIdDto.providerMessageId);
    }
    updateMessageStatus(updateStatusDto) {
        return this.whatsappMessageService.updateMessageStatus(updateStatusDto.providerMessageId, updateStatusDto.businessId, updateStatusDto.status);
    }
    findByProviderMessageId(providerMessageId, query) {
        return this.whatsappMessageService.findByProviderMessageId(providerMessageId, query.businessId);
    }
    findByConversationId(conversationId, query) {
        return this.whatsappMessageService.findByConversationId(conversationId, query.businessId, query.limit, query.offset);
    }
    findById(id, query) {
        return this.whatsappMessageService.findById(id, query.businessId);
    }
};
exports.WhatsappMessageController = WhatsappMessageController;
__decorate([
    (0, common_1.Post)('inbound'),
    (0, swagger_1.ApiOperation)({ summary: 'Guardar mensaje entrante de WhatsApp' }),
    (0, swagger_1.ApiBody)({ type: create_whatsapp_message_dto_1.CreateInboundWhatsappMessageDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_whatsapp_message_dto_1.CreateInboundWhatsappMessageDto]),
    __metadata("design:returntype", void 0)
], WhatsappMessageController.prototype, "createInboundMessage", null);
__decorate([
    (0, common_1.Post)('outbound'),
    (0, swagger_1.ApiOperation)({ summary: 'Guardar mensaje saliente pendiente de WhatsApp' }),
    (0, swagger_1.ApiBody)({ type: create_whatsapp_message_dto_1.CreateOutboundWhatsappMessageDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_whatsapp_message_dto_1.CreateOutboundWhatsappMessageDto]),
    __metadata("design:returntype", void 0)
], WhatsappMessageController.prototype, "createOutboundMessage", null);
__decorate([
    (0, common_1.Patch)(':id/provider-message-id'),
    (0, swagger_1.ApiOperation)({ summary: 'Guardar provider_message_id devuelto por Meta' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 25 }),
    (0, swagger_1.ApiBody)({ type: update_whatsapp_message_dto_1.UpdateWhatsappMessageProviderIdDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_whatsapp_message_dto_1.UpdateWhatsappMessageProviderIdDto]),
    __metadata("design:returntype", void 0)
], WhatsappMessageController.prototype, "updateProviderMessageId", null);
__decorate([
    (0, common_1.Patch)('status'),
    (0, swagger_1.ApiOperation)({
        summary: 'Actualizar estado de mensaje saliente por provider_message_id',
    }),
    (0, swagger_1.ApiBody)({ type: update_whatsapp_message_dto_1.UpdateWhatsappMessageStatusDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_whatsapp_message_dto_1.UpdateWhatsappMessageStatusDto]),
    __metadata("design:returntype", void 0)
], WhatsappMessageController.prototype, "updateMessageStatus", null);
__decorate([
    (0, common_1.Get)('provider/:providerMessageId'),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar mensaje por provider_message_id' }),
    (0, swagger_1.ApiParam)({ name: 'providerMessageId', example: 'wamid.HBgNNTQ5MzUx...' }),
    (0, swagger_1.ApiQuery)({ name: 'businessId', example: 1 }),
    __param(0, (0, common_1.Param)('providerMessageId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, get_whatsapp_message_query_dto_1.GetWhatsappMessageByProviderIdQueryDto]),
    __metadata("design:returntype", void 0)
], WhatsappMessageController.prototype, "findByProviderMessageId", null);
__decorate([
    (0, common_1.Get)('conversation/:conversationId'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar mensajes de una conversacion' }),
    (0, swagger_1.ApiParam)({ name: 'conversationId', example: 10 }),
    (0, swagger_1.ApiQuery)({ name: 'businessId', example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, example: 50 }),
    (0, swagger_1.ApiQuery)({ name: 'offset', required: false, example: 0 }),
    __param(0, (0, common_1.Param)('conversationId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, get_whatsapp_message_query_dto_1.GetWhatsappMessagesByConversationQueryDto]),
    __metadata("design:returntype", void 0)
], WhatsappMessageController.prototype, "findByConversationId", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar mensaje de WhatsApp por id' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 25 }),
    (0, swagger_1.ApiQuery)({ name: 'businessId', example: 1 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, get_whatsapp_message_query_dto_1.GetWhatsappMessageByProviderIdQueryDto]),
    __metadata("design:returntype", void 0)
], WhatsappMessageController.prototype, "findById", null);
exports.WhatsappMessageController = WhatsappMessageController = __decorate([
    (0, swagger_1.ApiTags)('whatsapp-messages'),
    (0, swagger_1.ApiExcludeController)(),
    (0, common_1.Controller)('whatsapp-messages'),
    __metadata("design:paramtypes", [whatsapp_message_service_1.WhatsappMessageService])
], WhatsappMessageController);
//# sourceMappingURL=whatsapp-message.controller.js.map