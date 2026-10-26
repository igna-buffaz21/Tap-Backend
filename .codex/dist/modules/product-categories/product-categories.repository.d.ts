import { DatabaseService } from '../../database/database.service';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryStatusDto } from './dto/update-product-category-status.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { ProductCategory } from './entities/product-category.entity';
export declare class ProductCategoriesRepository {
    private readonly databaseService;
    constructor(databaseService: DatabaseService);
    create(businessId: number, dto: CreateProductCategoryDto): Promise<ProductCategory>;
    findAllForBusiness(businessId: number): Promise<ProductCategory[]>;
    findByIdForBusiness(id: number, businessId: number): Promise<ProductCategory | null>;
    updateForBusiness(id: number, businessId: number, dto: UpdateProductCategoryDto | UpdateProductCategoryStatusDto): Promise<ProductCategory | null>;
}
