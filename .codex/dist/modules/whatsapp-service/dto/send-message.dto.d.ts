declare class TextDto {
    body: string;
    preview_url?: string;
}
declare class TemplateLanguageDto {
    code: string;
}
declare class TemplateDto {
    name: string;
    language: TemplateLanguageDto;
    components?: Record<string, unknown>[];
}
declare class ImageDto {
    link?: string;
    id?: string;
}
declare class DocumentDto {
    link?: string;
    id?: string;
    filename?: string;
}
declare class InteractiveButtonReplyDto {
    id: string;
    title: string;
}
declare class InteractiveButtonDto {
    type: string;
    reply: InteractiveButtonReplyDto;
}
declare class InteractiveListRowDto {
    id: string;
    title: string;
    description?: string;
}
declare class InteractiveListSectionDto {
    title: string;
    rows: InteractiveListRowDto[];
}
declare class InteractiveFooterDto {
    text: string;
}
declare class InteractiveBodyDto {
    text: string;
}
declare class InteractiveDto {
    type: string;
    body: InteractiveBodyDto;
    action?: {
        button?: string;
        buttons?: InteractiveButtonDto[];
        sections?: InteractiveListSectionDto[];
    };
    footer?: InteractiveFooterDto;
}
export declare class SendMessageDto {
    id?: number | string;
    whatsappAccountId?: number;
    phoneNumberId?: string;
    businessId?: number;
    conversationId?: number;
    messaging_product: string;
    to: string;
    type: string;
    text?: TextDto;
    image?: ImageDto;
    document?: DocumentDto;
    template?: TemplateDto;
    interactive?: InteractiveDto;
}
export {};
