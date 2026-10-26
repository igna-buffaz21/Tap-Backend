declare class MessageDto {
    id: string;
    type: string;
    timestamp: string;
    text?: {
        body: string;
    };
    interactive?: Record<string, unknown>;
    image?: Record<string, unknown>;
    document?: Record<string, unknown>;
    audio?: Record<string, unknown>;
    video?: Record<string, unknown>;
}
declare class StatusDto {
    id: string;
    status: string;
    timestamp: string;
    recipient_id?: string;
    errors?: Array<Record<string, unknown>>;
}
declare class ContactDto {
    wa_id: string;
    profile: {
        name: string;
    };
}
declare class ChangeValueDto {
    messaging_product: string;
    messages?: MessageDto[];
    statuses?: StatusDto[];
    contacts?: ContactDto[];
    metadata: {
        display_phone_number: string;
        phone_number_id: string;
    };
}
declare class ChangeDto {
    field: string;
    value: ChangeValueDto;
}
declare class EntryDto {
    id: string;
    changes: ChangeDto[];
}
export declare class WebhookDto {
    object: string;
    entry: EntryDto[];
}
export {};
