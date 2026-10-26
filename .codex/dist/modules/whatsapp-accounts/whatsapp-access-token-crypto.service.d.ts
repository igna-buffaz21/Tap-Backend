import { ConfigService } from '@nestjs/config';
export declare class WhatsappAccessTokenCryptoService {
    private readonly configService;
    private encryptionKey;
    constructor(configService: ConfigService);
    encrypt(token: string): string;
    decrypt(token: string): string;
    isEncrypted(token: string): boolean;
    private getEncryptionKey;
    private parseEncryptionKey;
    private safeStringEquals;
}
