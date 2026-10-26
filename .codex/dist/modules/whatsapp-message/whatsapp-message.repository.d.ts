import { DatabaseService } from '../../database/database.service';
import { JsonObject, WhatsappMessage, WhatsappMessageStatus, WhatsappMessageType } from './entities/whatsapp-message.entity';
export interface ConversationMessageScope {
    whatsapp_account_id: number;
    customer_id: number;
}
export interface CreateInboundWhatsappMessageRecord {
    conversationId: number;
    whatsappAccountId: number;
    customerId: number;
    messageType: WhatsappMessageType;
    providerMessageId: string | null;
    content: JsonObject;
    receivedAt: Date | null;
}
export interface CreateOutboundWhatsappMessageRecord {
    conversationId: number;
    whatsappAccountId: number;
    customerId: number;
    messageType: WhatsappMessageType;
    providerMessageId: string | null;
    content: JsonObject;
}
export declare class WhatsappMessageRepository {
    private readonly databaseService;
    constructor(databaseService: DatabaseService);
    createInboundMessage(record: CreateInboundWhatsappMessageRecord): Promise<WhatsappMessage>;
    createInboundMessageIfNotExists(record: CreateInboundWhatsappMessageRecord): Promise<WhatsappMessage | null>;
    createOutboundMessage(record: CreateOutboundWhatsappMessageRecord): Promise<WhatsappMessage>;
    updateProviderMessageId(id: number, businessId: number, providerMessageId: string): Promise<WhatsappMessage | null>;
    updateMessageStatus(providerMessageId: string, businessId: number, status: WhatsappMessageStatus): Promise<WhatsappMessage | null>;
    updateMessageStatusById(id: number, businessId: number, status: WhatsappMessageStatus): Promise<WhatsappMessage | null>;
    findByProviderMessageId(providerMessageId: string, businessId: number): Promise<WhatsappMessage | null>;
    findByConversationId(conversationId: number, businessId: number, limit: number, offset: number): Promise<WhatsappMessage[]>;
    findRecentByConversationId(conversationId: number, businessId: number, limit: number): Promise<WhatsappMessage[]>;
    findById(id: number, businessId: number): Promise<WhatsappMessage | null>;
    getConversationMessageScope(conversationId: number, businessId: number): Promise<ConversationMessageScope | null>;
}
