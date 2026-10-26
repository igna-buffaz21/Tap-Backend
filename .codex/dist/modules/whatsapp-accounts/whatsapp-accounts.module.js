"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappAccountsModule = void 0;
const common_1 = require("@nestjs/common");
const whatsapp_accounts_service_1 = require("./whatsapp-accounts.service");
const whatsapp_accounts_controller_1 = require("./whatsapp-accounts.controller");
const whatsapp_accounts_repository_1 = require("./whatsapp-accounts.repository");
const whatsapp_access_token_crypto_service_1 = require("./whatsapp-access-token-crypto.service");
let WhatsappAccountsModule = class WhatsappAccountsModule {
};
exports.WhatsappAccountsModule = WhatsappAccountsModule;
exports.WhatsappAccountsModule = WhatsappAccountsModule = __decorate([
    (0, common_1.Module)({
        controllers: [whatsapp_accounts_controller_1.WhatsappAccountsController],
        providers: [
            whatsapp_accounts_service_1.WhatsappAccountsService,
            whatsapp_accounts_repository_1.WhatsappAccountsRepository,
            whatsapp_access_token_crypto_service_1.WhatsappAccessTokenCryptoService,
        ],
        exports: [whatsapp_accounts_service_1.WhatsappAccountsService, whatsapp_accounts_repository_1.WhatsappAccountsRepository],
    })
], WhatsappAccountsModule);
//# sourceMappingURL=whatsapp-accounts.module.js.map