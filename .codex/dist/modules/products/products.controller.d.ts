import { User } from '../users/entities/user.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductStatusDto } from './dto/update-product-status.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    create(createProductDto: CreateProductDto, currentUser: User): Promise<import("./entities/product.entity").Product>;
    findAll(currentUser: User): Promise<import("./entities/product.entity").Product[]>;
    findOne(id: string, currentUser: User): Promise<import("./entities/product.entity").Product>;
    update(id: string, updateProductDto: UpdateProductDto, currentUser: User): Promise<import("./entities/product.entity").Product>;
    updateStatus(id: string, updateStatusDto: UpdateProductStatusDto, currentUser: User): Promise<import("./entities/product.entity").Product>;
}
