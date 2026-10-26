"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappConversationModule = void 0;
const common_1 = require("@nestjs/common");
const whatsapp_conversation_controller_1 = require("./whatsapp-conversation.controller");
const whatsapp_conversation_repository_1 = require("./whatsapp-conversation.repository");
const whatsapp_conversation_service_1 = require("./whatsapp-conversation.service");
let WhatsappConversationModule = class WhatsappConversationModule {
};
exports.WhatsappConversationModule = WhatsappConversationModule;
exports.WhatsappConversationModule = WhatsappConversationModule = __decorate([
    (0, common_1.Module)({
        controllers: [whatsapp_conversation_controller_1.WhatsappConversationController],
        providers: [whatsapp_conversation_service_1.WhatsappConversationService, whatsapp_conversation_repository_1.WhatsappConversationRepository],
        exports: [whatsapp_conversation_service_1.WhatsappConversationService],
    })
], WhatsappConversationModule);
//# sourceMappingURL=whatsapp-conversation.module.js.map