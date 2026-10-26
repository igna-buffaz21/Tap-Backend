import { JsonObject, WhatsappConversation, WhatsappConversationIntent, WhatsappConversationStatus } from './entities/whatsapp-conversation.entity';
import { WhatsappConversationRepository } from './whatsapp-conversation.repository';
export interface CreateWhatsappConversationInput {
    whatsappAccountId: number | string;
    businessId: number | string;
    branchId?: number | string | null;
    customerId: number | string;
    lastMessageAt?: Date | string;
    expiresAt?: Date | string | null;
}
export interface UpdateWhatsappConversationStateInput {
    intent?: WhatsappConversationIntent;
    status?: WhatsappConversationStatus;
    context?: JsonObject;
    branchId?: number | string | null;
    assignedUserId?: number | string | null;
    lastMessageAt?: Date | string;
    expiresAt?: Date | string | null;
}
export declare class WhatsappConversationService {
    private readonly whatsappConversationRepository;
    constructor(whatsappConversationRepository: WhatsappConversationRepository);
    findActiveConversation(whatsappAccountId: number | string, customerId: number | string): Promise<WhatsappConversation | null>;
    createConversation(input: CreateWhatsappConversationInput): Promise<WhatsappConversation>;
    getOrCreateActiveConversation(input: CreateWhatsappConversationInput): Promise<WhatsappConversation>;
    updateIntent(id: number | string, businessId: number | string, intent: WhatsappConversationIntent): Promise<WhatsappConversation>;
    updateContext(id: number | string, businessId: number | string, context: JsonObject): Promise<WhatsappConversation>;
    updateConversationState(id: number | string, businessId: number | string, updates: UpdateWhatsappConversationStateInput): Promise<WhatsappConversation>;
    touchConversation(id: number | string, businessId: number | string, lastMessageAt?: Date | string): Promise<WhatsappConversation>;
    completeConversation(id: number | string, businessId: number | string): Promise<WhatsappConversation>;
    expireConversation(id: number | string, businessId: number | string): Promise<WhatsappConversation>;
    requireHuman(id: number | string, businessId: number | string): Promise<WhatsappConversation>;
    assignHuman(id: number | string, businessId: number | string, assignedUserId: number | string): Promise<WhatsappConversation>;
    returnToBot(id: number | string, businessId: number | string): Promise<WhatsappConversation>;
    findById(id: number | string, businessId?: number | string): Promise<WhatsappConversation | null>;
    private normalizeCreateInput;
    private normalizeStateUpdates;
    private assertWhatsappAccountBelongsToBusiness;
    private assertOptionalBranchBelongsToBusiness;
    private assertUserBelongsToBusiness;
    private validateIntent;
    private validateStatus;
    private parsePositiveInteger;
    private parseOptionalPositiveInteger;
    private parseRequiredDate;
    private parseOptionalDate;
    private parseNullableDate;
    private assertJsonObject;
    private isJsonObject;
    private isUniqueViolation;
}
