import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CompletePaymentDto } from './dto/complete-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@ApiTags('payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({
    summary: 'Registrar pago',
    description: 'Registra un pago de venta.',
  })
  @ApiBody({ type: CreatePaymentDto })
  create(
    @Body() createPaymentDto: CreatePaymentDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.paymentsService.createForBusiness(
      createPaymentDto,
      currentUser,
    );
  }

  @Post('complete')
  @ApiOperation({
    summary: 'Completar saldo pendiente de una venta',
    description: 'Calcula el saldo pendiente y registra un pago COMPLETED.',
  })
  @ApiBody({ type: CompletePaymentDto })
  complete(
    @Body() completePaymentDto: CompletePaymentDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.paymentsService.completeForBusiness(
      completePaymentDto,
      currentUser,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Listar pagos' })
  findAll(@CurrentUser() currentUser: User) {
    return this.paymentsService.findAllForBusiness(currentUser);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener pago por id' })
  @ApiParam({ name: 'id', example: 1 })
  findOne(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.paymentsService.findOneForBusiness(+id, currentUser);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar o confirmar un pago pendiente',
  })
  @ApiBody({ type: UpdatePaymentDto })
  update(
    @Param('id') id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.paymentsService.updateForBusiness(
      +id,
      updatePaymentDto,
      currentUser,
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar un pago pendiente o cancelado',
  })
  @ApiParam({ name: 'id', example: 1 })
  remove(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.paymentsService.removeForBusiness(+id, currentUser);
  }
}
