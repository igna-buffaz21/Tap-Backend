import { DatabaseService } from '../../database/database.service';
import { ProductStockStats } from './entities/product-stock-stats.entity';
import { ProductStock } from './entities/product-stock.entity';
export interface ProductStockAccessFilter {
    allowedBranchIds?: number[];
}
export declare class ProductStocksRepository {
    private readonly databaseService;
    constructor(databaseService: DatabaseService);
    findAllForBusiness(businessId: number, branchId?: number, productId?: number, accessFilter?: ProductStockAccessFilter): Promise<ProductStock[]>;
    getStatsForBusiness(businessId: number, branchId?: number, accessFilter?: ProductStockAccessFilter): Promise<ProductStockStats>;
    findByIdForBusiness(id: number, businessId: number, accessFilter?: ProductStockAccessFilter): Promise<ProductStock | null>;
    branchBelongsToBusiness(branchId: number, businessId: number): Promise<boolean>;
    branchBelongsToBusinessAndAccess(branchId: number, businessId: number, accessFilter?: ProductStockAccessFilter): Promise<boolean>;
    productBelongsToBusiness(productId: number, businessId: number): Promise<boolean>;
    private mapProductStock;
    private mapProductStockStats;
    private applyAllowedBranchFilter;
}
