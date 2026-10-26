import { WhatsappMessageStatus } from '../entities/whatsapp-message.entity';
export declare class UpdateWhatsappMessageProviderIdDto {
    businessId: number;
    providerMessageId: string;
}
export declare class UpdateWhatsappMessageStatusDto {
    businessId: number;
    providerMessageId: string;
    status: WhatsappMessageStatus.SENT | WhatsappMessageStatus.DELIVERED | WhatsappMessageStatus.READ | WhatsappMessageStatus.FAILED;
}
