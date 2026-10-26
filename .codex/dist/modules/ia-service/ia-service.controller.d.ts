import { InterpretWhatsappMessageDto } from './dto/interpret-whatsapp-message.dto';
import { IaServiceService } from './ia-service.service';
export declare class IaServiceController {
    private readonly iaServiceService;
    constructor(iaServiceService: IaServiceService);
    interpretWhatsappMessage(interpretWhatsappMessageDto: InterpretWhatsappMessageDto): Promise<import("./ia-service.types").IaWhatsappMessageInterpretation>;
}
