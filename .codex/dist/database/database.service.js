"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DatabaseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const pg_1 = require("pg");
let DatabaseService = DatabaseService_1 = class DatabaseService {
    configService;
    logger = new common_1.Logger(DatabaseService_1.name);
    pool;
    constructor(configService) {
        this.configService = configService;
        const sslEnabled = this.configService.get('DB_SSL') === 'true';
        this.pool = new pg_1.Pool({
            host: this.configService.getOrThrow('DB_HOST'),
            port: Number(this.configService.getOrThrow('DB_PORT')),
            user: this.configService.getOrThrow('DB_USER'),
            password: this.configService.getOrThrow('DB_PASSWORD'),
            database: this.configService.getOrThrow('DB_NAME'),
            ssl: sslEnabled
                ? {
                    rejectUnauthorized: false,
                }
                : false,
            max: 10,
            idleTimeoutMillis: 30_000,
            connectionTimeoutMillis: 5_000,
        });
        this.pool.on('error', (error) => {
            this.logger.error('Error inesperado en una conexión inactiva de PostgreSQL', error.stack);
        });
    }
    async onModuleInit() {
        await this.testConnection();
    }
    async query(text, values = []) {
        return this.pool.query(text, values);
    }
    async getClient() {
        return this.pool.connect();
    }
    async withTransaction(work) {
        const client = await this.getClient();
        try {
            await client.query('BEGIN');
            const result = await work(client);
            await client.query('COMMIT');
            return result;
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    async testConnection() {
        try {
            const result = await this.pool.query(`
        SELECT
          current_database(),
          NOW() AS current_time
      `);
            this.logger.log(`Conectado a PostgreSQL: ${result.rows[0].current_database}`);
        }
        catch (error) {
            this.logger.error('No se pudo conectar a PostgreSQL', error instanceof Error ? error.stack : String(error));
            throw error;
        }
    }
    async onApplicationShutdown() {
        await this.pool.end();
        this.logger.log('Pool de PostgreSQL cerrado');
    }
};
exports.DatabaseService = DatabaseService;
exports.DatabaseService = DatabaseService = DatabaseService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], DatabaseService);
//# sourceMappingURL=database.service.js.map