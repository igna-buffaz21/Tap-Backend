export declare class CreateBulkStockMovementItemDto {
    productId: number;
    quantity: number;
    unitCost?: number | null;
}
export declare class CreateBulkStockMovementDto {
    branchId: number;
    type: string;
    reason?: string | null;
    notes?: string | null;
    items: CreateBulkStockMovementItemDto[];
}
