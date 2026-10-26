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
exports.ClerkJwtService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const express_1 = require("@clerk/express");
let ClerkJwtService = class ClerkJwtService {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    async verifyToken(token) {
        try {
            const payload = (await (0, express_1.verifyToken)(token, {
                secretKey: this.getSecretKey(),
                jwtKey: this.configService.get('CLERK_JWT_KEY'),
                audience: this.configService.get('CLERK_AUDIENCE'),
                authorizedParties: this.getAuthorizedParties(),
            }));
            if (!payload?.sub) {
                throw new common_1.UnauthorizedException('Invalid token subject');
            }
            return payload;
        }
        catch (error) {
            if (error instanceof common_1.ServiceUnavailableException ||
                error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            throw new common_1.UnauthorizedException(`Invalid Clerk token: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    getSecretKey() {
        const secretKey = this.configService.get('CLERK_SECRET_KEY');
        if (!secretKey) {
            throw new common_1.ServiceUnavailableException('CLERK_SECRET_KEY is required');
        }
        return secretKey;
    }
    getAuthorizedParties() {
        const authorizedParties = this.configService.get('CLERK_AUTHORIZED_PARTIES');
        return authorizedParties
            ?.split(',')
            .map((origin) => origin.trim())
            .filter(Boolean);
    }
};
exports.ClerkJwtService = ClerkJwtService;
exports.ClerkJwtService = ClerkJwtService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ClerkJwtService);
//# sourceMappingURL=clerk-jwt.service.js.map