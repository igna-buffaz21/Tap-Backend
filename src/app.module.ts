import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ClerkAuthGuard } from './modules/auth/guards/clerk-auth.guard';
import { AuthModule } from './modules/auth/auth.module';
import { BranchesModule } from './modules/branches/branches.module';
import { BusinessesModule } from './modules/businesses/businesses.module';
import { CustomersModule } from './modules/customers/customers.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ProductCategoriesModule } from './modules/product-categories/product-categories.module';
import { ProductIdentificationsModule } from './modules/product-identifications/product-identifications.module';
import { ProductStocksModule } from './modules/product-stocks/product-stocks.module';
import { ProductsModule } from './modules/products/products.module';
import { StockMovementsModule } from './modules/stock-movements/stock-movements.module';
import { SalesModule } from './modules/sales/sales.module';
import { UsersModule } from './modules/users/users.module';
import { Esp32Module } from './modules/esp32/esp32.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: Number(process.env.RATE_LIMIT ?? 100),
        },
      ],
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    BusinessesModule,
    BranchesModule,
    CustomersModule,
    ProductCategoriesModule,
    ProductsModule,
    ProductIdentificationsModule,
    ProductStocksModule,
    StockMovementsModule,
    SalesModule,
    PaymentsModule,
    Esp32Module.forApi(),
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ClerkAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    AppService,
  ],
})
export class AppModule {}
