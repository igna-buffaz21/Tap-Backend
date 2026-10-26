import { DatabaseService } from '../../database/database.service';
import { JsonObject, WhatsappConversation, WhatsappConversationIntent, WhatsappConversationStatus } from './entities/whatsapp-conversation.entity';
export declare const ACTIVE_WHATSAPP_CONVERSATION_STATUSES: readonly [WhatsappConversationStatus.ACTIVE, WhatsappConversationStatus.HUMAN_REQUIRED, WhatsappConversationStatus.HUMAN_ACTIVE];
export interface CreateWhatsappConversationRecord {
    whatsappAccountId: number;
    businessId: number;
    branchId: number | null;
    customerId: number;
    lastMessageAt: Date;
    expiresAt: Date | null;
}
export interface UpdateWhatsappConversationStateRecord {
    intent?: WhatsappConversationIntent;
    status?: WhatsappConversationStatus;
    context?: JsonObject;
    branchId?: number | null;
    assignedUserId?: number | null;
    lastMessageAt?: Date;
    expiresAt?: Date | null;
}
export declare class WhatsappConversationRepository {
    private readonly databaseService;
    constructor(databaseService: DatabaseService);
    findActiveConversation(whatsappAccountId: number, customerId: number): Promise<WhatsappConversation | null>;
    create(record: CreateWhatsappConversationRecord): Promise<WhatsappConversation>;
    findById(id: number, businessId?: number): Promise<WhatsappConversation | null>;
    updateState(id: number, businessId: number, updates: UpdateWhatsappConversationStateRecord): Promise<WhatsappConversation | null>;
    whatsappAccountBelongsToBusiness(whatsappAccountId: number, businessId: number): Promise<boolean>;
    branchBelongsToBusiness(branchId: number, businessId: number): Promise<boolean>;
    userBelongsToBusiness(userId: number, businessId: number): Promise<boolean>;
}
