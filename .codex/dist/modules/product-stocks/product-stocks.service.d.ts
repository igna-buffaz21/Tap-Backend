import { User } from '../users/entities/user.entity';
import { ProductStocksRepository } from './product-stocks.repository';
export declare class ProductStocksService {
    private readonly productStocksRepository;
    constructor(productStocksRepository: ProductStocksRepository);
    findAllForBusiness(currentUser: User, branchIdValue?: unknown, productIdValue?: unknown): Promise<import("./entities/product-stock.entity").ProductStock[]>;
    getStatsForBusiness(currentUser: User, branchIdValue?: unknown): Promise<import("./entities/product-stock-stats.entity").ProductStockStats>;
    findOneForBusiness(id: number, currentUser: User): Promise<import("./entities/product-stock.entity").ProductStock>;
    private resolveStockAccess;
    private requireBusinessUserBusinessId;
    private assertBranchBelongsToBusiness;
    private assertProductBelongsToBusiness;
    private parsePositiveInteger;
    private parseOptionalPositiveInteger;
}
