import { OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PoolClient, QueryResult, QueryResultRow } from 'pg';
export declare class DatabaseService implements OnModuleInit, OnApplicationShutdown {
    private readonly configService;
    private readonly logger;
    private readonly pool;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    query<T extends QueryResultRow = QueryResultRow>(text: string, values?: unknown[]): Promise<QueryResult<T>>;
    getClient(): Promise<PoolClient>;
    withTransaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T>;
    testConnection(): Promise<void>;
    onApplicationShutdown(): Promise<void>;
}
