import { Injectable } from '@nestjs/common';
import { AuthorizationScopeService } from '../auth/authorization-scope.service';
import { User } from '../users/entities/user.entity';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { BusinessesRepository } from './businesses.repository';

@Injectable()
export class BusinessesService {
  constructor(
    private readonly businessesRepository: BusinessesRepository,
    private readonly authorizationScope: AuthorizationScopeService,
  ) {}

  create(createBusinessDto: CreateBusinessDto) {
    return this.businessesRepository.create(createBusinessDto);
  }

  async findAll(currentUser: User) {
    const business = await this.businessesRepository.findById(
      this.authorizationScope.resolveBusinessId(currentUser),
    );
    return business ? [business] : [];
  }

  findOne(id: number, currentUser: User) {
    const businessId = this.authorizationScope.resolveBusinessId(currentUser, id);
    return this.businessesRepository.findById(businessId);
  }

  update(id: number, updateBusinessDto: UpdateBusinessDto, currentUser: User) {
    this.authorizationScope.resolveBusinessId(currentUser, id);

    return this.businessesRepository.update(id, updateBusinessDto);
  }

  remove(id: number, currentUser: User) {
    this.authorizationScope.resolveBusinessId(currentUser, id);
    return this.businessesRepository.remove(id);
  }
}
