import { User } from '../users/entities/user.entity';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { BusinessesRepository } from './businesses.repository';
export declare class BusinessesService {
    private readonly businessesRepository;
    constructor(businessesRepository: BusinessesRepository);
    create(createBusinessDto: CreateBusinessDto): Promise<import("./entities/business.entity").Business>;
    findAll(): Promise<import("./entities/business.entity").Business[]>;
    findOne(id: number): Promise<import("./entities/business.entity").Business | null>;
    update(id: number, updateBusinessDto: UpdateBusinessDto, currentUser: User): Promise<import("./entities/business.entity").Business | null>;
    remove(id: number): Promise<boolean>;
    private assertCanUpdateBusiness;
}
