import { ForbiddenException, Injectable } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { BusinessesRepository } from './businesses.repository';

@Injectable()
export class BusinessesService {
  constructor(private readonly businessesRepository: BusinessesRepository) {}

  create(createBusinessDto: CreateBusinessDto) {
    return this.businessesRepository.create(createBusinessDto);
  }

  findAll() {
    return this.businessesRepository.findAll();
  }

  findOne(id: number) {
    return this.businessesRepository.findById(id);
  }

  update(id: number, updateBusinessDto: UpdateBusinessDto, currentUser: User) {
    this.assertCanUpdateBusiness(id, currentUser);

    return this.businessesRepository.update(id, updateBusinessDto);
  }

  remove(id: number) {
    return this.businessesRepository.remove(id);
  }

  private assertCanUpdateBusiness(id: number, currentUser: User): void {
    const authorization = currentUser.authorization;

    if (!authorization) {
      throw new ForbiddenException('Authorization context is required');
    }

    if (authorization.isSuperadmin) {
      return;
    }

    if (authorization.permissions['business.settings'] !== 'business') {
      throw new ForbiddenException('Business scope is required');
    }

    if (!authorization.businessId) {
      throw new ForbiddenException('User must belong to a business');
    }

    if (authorization.businessId !== id) {
      throw new ForbiddenException('Cannot access another business');
    }
  }
}
