export declare enum WhatsappConversationIntent {
    UNKNOWN = "UNKNOWN",
    BOOKING = "BOOKING",
    VIEW_BOOKINGS = "VIEW_BOOKINGS",
    CANCEL_BOOKING = "CANCEL_BOOKING"
}
export declare enum WhatsappConversationStatus {
    ACTIVE = "ACTIVE",
    HUMAN_REQUIRED = "HUMAN_REQUIRED",
    HUMAN_ACTIVE = "HUMAN_ACTIVE",
    COMPLETED = "COMPLETED",
    EXPIRED = "EXPIRED"
}
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export interface JsonObject {
    [key: string]: JsonValue;
}
export declare class WhatsappConversation {
    id: number;
    whatsapp_account_id: number;
    business_id: number;
    branch_id: number | null;
    customer_id: number;
    intent: WhatsappConversationIntent;
    status: WhatsappConversationStatus;
    context: JsonObject;
    assigned_user_id: number | null;
    last_message_at: Date;
    expires_at: Date | null;
    created_at: Date;
    updated_at: Date;
}
