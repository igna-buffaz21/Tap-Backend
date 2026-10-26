import { DatabaseService } from '../../database/database.service';
import { CreateWhatsappAccountDto } from './dto/create-whatsapp-account.dto';
import { UpdateWhatsappAccountDto } from './dto/update-whatsapp-account.dto';
import { WhatsappAccount } from './entities/whatsapp-account.entity';
export declare class WhatsappAccountsRepository {
    private readonly databaseService;
    constructor(databaseService: DatabaseService);
    create(createWhatsappAccountDto: CreateWhatsappAccountDto): Promise<WhatsappAccount>;
    findAll(): Promise<WhatsappAccount[]>;
    findById(id: number): Promise<WhatsappAccount | null>;
    findByWebhookReference(displayPhoneNumber: string, phoneNumberId: string, wabaId: string): Promise<WhatsappAccount | null>;
    findByPhoneNumber(phoneNumber: string): Promise<WhatsappAccount | null>;
    findActiveById(id: number): Promise<WhatsappAccount | null>;
    findActiveByBusinessId(businessId: number): Promise<WhatsappAccount[]>;
    businessExists(businessId: number): Promise<boolean>;
    branchBelongsToBusiness(branchId: number, businessId: number): Promise<boolean>;
    update(id: number, updateWhatsappAccountDto: UpdateWhatsappAccountDto): Promise<WhatsappAccount | null>;
    remove(id: number): Promise<boolean>;
}
