import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly pool: Pool;

  constructor(private readonly configService: ConfigService) {
    const sslEnabled = this.configService.get<string>('DB_SSL') === 'true';

    this.pool = new Pool({
      host: this.configService.getOrThrow<string>('DB_HOST'),
      port: Number(this.configService.getOrThrow<string>('DB_PORT')),
      user: this.configService.getOrThrow<string>('DB_USER'),
      password: this.configService.getOrThrow<string>('DB_PASSWORD'),
      database: this.configService.getOrThrow<string>('DB_NAME'),

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
      this.logger.error(
        'Error inesperado en una conexión inactiva de PostgreSQL',
        error.stack,
      );
    });
  }

  async onModuleInit(): Promise<void> {
    await this.testConnection();
  }

  async query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values: unknown[] = [],
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, values);
  }

  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  async withTransaction<T>(
    work: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await this.getClient();

    try {
      await client.query('BEGIN');
      const result = await work(client);
      await client.query('COMMIT');

      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async testConnection(): Promise<void> {
    try {
      const result = await this.pool.query<{
        current_database: string;
        current_time: Date;
      }>(`
        SELECT
          current_database(),
          NOW() AS current_time
      `);

      this.logger.log(
        `Conectado a PostgreSQL: ${result.rows[0].current_database}`,
      );
    } catch (error) {
      this.logger.error(
        'No se pudo conectar a PostgreSQL',
        error instanceof Error ? error.stack : String(error),
      );

      throw error;
    }
  }

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
    this.logger.log('Pool de PostgreSQL cerrado');
  }
}
