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
var IaErrorLoggerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IaErrorLoggerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const promises_1 = require("fs/promises");
const path_1 = require("path");
let IaErrorLoggerService = IaErrorLoggerService_1 = class IaErrorLoggerService {
    configService;
    logger = new common_1.Logger(IaErrorLoggerService_1.name);
    logFilePath;
    constructor(configService) {
        this.configService = configService;
        this.logFilePath = this.resolveLogFilePath();
    }
    async logGeminiFailure(input) {
        const runtime = this.resolveRuntimeEnvironment();
        const entry = {
            timestamp: new Date().toISOString(),
            environment: runtime.environment,
            environmentSource: runtime.source,
            publicUrl: runtime.publicUrl,
            source: input.source,
            fallbackUsed: input.fallbackUsed,
            gemini: {
                model: input.model,
                timeoutMs: input.timeoutMs,
            },
            error: this.serializeError(input.error),
            request: {
                businessId: input.businessId,
                branchId: input.branchId ?? null,
                messageText: input.messageText,
                conversation: input.conversation,
                recentMessages: input.recentMessages ?? [],
            },
        };
        try {
            await (0, promises_1.mkdir)((0, path_1.dirname)(this.logFilePath), { recursive: true });
            await (0, promises_1.appendFile)(this.logFilePath, `${JSON.stringify(entry)}\n`, 'utf8');
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.warn(`No se pudo escribir log de error IA en ${this.logFilePath}: ${errorMessage}`);
        }
    }
    resolveLogFilePath() {
        const configuredFile = this.configService.get('IA_ERROR_LOG_FILE')?.trim() ?? '';
        if (configuredFile) {
            return (0, path_1.isAbsolute)(configuredFile)
                ? configuredFile
                : (0, path_1.resolve)(process.cwd(), configuredFile);
        }
        const configuredDir = this.configService.get('IA_LOG_DIR')?.trim() ||
            this.configService.get('LOG_DIR')?.trim() ||
            'logs';
        return (0, path_1.resolve)(process.cwd(), configuredDir, 'ia-errors.log');
    }
    resolveRuntimeEnvironment() {
        const explicitEnvironment = this.getFirstConfiguredValue([
            'APP_ENV',
            'NODE_ENV',
            'ENVIRONMENT',
        ]);
        const normalizedEnvironment = explicitEnvironment?.toLowerCase();
        if (normalizedEnvironment) {
            if (['production', 'prod'].includes(normalizedEnvironment)) {
                return {
                    environment: 'production',
                    source: `env:${normalizedEnvironment}`,
                    publicUrl: this.getPublicUrl(),
                };
            }
            if (['development', 'dev', 'local'].includes(normalizedEnvironment)) {
                return {
                    environment: 'development',
                    source: `env:${normalizedEnvironment}`,
                    publicUrl: this.getPublicUrl(),
                };
            }
            if (normalizedEnvironment === 'test') {
                return {
                    environment: 'test',
                    source: `env:${normalizedEnvironment}`,
                    publicUrl: this.getPublicUrl(),
                };
            }
        }
        const publicUrl = this.getPublicUrl();
        if (!publicUrl) {
            return {
                environment: 'unknown',
                source: 'missing-public-url',
                publicUrl: null,
            };
        }
        const normalizedUrl = publicUrl.toLowerCase();
        if (normalizedUrl.includes('turnero.reportaya.site')) {
            return {
                environment: 'production',
                source: 'public-url:turnero.reportaya.site',
                publicUrl,
            };
        }
        if (normalizedUrl.includes('ngrok') ||
            normalizedUrl.includes('localhost') ||
            normalizedUrl.includes('127.0.0.1')) {
            return {
                environment: 'development',
                source: 'public-url:dev-tunnel-or-localhost',
                publicUrl,
            };
        }
        return {
            environment: 'unknown',
            source: 'public-url:unrecognized',
            publicUrl,
        };
    }
    getPublicUrl() {
        return this.getFirstConfiguredValue([
            'PUBLIC_API_URL',
            'APP_URL',
            'BACKEND_URL',
            'API_URL',
            'WEBHOOK_BASE_URL',
            'WHATSAPP_WEBHOOK_URL',
        ]);
    }
    getFirstConfiguredValue(keys) {
        for (const key of keys) {
            const value = this.configService.get(key)?.trim();
            if (value) {
                return value;
            }
        }
        return null;
    }
    serializeError(error) {
        if (error instanceof Error) {
            return {
                name: error.name,
                message: error.message,
                stack: error.stack ?? null,
            };
        }
        return {
            name: null,
            message: String(error),
            stack: null,
        };
    }
};
exports.IaErrorLoggerService = IaErrorLoggerService;
exports.IaErrorLoggerService = IaErrorLoggerService = IaErrorLoggerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], IaErrorLoggerService);
//# sourceMappingURL=ia-error-logger.service.js.map