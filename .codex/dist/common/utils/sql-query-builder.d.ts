type QueryPayload = object;
interface BuiltQuery {
    query: string;
    values: unknown[];
}
export declare function buildUpdateQuery(tableName: string, payload: QueryPayload, allowedColumns: readonly string[], id: number): BuiltQuery | null;
export {};
