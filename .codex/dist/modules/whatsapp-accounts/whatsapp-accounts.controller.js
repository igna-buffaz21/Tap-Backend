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
exports.WhatsappAccountsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const require_permission_decorator_1 = require("../auth/decorators/require-permission.decorator");
const whatsapp_accounts_service_1 = require("./whatsapp-accounts.service");
const create_whatsapp_account_dto_1 = require("./dto/create-whatsapp-account.dto");
const update_whatsapp_account_dto_1 = require("./dto/update-whatsapp-account.dto");
const update_whatsapp_access_token_dto_1 = require("./dto/update-whatsapp-access-token.dto");
let WhatsappAccountsController = class WhatsappAccountsController {
    whatsappAccountsService;
    constructor(whatsappAccountsService) {
        this.whatsappAccountsService = whatsappAccountsService;
    }
    async create(createWhatsappAccountDto) {
        return this.toResponse(await this.whatsappAccountsService.create(createWhatsappAccountDto));
    }
    async findAll() {
        const accounts = await this.whatsappAccountsService.findAll();
        return accounts.map((account) => this.toResponse(account));
    }
    async findOne(id) {
        return this.toNullableResponse(await this.whatsappAccountsService.findOne(+id));
    }
    async update(id, updateWhatsappAccountDto) {
        return this.toNullableResponse(await this.whatsappAccountsService.update(+id, updateWhatsappAccountDto));
    }
    async updateAccessToken(id, updateAccessTokenDto) {
        return this.toNullableResponse(await this.whatsappAccountsService.updateAccessToken(+id, updateAccessTokenDto.access_token));
    }
    remove(id) {
        return this.whatsappAccountsService.remove(+id);
    }
    toNullableResponse(account) {
        return account ? this.toResponse(account) : null;
    }
    toResponse(account) {
        const { access_token, ...response } = account;
        return {
            ...response,
            access_token_configured: Boolean(access_token?.trim()),
        };
    }
};
exports.WhatsappAccountsController = WhatsappAccountsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Crear cuenta de WhatsApp asociada a negocio y sede',
    }),
    (0, swagger_1.ApiBody)({ type: create_whatsapp_account_dto_1.CreateWhatsappAccountDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_whatsapp_account_dto_1.CreateWhatsappAccountDto]),
    __metadata("design:returntype", Promise)
], WhatsappAccountsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WhatsappAccountsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WhatsappAccountsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_whatsapp_account_dto_1.UpdateWhatsappAccountDto]),
    __metadata("design:returntype", Promise)
], WhatsappAccountsController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/access-token'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Actualizar el token de acceso de una cuenta de WhatsApp',
        description: 'Guarda el token cifrado y nunca lo devuelve en la respuesta.',
    }),
    (0, swagger_1.ApiBody)({ type: update_whatsapp_access_token_dto_1.UpdateWhatsappAccessTokenDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_whatsapp_access_token_dto_1.UpdateWhatsappAccessTokenDto]),
    __metadata("design:returntype", Promise)
], WhatsappAccountsController.prototype, "updateAccessToken", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WhatsappAccountsController.prototype, "remove", null);
exports.WhatsappAccountsController = WhatsappAccountsController = __decorate([
    (0, swagger_1.ApiTags)('whatsapp-accounts'),
    (0, swagger_1.ApiExcludeController)(),
    (0, require_permission_decorator_1.SuperadminOnly)(),
    (0, common_1.Controller)('whatsapp-accounts'),
    __metadata("design:paramtypes", [whatsapp_accounts_service_1.WhatsappAccountsService])
], WhatsappAccountsController);
//# sourceMappingURL=whatsapp-accounts.controller.js.map