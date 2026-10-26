export declare enum WhatsappMessageDirection {
    INBOUND = "INBOUND",
    OUTBOUND = "OUTBOUND"
}
export declare enum WhatsappMessageStatus {
    RECEIVED = "RECEIVED",
    PENDING = "PENDING",
    SENT = "SENT",
    DELIVERED = "DELIVERED",
    READ = "READ",
    FAILED = "FAILED"
}
export declare enum WhatsappMessageType {
    TEXT = "TEXT",
    IMAGE = "IMAGE",
    DOCUMENT = "DOCUMENT",
    AUDIO = "AUDIO",
    VIDEO = "VIDEO",
    INTERACTIVE = "INTERACTIVE",
    TEMPLATE = "TEMPLATE"
}
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export interface JsonObject {
    [key: string]: JsonValue;
}
export declare class WhatsappMessage {
    id: number;
    conversation_id: number;
    whatsapp_account_id: number;
    customer_id: number;
    direction: WhatsappMessageDirection;
    message_type: WhatsappMessageType;
    provider_message_id: string | null;
    content: JsonObject;
    status: WhatsappMessageStatus;
    sent_at: Date | null;
    received_at: Date | null;
    created_at: Date;
    updated_at: Date;
}
