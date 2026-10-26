import { JsonObject, WhatsappMessage, WhatsappMessageStatus } from './entities/whatsapp-message.entity';
import { WhatsappMessageRepository } from './whatsapp-message.repository';
export interface CreateInboundWhatsappMessageInput {
    businessId: number | string;
    conversationId: number | string;
    messageType: string;
    providerMessageId?: string | null;
    content: JsonObject;
    receivedAt?: Date | string;
}
export interface CreateOutboundWhatsappMessageInput {
    businessId: number | string;
    conversationId: number | string;
    messageType: string;
    providerMessageId?: string | null;
    content: JsonObject;
}
export interface CreateInboundWhatsappMessageResult {
    message: WhatsappMessage;
    isDuplicate: boolean;
}
export declare class WhatsappMessageService {
    private readonly whatsappMessageRepository;
    constructor(whatsappMessageRepository: WhatsappMessageRepository);
    createInboundMessage(input: CreateInboundWhatsappMessageInput): Promise<WhatsappMessage>;
    createInboundMessageIfNotExists(input: CreateInboundWhatsappMessageInput): Promise<CreateInboundWhatsappMessageResult>;
    createOutboundMessage(input: CreateOutboundWhatsappMessageInput): Promise<WhatsappMessage>;
    updateProviderMessageId(id: number | string, businessId: number | string, providerMessageId: string): Promise<WhatsappMessage>;
    updateMessageStatus(providerMessageId: string, businessId: number | string, status: WhatsappMessageStatus): Promise<WhatsappMessage>;
    updateMessageStatusById(id: number | string, businessId: number | string, status: WhatsappMessageStatus): Promise<WhatsappMessage>;
    findByProviderMessageId(providerMessageId: string, businessId: number | string): Promise<WhatsappMessage | null>;
    findByConversationId(conversationId: number | string, businessId: number | string, limitValue?: number | string | undefined, offsetValue?: number | string | undefined): Promise<WhatsappMessage[]>;
    findRecentByConversationId(conversationId: number | string, businessId: number | string, limitValue?: number | string | undefined): Promise<WhatsappMessage[]>;
    findById(id: number | string, businessId: number | string): Promise<WhatsappMessage | null>;
    private getConversationScopeOrFail;
    private validateOutboundStatusUpdate;
    private validateMessageType;
    private validateContent;
    private normalizeOptionalProviderMessageId;
    private validateProviderMessageId;
    private parsePositiveInteger;
    private parseOptionalNonNegativeInteger;
    private parseOptionalDate;
    private isUniqueViolation;
}
