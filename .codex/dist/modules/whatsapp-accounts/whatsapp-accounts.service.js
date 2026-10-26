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
exports.WhatsappAccountsService = void 0;
const common_1 = require("@nestjs/common");
const whatsapp_access_token_crypto_service_1 = require("./whatsapp-access-token-crypto.service");
const whatsapp_accounts_repository_1 = require("./whatsapp-accounts.repository");
let WhatsappAccountsService = class WhatsappAccountsService {
    whatsappAccountsRepository;
    accessTokenCryptoService;
    constructor(whatsappAccountsRepository, accessTokenCryptoService) {
        this.whatsappAccountsRepository = whatsappAccountsRepository;
        this.accessTokenCryptoService = accessTokenCryptoService;
    }
    async create(createWhatsappAccountDto) {
        const dto = {
            ...createWhatsappAccountDto,
            business_id: this.parsePositiveInteger(createWhatsappAccountDto.business_id, 'business_id'),
            branch_id: this.parsePositiveInteger(createWhatsappAccountDto.branch_id, 'branch_id'),
            phone_number: this.normalizeRequiredString(createWhatsappAccountDto.phone_number, 'phone_number'),
            phone_number_id: this.normalizeOptionalString(createWhatsappAccountDto.phone_number_id),
            waba_id: this.normalizeRequiredString(createWhatsappAccountDto.waba_id, 'waba_id'),
            meta_business_id: this.normalizeOptionalString(createWhatsappAccountDto.meta_business_id),
            access_token: this.normalizeRequiredString(createWhatsappAccountDto.access_token, 'access_token'),
            status: createWhatsappAccountDto.status?.trim() || 'ACTIVE',
        };
        dto.access_token = this.accessTokenCryptoService.encrypt(dto.access_token);
        await this.assertBusinessExists(dto.business_id);
        await this.assertBranchBelongsToBusiness(dto.branch_id, dto.business_id);
        try {
            return await this.whatsappAccountsRepository.create(dto);
        }
        catch (error) {
            if (this.isUniqueViolation(error)) {
                throw new common_1.ConflictException('Whatsapp account already exists');
            }
            throw error;
        }
    }
    findAll() {
        return this.whatsappAccountsRepository.findAll();
    }
    findOne(id) {
        return this.whatsappAccountsRepository.findById(id);
    }
    async findByWebhookReference(displayPhoneNumber, phoneNumber, wabaId) {
        return this.decryptNullableAccount(await this.whatsappAccountsRepository.findByWebhookReference(displayPhoneNumber, phoneNumber, wabaId));
    }
    async findByPhoneNumber(phoneNumber) {
        return this.decryptNullableAccount(await this.whatsappAccountsRepository.findByPhoneNumber(phoneNumber));
    }
    async findActiveById(id) {
        return this.decryptNullableAccount(await this.whatsappAccountsRepository.findActiveById(id));
    }
    async findActiveByBusinessId(businessId) {
        return this.decryptAccounts(await this.whatsappAccountsRepository.findActiveByBusinessId(businessId));
    }
    async update(id, updateWhatsappAccountDto) {
        const dto = this.normalizeUpdateDto(updateWhatsappAccountDto);
        const current = await this.whatsappAccountsRepository.findById(id);
        if (!current) {
            return null;
        }
        const businessId = dto.business_id ?? current.business_id;
        const branchId = dto.branch_id ?? current.branch_id;
        if (dto.business_id !== undefined) {
            await this.assertBusinessExists(businessId);
        }
        if (dto.business_id !== undefined || dto.branch_id !== undefined) {
            await this.assertBranchBelongsToBusiness(branchId, businessId);
        }
        try {
            return await this.whatsappAccountsRepository.update(id, dto);
        }
        catch (error) {
            if (this.isUniqueViolation(error)) {
                throw new common_1.ConflictException('Whatsapp account already exists');
            }
            throw error;
        }
    }
    remove(id) {
        return this.whatsappAccountsRepository.remove(id);
    }
    updateAccessToken(id, accessToken) {
        return this.update(id, { access_token: accessToken });
    }
    parsePositiveInteger(value, field) {
        if (!Number.isInteger(value) || value <= 0) {
            throw new common_1.BadRequestException(`${field} must be a positive integer`);
        }
        return value;
    }
    normalizeRequiredString(value, field) {
        const normalizedValue = value.trim();
        if (normalizedValue.length === 0) {
            throw new common_1.BadRequestException(`${field} is required`);
        }
        return normalizedValue;
    }
    normalizeOptionalString(value) {
        if (value === undefined || value === null) {
            return null;
        }
        const normalizedValue = value.trim();
        return normalizedValue.length === 0 ? null : normalizedValue;
    }
    normalizeUpdateDto(updateWhatsappAccountDto) {
        const dto = {};
        if (updateWhatsappAccountDto.business_id !== undefined) {
            dto.business_id = this.parsePositiveInteger(updateWhatsappAccountDto.business_id, 'business_id');
        }
        if (updateWhatsappAccountDto.branch_id !== undefined) {
            dto.branch_id = this.parsePositiveInteger(updateWhatsappAccountDto.branch_id, 'branch_id');
        }
        if (updateWhatsappAccountDto.phone_number !== undefined) {
            dto.phone_number = this.normalizeRequiredString(updateWhatsappAccountDto.phone_number, 'phone_number');
        }
        if (Object.prototype.hasOwnProperty.call(updateWhatsappAccountDto, 'phone_number_id')) {
            dto.phone_number_id = this.normalizeOptionalString(updateWhatsappAccountDto.phone_number_id);
        }
        if (updateWhatsappAccountDto.waba_id !== undefined) {
            dto.waba_id = this.normalizeRequiredString(updateWhatsappAccountDto.waba_id, 'waba_id');
        }
        if (Object.prototype.hasOwnProperty.call(updateWhatsappAccountDto, 'meta_business_id')) {
            dto.meta_business_id = this.normalizeOptionalString(updateWhatsappAccountDto.meta_business_id);
        }
        if (updateWhatsappAccountDto.access_token !== undefined) {
            dto.access_token = this.normalizeRequiredString(updateWhatsappAccountDto.access_token, 'access_token');
            dto.access_token = this.accessTokenCryptoService.encrypt(dto.access_token);
        }
        if (updateWhatsappAccountDto.status !== undefined) {
            dto.status = this.normalizeRequiredString(updateWhatsappAccountDto.status, 'status');
        }
        return dto;
    }
    decryptAccounts(accounts) {
        return accounts.map((account) => this.decryptAccount(account));
    }
    decryptNullableAccount(account) {
        return account ? this.decryptAccount(account) : null;
    }
    decryptAccount(account) {
        if (!account.access_token) {
            return account;
        }
        return {
            ...account,
            access_token: this.accessTokenCryptoService.decrypt(account.access_token),
        };
    }
    async assertBusinessExists(businessId) {
        const exists = await this.whatsappAccountsRepository.businessExists(businessId);
        if (!exists) {
            throw new common_1.BadRequestException('Business not found');
        }
    }
    async assertBranchBelongsToBusiness(branchId, businessId) {
        const exists = await this.whatsappAccountsRepository.branchBelongsToBusiness(branchId, businessId);
        if (!exists) {
            throw new common_1.BadRequestException('Branch does not belong to business');
        }
    }
    isUniqueViolation(error) {
        if (typeof error !== 'object' || error === null || !('code' in error)) {
            return false;
        }
        return error.code === '23505';
    }
};
exports.WhatsappAccountsService = WhatsappAccountsService;
exports.WhatsappAccountsService = WhatsappAccountsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [whatsapp_accounts_repository_1.WhatsappAccountsRepository,
        whatsapp_access_token_crypto_service_1.WhatsappAccessTokenCryptoService])
], WhatsappAccountsService);
//# sourceMappingURL=whatsapp-accounts.service.js.map