import { User } from '../users/entities/user.entity';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryStatusDto } from './dto/update-product-category-status.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { ProductCategoriesService } from './product-categories.service';
export declare class ProductCategoriesController {
    private readonly productCategoriesService;
    constructor(productCategoriesService: ProductCategoriesService);
    create(createCategoryDto: CreateProductCategoryDto, currentUser: User): Promise<import("./entities/product-category.entity").ProductCategory>;
    findAll(currentUser: User): Promise<import("./entities/product-category.entity").ProductCategory[]>;
    findOne(id: string, currentUser: User): Promise<import("./entities/product-category.entity").ProductCategory>;
    update(id: string, updateCategoryDto: UpdateProductCategoryDto, currentUser: User): Promise<import("./entities/product-category.entity").ProductCategory>;
    updateStatus(id: string, updateStatusDto: UpdateProductCategoryStatusDto, currentUser: User): Promise<import("./entities/product-category.entity").ProductCategory>;
}
