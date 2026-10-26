import { User } from '../users/entities/user.entity';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryStatusDto } from './dto/update-product-category-status.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { ProductCategoriesRepository } from './product-categories.repository';
export declare class ProductCategoriesService {
    private readonly productCategoriesRepository;
    constructor(productCategoriesRepository: ProductCategoriesRepository);
    createForBusiness(createCategoryDto: CreateProductCategoryDto, currentUser: User): Promise<import("./entities/product-category.entity").ProductCategory>;
    findAllForBusiness(currentUser: User): Promise<import("./entities/product-category.entity").ProductCategory[]>;
    findOneForBusiness(id: number, currentUser: User): Promise<import("./entities/product-category.entity").ProductCategory>;
    updateForBusiness(id: number, updateCategoryDto: UpdateProductCategoryDto, currentUser: User): Promise<import("./entities/product-category.entity").ProductCategory>;
    updateStatusForBusiness(id: number, updateStatusDto: UpdateProductCategoryStatusDto, currentUser: User): Promise<import("./entities/product-category.entity").ProductCategory>;
    private resolveStockAccess;
    private requireBusinessUserBusinessId;
    private normalizeCreateDto;
    private normalizeUpdateDto;
    private parsePositiveInteger;
    private normalizeRequiredString;
    private normalizeOptionalString;
    private normalizeOptionalStatus;
    private normalizeRequiredStatus;
    private isUniqueViolation;
}
