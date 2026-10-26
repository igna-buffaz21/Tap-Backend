"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappServiceModule = void 0;
const common_1 = require("@nestjs/common");
const availability_module_1 = require("../availability/availability.module");
const bookings_module_1 = require("../bookings/bookings.module");
const customers_module_1 = require("../customers/customers.module");
const ia_service_module_1 = require("../ia-service/ia-service.module");
const whatsapp_accounts_module_1 = require("../whatsapp-accounts/whatsapp-accounts.module");
const whatsapp_conversation_module_1 = require("../whatsapp-conversation/whatsapp-conversation.module");
const whatsapp_message_module_1 = require("../whatsapp-message/whatsapp-message.module");
const whatsapp_service_service_1 = require("./whatsapp-service.service");
const whatsapp_service_controller_1 = require("./whatsapp-service.controller");
let WhatsappServiceModule = class WhatsappServiceModule {
};
exports.WhatsappServiceModule = WhatsappServiceModule;
exports.WhatsappServiceModule = WhatsappServiceModule = __decorate([
    (0, common_1.Module)({
        imports: [
            availability_module_1.AvailabilityModule,
            bookings_module_1.BookingsModule,
            customers_module_1.CustomersModule,
            ia_service_module_1.IaServiceModule,
            whatsapp_accounts_module_1.WhatsappAccountsModule,
            whatsapp_conversation_module_1.WhatsappConversationModule,
            whatsapp_message_module_1.WhatsappMessageModule,
        ],
        controllers: [whatsapp_service_controller_1.WhatsappServiceController],
        providers: [whatsapp_service_service_1.WhatsappServiceService],
        exports: [whatsapp_service_service_1.WhatsappServiceService],
    })
], WhatsappServiceModule);
//# sourceMappingURL=whatsapp-service.module.js.map