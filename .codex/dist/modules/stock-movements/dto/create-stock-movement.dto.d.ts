export declare class CreateStockMovementDto {
    branch_id: number;
    product_id: number;
    type: string;
    quantity?: number;
    unit_cost?: number | null;
    reason?: string | null;
    notes?: string | null;
}
