"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const database_module_1 = require("./database/database.module");
const clerk_auth_guard_1 = require("./modules/auth/guards/clerk-auth.guard");
const permission_guard_1 = require("./modules/auth/guards/permission.guard");
const ia_service_module_1 = require("./modules/ia-service/ia-service.module");
const availability_module_1 = require("./modules/availability/availability.module");
const auth_module_1 = require("./modules/auth/auth.module");
const bookings_module_1 = require("./modules/bookings/bookings.module");
const branches_module_1 = require("./modules/branches/branches.module");
const businesses_module_1 = require("./modules/businesses/businesses.module");
const customers_module_1 = require("./modules/customers/customers.module");
const payments_module_1 = require("./modules/payments/payments.module");
const product_categories_module_1 = require("./modules/product-categories/product-categories.module");
const product_stocks_module_1 = require("./modules/product-stocks/product-stocks.module");
const products_module_1 = require("./modules/products/products.module");
const permissions_module_1 = require("./modules/permissions/permissions.module");
const public_booking_module_1 = require("./modules/public-booking/public-booking.module");
const recurring_bookings_module_1 = require("./modules/recurring-bookings/recurring-bookings.module");
const reminders_module_1 = require("./modules/reminders/reminders.module");
const resource_blocks_module_1 = require("./modules/resource-blocks/resource-blocks.module");
const resource_schedules_module_1 = require("./modules/resource-schedules/resource-schedules.module");
const resource_services_module_1 = require("./modules/resource-services/resource-services.module");
const resources_module_1 = require("./modules/resources/resources.module");
const roles_module_1 = require("./modules/roles/roles.module");
const services_module_1 = require("./modules/services/services.module");
const stock_movements_module_1 = require("./modules/stock-movements/stock-movements.module");
const user_resources_module_1 = require("./modules/user-resources/user-resources.module");
const user_roles_module_1 = require("./modules/user-roles/user-roles.module");
const users_module_1 = require("./modules/users/users.module");
const whatsapp_accounts_module_1 = require("./modules/whatsapp-accounts/whatsapp-accounts.module");
const whatsapp_conversation_module_1 = require("./modules/whatsapp-conversation/whatsapp-conversation.module");
const whatsapp_message_module_1 = require("./modules/whatsapp-message/whatsapp-message.module");
const whatsapp_service_module_1 = require("./modules/whatsapp-service/whatsapp-service.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                cache: true,
            }),
            throttler_1.ThrottlerModule.forRoot({
                throttlers: [
                    {
                        ttl: 60000,
                        limit: Number(process.env.RATE_LIMIT ?? 100),
                    },
                ],
            }),
            database_module_1.DatabaseModule,
            auth_module_1.AuthModule,
            ia_service_module_1.IaServiceModule,
            users_module_1.UsersModule,
            businesses_module_1.BusinessesModule,
            branches_module_1.BranchesModule,
            whatsapp_accounts_module_1.WhatsappAccountsModule,
            whatsapp_conversation_module_1.WhatsappConversationModule,
            whatsapp_message_module_1.WhatsappMessageModule,
            whatsapp_service_module_1.WhatsappServiceModule,
            customers_module_1.CustomersModule,
            resources_module_1.ResourcesModule,
            resource_services_module_1.ResourceServicesModule,
            resource_schedules_module_1.ResourceSchedulesModule,
            resource_blocks_module_1.ResourceBlocksModule,
            services_module_1.ServicesModule,
            product_categories_module_1.ProductCategoriesModule,
            products_module_1.ProductsModule,
            product_stocks_module_1.ProductStocksModule,
            stock_movements_module_1.StockMovementsModule,
            permissions_module_1.PermissionsModule,
            roles_module_1.RolesModule,
            user_roles_module_1.UserRolesModule,
            user_resources_module_1.UserResourcesModule,
            availability_module_1.AvailabilityModule,
            bookings_module_1.BookingsModule,
            payments_module_1.PaymentsModule,
            reminders_module_1.RemindersModule,
            recurring_bookings_module_1.RecurringBookingsModule,
            public_booking_module_1.PublicBookingModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: clerk_auth_guard_1.ClerkAuthGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: permission_guard_1.PermissionGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
            app_service_1.AppService,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map