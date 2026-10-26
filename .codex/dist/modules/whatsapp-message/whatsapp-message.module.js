"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappMessageModule = void 0;
const common_1 = require("@nestjs/common");
const whatsapp_message_controller_1 = require("./whatsapp-message.controller");
const whatsapp_message_repository_1 = require("./whatsapp-message.repository");
const whatsapp_message_service_1 = require("./whatsapp-message.service");
let WhatsappMessageModule = class WhatsappMessageModule {
};
exports.WhatsappMessageModule = WhatsappMessageModule;
exports.WhatsappMessageModule = WhatsappMessageModule = __decorate([
    (0, common_1.Module)({
        controllers: [whatsapp_message_controller_1.WhatsappMessageController],
        providers: [whatsapp_message_service_1.WhatsappMessageService, whatsapp_message_repository_1.WhatsappMessageRepository],
        exports: [whatsapp_message_service_1.WhatsappMessageService],
    })
], WhatsappMessageModule);
//# sourceMappingURL=whatsapp-message.module.js.map