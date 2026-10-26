import type { JsonObject } from '../entities/whatsapp-message.entity';
export declare class CreateInboundWhatsappMessageDto {
    businessId: number;
    conversationId: number;
    messageType: string;
    providerMessageId?: string | null;
    content: JsonObject;
    receivedAt?: string;
}
export declare class CreateOutboundWhatsappMessageDto {
    businessId: number;
    conversationId: number;
    messageType: string;
    providerMessageId?: string | null;
    content: JsonObject;
}
