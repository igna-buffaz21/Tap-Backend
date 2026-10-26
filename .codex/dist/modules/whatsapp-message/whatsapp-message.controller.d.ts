import { CreateInboundWhatsappMessageDto, CreateOutboundWhatsappMessageDto } from './dto/create-whatsapp-message.dto';
import { GetWhatsappMessageByProviderIdQueryDto, GetWhatsappMessagesByConversationQueryDto } from './dto/get-whatsapp-message-query.dto';
import { UpdateWhatsappMessageProviderIdDto, UpdateWhatsappMessageStatusDto } from './dto/update-whatsapp-message.dto';
import { WhatsappMessageService } from './whatsapp-message.service';
export declare class WhatsappMessageController {
    private readonly whatsappMessageService;
    constructor(whatsappMessageService: WhatsappMessageService);
    createInboundMessage(createInboundMessageDto: CreateInboundWhatsappMessageDto): Promise<import("./entities/whatsapp-message.entity").WhatsappMessage>;
    createOutboundMessage(createOutboundMessageDto: CreateOutboundWhatsappMessageDto): Promise<import("./entities/whatsapp-message.entity").WhatsappMessage>;
    updateProviderMessageId(id: string, updateProviderIdDto: UpdateWhatsappMessageProviderIdDto): Promise<import("./entities/whatsapp-message.entity").WhatsappMessage>;
    updateMessageStatus(updateStatusDto: UpdateWhatsappMessageStatusDto): Promise<import("./entities/whatsapp-message.entity").WhatsappMessage>;
    findByProviderMessageId(providerMessageId: string, query: GetWhatsappMessageByProviderIdQueryDto): Promise<import("./entities/whatsapp-message.entity").WhatsappMessage | null>;
    findByConversationId(conversationId: string, query: GetWhatsappMessagesByConversationQueryDto): Promise<import("./entities/whatsapp-message.entity").WhatsappMessage[]>;
    findById(id: string, query: GetWhatsappMessageByProviderIdQueryDto): Promise<import("./entities/whatsapp-message.entity").WhatsappMessage | null>;
}
