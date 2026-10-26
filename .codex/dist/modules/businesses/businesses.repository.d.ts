import { DatabaseService } from '../../database/database.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { Business } from './entities/business.entity';
export declare class BusinessesRepository {
    private readonly databaseService;
    constructor(databaseService: DatabaseService);
    create(createBusinessDto: CreateBusinessDto): Promise<Business>;
    findAll(): Promise<Business[]>;
    findById(id: number): Promise<Business | null>;
    update(id: number, updateBusinessDto: UpdateBusinessDto): Promise<Business | null>;
    remove(id: number): Promise<boolean>;
}
