import { User } from '../users/entities/user.entity';
import { BusinessesService } from './businesses.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
export declare class BusinessesController {
    private readonly businessesService;
    constructor(businessesService: BusinessesService);
    create(createBusinessDto: CreateBusinessDto): Promise<import("./entities/business.entity").Business>;
    findAll(): Promise<import("./entities/business.entity").Business[]>;
    findOne(id: string): Promise<import("./entities/business.entity").Business | null>;
    update(id: string, updateBusinessDto: UpdateBusinessDto, currentUser: User): Promise<import("./entities/business.entity").Business | null>;
    remove(id: string): Promise<boolean>;
}
