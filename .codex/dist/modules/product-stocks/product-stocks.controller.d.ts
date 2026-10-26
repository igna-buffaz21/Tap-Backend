import { User } from '../users/entities/user.entity';
import { ProductStocksService } from './product-stocks.service';
export declare class ProductStocksController {
    private readonly productStocksService;
    constructor(productStocksService: ProductStocksService);
    findAll(currentUser: User, branchId?: string, productId?: string): Promise<import("./entities/product-stock.entity").ProductStock[]>;
    getStats(currentUser: User, branchId?: string): Promise<import("./entities/product-stock-stats.entity").ProductStockStats>;
    findOne(id: string, currentUser: User): Promise<import("./entities/product-stock.entity").ProductStock>;
}
