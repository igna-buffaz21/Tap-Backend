import { ConfigService } from '@nestjs/config';
import { JsonObject } from '../whatsapp-conversation/entities/whatsapp-conversation.entity';
export interface IaFailureLogInput {
    source: string;
    error: unknown;
    model: string;
    timeoutMs: number;
    fallbackUsed: boolean;
    messageText: string;
    businessId: number | string;
    branchId?: number | string | null;
    conversation: {
        intent: string;
        status: string;
        context: JsonObject;
    };
    recentMessages?: string[];
}
export declare class IaErrorLoggerService {
    private readonly configService;
    private readonly logger;
    private readonly logFilePath;
    constructor(configService: ConfigService);
    logGeminiFailure(input: IaFailureLogInput): Promise<void>;
    private resolveLogFilePath;
    private resolveRuntimeEnvironment;
    private getPublicUrl;
    private getFirstConfiguredValue;
    private serializeError;
}
