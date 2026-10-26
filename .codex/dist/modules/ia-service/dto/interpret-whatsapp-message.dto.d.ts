import type { JsonObject } from '../../whatsapp-conversation/entities/whatsapp-conversation.entity';
import { WhatsappConversationIntent, WhatsappConversationStatus } from '../../whatsapp-conversation/entities/whatsapp-conversation.entity';
export declare class InterpretWhatsappMessageDto {
    messageText: string;
    currentIntent: WhatsappConversationIntent;
    currentStatus: WhatsappConversationStatus;
    currentContext: JsonObject;
    businessId: number;
    branchId?: number | null;
    recentMessages?: string[];
}
