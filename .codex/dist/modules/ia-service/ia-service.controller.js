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
exports.IaServiceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const interpret_whatsapp_message_dto_1 = require("./dto/interpret-whatsapp-message.dto");
const ia_service_service_1 = require("./ia-service.service");
let IaServiceController = class IaServiceController {
    iaServiceService;
    constructor(iaServiceService) {
        this.iaServiceService = iaServiceService;
    }
    interpretWhatsappMessage(interpretWhatsappMessageDto) {
        return this.iaServiceService.interpretWhatsappMessage(interpretWhatsappMessageDto);
    }
};
exports.IaServiceController = IaServiceController;
__decorate([
    (0, common_1.Post)('whatsapp/interpret'),
    (0, swagger_1.ApiOperation)({ summary: 'Interpretar mensaje de WhatsApp con IA' }),
    (0, swagger_1.ApiBody)({ type: interpret_whatsapp_message_dto_1.InterpretWhatsappMessageDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [interpret_whatsapp_message_dto_1.InterpretWhatsappMessageDto]),
    __metadata("design:returntype", void 0)
], IaServiceController.prototype, "interpretWhatsappMessage", null);
exports.IaServiceController = IaServiceController = __decorate([
    (0, swagger_1.ApiTags)('ia-service'),
    (0, swagger_1.ApiExcludeController)(),
    (0, common_1.Controller)('ia-service'),
    __metadata("design:paramtypes", [ia_service_service_1.IaServiceService])
], IaServiceController);
//# sourceMappingURL=ia-service.controller.js.map