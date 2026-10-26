import { DatabaseService } from '../../database/database.service';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { StockMovement, StockMovementReason, StockMovementType } from './entities/stock-movement.entity';
export type ApplyStockMovementResult = {
    movement: StockMovement;
} | {
    insufficientStock: true;
} | {
    noStockChange: true;
};
export type StockMovementPage = {
    movements: StockMovement[];
    total: number;
};
export type StockMovementFilters = {
    branchId?: number;
    productId?: number;
    userId?: number;
    categoryId?: number;
    type?: StockMovementType;
};
export type StockMovementPagination = {
    limit: number;
    offset: number;
};
export type StockMovementAccessFilter = {
    allowedBranchIds?: number[];
    createdByUserId?: number;
    ownOnly?: boolean;
};
export type BulkStockMovementItem = {
    product_id: number;
    quantity: number;
    unit_cost: number | null;
};
export type BulkStockMovementPayload = {
    branch_id: number;
    type: Exclude<StockMovementType, 'ADJUSTMENT'>;
    reason: StockMovementReason | null;
    notes: string | null;
    items: BulkStockMovementItem[];
};
export declare class BulkStockMovementInsufficientStockError extends Error {
    readonly productId: number;
    constructor(productId: number);
}
export declare class BulkStockMovementNoStockChangeError extends Error {
    readonly productId: number;
    constructor(productId: number);
}
export declare class StockMovementsRepository {
    private readonly databaseService;
    constructor(databaseService: DatabaseService);
    createAndApply(businessId: number, dto: CreateStockMovementDto, createdByUserId: number): Promise<ApplyStockMovementResult>;
    createBulkAndApply(businessId: number, payload: BulkStockMovementPayload, createdByUserId: number): Promise<StockMovement[]>;
    findAllForBusiness(businessId: number, filters?: StockMovementFilters, pagination?: StockMovementPagination, accessFilter?: StockMovementAccessFilter): Promise<StockMovementPage>;
    findByIdForBusiness(id: number, businessId: number, accessFilter?: StockMovementAccessFilter): Promise<StockMovement | null>;
    branchBelongsToBusiness(branchId: number, businessId: number): Promise<boolean>;
    branchBelongsToBusinessAndAccess(branchId: number, businessId: number, accessFilter?: StockMovementAccessFilter): Promise<boolean>;
    productBelongsToBusiness(productId: number, businessId: number): Promise<boolean>;
    userBelongsToBusiness(userId: number, businessId: number): Promise<boolean>;
    categoryBelongsToBusiness(categoryId: number, businessId: number): Promise<boolean>;
    private findProductStockForUpdate;
    private createProductStockForUpdate;
    private applyMovement;
    private calculateNewQuantity;
    private mapStockMovement;
    private applyAccessFilter;
}
