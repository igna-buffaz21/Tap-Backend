import { CreateWhatsappConversationDto } from './dto/create-whatsapp-conversation.dto';
import { GetActiveWhatsappConversationDto } from './dto/get-active-whatsapp-conversation.dto';
import { AssignHumanDto, BusinessScopedConversationDto, TouchWhatsappConversationDto, UpdateWhatsappConversationContextDto, UpdateWhatsappConversationIntentDto, UpdateWhatsappConversationStateDto } from './dto/update-whatsapp-conversation.dto';
import { WhatsappConversationService } from './whatsapp-conversation.service';
export declare class WhatsappConversationController {
    private readonly whatsappConversationService;
    constructor(whatsappConversationService: WhatsappConversationService);
    create(createWhatsappConversationDto: CreateWhatsappConversationDto): Promise<import("./entities/whatsapp-conversation.entity").WhatsappConversation>;
    getOrCreateActive(createWhatsappConversationDto: CreateWhatsappConversationDto): Promise<import("./entities/whatsapp-conversation.entity").WhatsappConversation>;
    findActive(query: GetActiveWhatsappConversationDto): Promise<import("./entities/whatsapp-conversation.entity").WhatsappConversation | null>;
    findById(id: string, businessId?: string): Promise<import("./entities/whatsapp-conversation.entity").WhatsappConversation | null>;
    updateIntent(id: string, updateIntentDto: UpdateWhatsappConversationIntentDto): Promise<import("./entities/whatsapp-conversation.entity").WhatsappConversation>;
    updateContext(id: string, updateContextDto: UpdateWhatsappConversationContextDto): Promise<import("./entities/whatsapp-conversation.entity").WhatsappConversation>;
    updateState(id: string, updateStateDto: UpdateWhatsappConversationStateDto): Promise<import("./entities/whatsapp-conversation.entity").WhatsappConversation>;
    touch(id: string, touchDto: TouchWhatsappConversationDto): Promise<import("./entities/whatsapp-conversation.entity").WhatsappConversation>;
    complete(id: string, scopedDto: BusinessScopedConversationDto): Promise<import("./entities/whatsapp-conversation.entity").WhatsappConversation>;
    expire(id: string, scopedDto: BusinessScopedConversationDto): Promise<import("./entities/whatsapp-conversation.entity").WhatsappConversation>;
    requireHuman(id: string, scopedDto: BusinessScopedConversationDto): Promise<import("./entities/whatsapp-conversation.entity").WhatsappConversation>;
    assignHuman(id: string, assignHumanDto: AssignHumanDto): Promise<import("./entities/whatsapp-conversation.entity").WhatsappConversation>;
    returnToBot(id: string, scopedDto: BusinessScopedConversationDto): Promise<import("./entities/whatsapp-conversation.entity").WhatsappConversation>;
}
