import type { JsonObject } from '../entities/whatsapp-conversation.entity';
import { WhatsappConversationIntent, WhatsappConversationStatus } from '../entities/whatsapp-conversation.entity';
export declare class UpdateWhatsappConversationIntentDto {
    businessId: number;
    intent: WhatsappConversationIntent;
}
export declare class UpdateWhatsappConversationContextDto {
    businessId: number;
    context: JsonObject;
}
export declare class UpdateWhatsappConversationStateDto {
    businessId: number;
    intent?: WhatsappConversationIntent;
    status?: WhatsappConversationStatus;
    context?: JsonObject;
    branchId?: number | null;
    assignedUserId?: number | null;
    lastMessageAt?: string;
    expiresAt?: string | null;
}
export declare class TouchWhatsappConversationDto {
    businessId: number;
    lastMessageAt?: string;
}
export declare class BusinessScopedConversationDto {
    businessId: number;
}
export declare class AssignHumanDto {
    businessId: number;
    assignedUserId: number;
}
