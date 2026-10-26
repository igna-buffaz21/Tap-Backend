import { JsonObject, WhatsappConversationIntent, WhatsappConversationStatus } from '../whatsapp-conversation/entities/whatsapp-conversation.entity';
export declare enum IaConversationNextAction {
    NONE = "NONE",
    ASK_CLARIFICATION = "ASK_CLARIFICATION",
    SEARCH_AVAILABILITY = "SEARCH_AVAILABILITY",
    CREATE_BOOKING = "CREATE_BOOKING",
    VIEW_BOOKINGS = "VIEW_BOOKINGS",
    CANCEL_BOOKING = "CANCEL_BOOKING",
    HANDOFF_HUMAN = "HANDOFF_HUMAN"
}
export interface IaWhatsappMessageInterpretation {
    intent: WhatsappConversationIntent;
    status: WhatsappConversationStatus;
    contextPatch: JsonObject;
    missingFields: string[];
    nextAction: IaConversationNextAction;
    replyText: string | null;
    confidence: number;
}
export interface InterpretWhatsappMessageInput {
    messageText: string;
    currentIntent: WhatsappConversationIntent;
    currentStatus: WhatsappConversationStatus;
    currentContext: JsonObject;
    businessId: number | string;
    branchId?: number | string | null;
    recentMessages?: string[];
}
