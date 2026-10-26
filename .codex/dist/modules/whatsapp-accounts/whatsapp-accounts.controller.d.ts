import { WhatsappAccountsService } from './whatsapp-accounts.service';
import { CreateWhatsappAccountDto } from './dto/create-whatsapp-account.dto';
import { UpdateWhatsappAccountDto } from './dto/update-whatsapp-account.dto';
import { UpdateWhatsappAccessTokenDto } from './dto/update-whatsapp-access-token.dto';
import { WhatsappAccount } from './entities/whatsapp-account.entity';
type WhatsappAccountResponse = Omit<WhatsappAccount, 'access_token'> & {
    access_token_configured: boolean;
};
export declare class WhatsappAccountsController {
    private readonly whatsappAccountsService;
    constructor(whatsappAccountsService: WhatsappAccountsService);
    create(createWhatsappAccountDto: CreateWhatsappAccountDto): Promise<WhatsappAccountResponse>;
    findAll(): Promise<WhatsappAccountResponse[]>;
    findOne(id: string): Promise<WhatsappAccountResponse | null>;
    update(id: string, updateWhatsappAccountDto: UpdateWhatsappAccountDto): Promise<WhatsappAccountResponse | null>;
    updateAccessToken(id: string, updateAccessTokenDto: UpdateWhatsappAccessTokenDto): Promise<WhatsappAccountResponse | null>;
    remove(id: string): Promise<boolean>;
    private toNullableResponse;
    private toResponse;
}
export {};
