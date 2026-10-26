import { DatabaseService } from '../../database/database.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductStatusDto } from './dto/update-product-status.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
export interface ProductAccessFilter {
    allowedBranchIds?: number[];
}
export declare class ProductsRepository {
    private readonly databaseService;
    constructor(databaseService: DatabaseService);
    create(businessId: number, dto: CreateProductDto): Promise<Product>;
    findAllForBusiness(businessId: number): Promise<Product[]>;
    findByIdForBusiness(id: number, businessId: number): Promise<Product | null>;
    updateForBusiness(id: number, businessId: number, dto: UpdateProductDto | UpdateProductStatusDto): Promise<Product | null>;
    categoryBelongsToBusiness(categoryId: number, businessId: number): Promise<boolean>;
    branchBelongsToBusiness(branchId: number, businessId: number): Promise<boolean>;
    branchBelongsToBusinessAndAccess(branchId: number, businessId: number, accessFilter?: ProductAccessFilter): Promise<boolean>;
    private createProduct;
    private createProductStock;
    private mapProduct;
    private buildBranchAccessCondition;
}
