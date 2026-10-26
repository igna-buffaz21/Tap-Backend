import { WhatsappServiceService } from './whatsapp-service.service';
import { WebhookDto } from './dto/webhook.dto';
import { SendMessageDto } from './dto/send-message.dto';
export declare class WhatsappServiceController {
    private readonly whatsappService;
    private readonly logger;
    constructor(whatsappService: WhatsappServiceService);
    receiveMessage(payload: WebhookDto): {
        success: boolean;
        message: string;
    };
    verifyWebhook(mode: string, challenge: string, verifyToken: string): string | null;
    getIaContextSnapshot(conversationId: string, businessId: string, messageText?: string): Promise<import("./whatsapp-service.service").WhatsappIaContextSnapshot>;
    sendMessage(payload: SendMessageDto): Promise<import("./whatsapp-service.service").WhatsappSendResponse>;
    sendMessageFromSavedAccount(whatsappAccountId: string, payload: SendMessageDto): Promise<import("./whatsapp-service.service").WhatsappSendResponse>;
}
