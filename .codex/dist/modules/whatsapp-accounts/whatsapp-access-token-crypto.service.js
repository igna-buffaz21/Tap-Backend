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
exports.WhatsappAccessTokenCryptoService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const ENCRYPTED_TOKEN_PREFIX = 'enc:v1:';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;
let WhatsappAccessTokenCryptoService = class WhatsappAccessTokenCryptoService {
    configService;
    encryptionKey = null;
    constructor(configService) {
        this.configService = configService;
    }
    encrypt(token) {
        if (this.isEncrypted(token)) {
            return token;
        }
        const iv = (0, crypto_1.randomBytes)(IV_LENGTH);
        const cipher = (0, crypto_1.createCipheriv)(ALGORITHM, this.getEncryptionKey(), iv, {
            authTagLength: AUTH_TAG_LENGTH,
        });
        const encrypted = Buffer.concat([
            cipher.update(token, 'utf8'),
            cipher.final(),
        ]);
        const authTag = cipher.getAuthTag();
        return `${ENCRYPTED_TOKEN_PREFIX}${[
            iv.toString('base64url'),
            authTag.toString('base64url'),
            encrypted.toString('base64url'),
        ].join('.')}`;
    }
    decrypt(token) {
        if (!this.isEncrypted(token)) {
            return token;
        }
        const encryptedParts = token
            .slice(ENCRYPTED_TOKEN_PREFIX.length)
            .split('.');
        if (encryptedParts.length !== 3) {
            throw new common_1.ServiceUnavailableException('Encrypted Whatsapp access token has an invalid format');
        }
        const [ivValue, authTagValue, encryptedValue] = encryptedParts;
        const iv = Buffer.from(ivValue, 'base64url');
        const authTag = Buffer.from(authTagValue, 'base64url');
        const encrypted = Buffer.from(encryptedValue, 'base64url');
        if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
            throw new common_1.ServiceUnavailableException('Encrypted Whatsapp access token has invalid metadata');
        }
        const decipher = (0, crypto_1.createDecipheriv)(ALGORITHM, this.getEncryptionKey(), iv, {
            authTagLength: AUTH_TAG_LENGTH,
        });
        decipher.setAuthTag(authTag);
        return Buffer.concat([
            decipher.update(encrypted),
            decipher.final(),
        ]).toString('utf8');
    }
    isEncrypted(token) {
        return token.startsWith(ENCRYPTED_TOKEN_PREFIX);
    }
    getEncryptionKey() {
        if (this.encryptionKey) {
            return this.encryptionKey;
        }
        const configuredKey = this.configService.get('WHATSAPP_ACCESS_TOKEN_ENCRYPTION_KEY');
        if (!configuredKey) {
            throw new common_1.ServiceUnavailableException('WHATSAPP_ACCESS_TOKEN_ENCRYPTION_KEY is required to encrypt Whatsapp access tokens');
        }
        this.encryptionKey = this.parseEncryptionKey(configuredKey.trim());
        return this.encryptionKey;
    }
    parseEncryptionKey(configuredKey) {
        const base64Key = Buffer.from(configuredKey, 'base64');
        if (base64Key.length === KEY_LENGTH &&
            this.safeStringEquals(base64Key.toString('base64').replace(/=+$/g, ''), configuredKey.replace(/=+$/g, ''))) {
            return base64Key;
        }
        if (/^[a-f0-9]{64}$/i.test(configuredKey)) {
            return Buffer.from(configuredKey, 'hex');
        }
        const utf8Key = Buffer.from(configuredKey, 'utf8');
        if (utf8Key.length === KEY_LENGTH) {
            return utf8Key;
        }
        throw new common_1.ServiceUnavailableException('WHATSAPP_ACCESS_TOKEN_ENCRYPTION_KEY must be 32 bytes as base64, hex, or utf8');
    }
    safeStringEquals(left, right) {
        const leftBuffer = Buffer.from(left);
        const rightBuffer = Buffer.from(right);
        return (leftBuffer.length === rightBuffer.length &&
            (0, crypto_1.timingSafeEqual)(leftBuffer, rightBuffer));
    }
};
exports.WhatsappAccessTokenCryptoService = WhatsappAccessTokenCryptoService;
exports.WhatsappAccessTokenCryptoService = WhatsappAccessTokenCryptoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], WhatsappAccessTokenCryptoService);
//# sourceMappingURL=whatsapp-access-token-crypto.service.js.map