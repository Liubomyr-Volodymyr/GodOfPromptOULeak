import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevtoolsModule } from '@nestjs/devtools-integration';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { RequestLoggerInterceptor } from './common/interceptors/request-logger.interceptor';
import { LoggerModule } from './infra/logger/logger.module';
import { MailerModule } from './infra/mailer/mailer.module';
import { QdrantModule } from './modules/qdrant/qdrant.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { configValidationSchema } from './config/config.schema';
import { GeneratorModule } from './modules/generator/generator.module';
import { CONFIG_DB } from './config/enums';
import { AdminModule } from './admin/admin.module';
import { ActivityModule } from './modules/activity/activity.module';
import { ActivityInterceptor } from './modules/activity/activity.interceptor';
import { UserProductsModule } from './modules/user-products/user-products.module';
import { BillingModule } from './modules/billing/billing.module';
import { BeehiivModule } from './infra/beehiiv/beehiiv.module';
import { PromptsModule } from './modules/prompts/prompts.module';
import { LeadsModule } from './modules/leads/leads.module';
import { ProductsModule } from './modules/products/products.module';
import { BlogModule } from './modules/blog/blog.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { MailModule } from './modules/mail/mail.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
	imports: [
		DevtoolsModule.register({
			http: process.env.NODE_ENV !== 'production',
			port: 8000,
		}),
		TypeOrmModule.forRoot({
			type: 'postgres',
			host: process.env[CONFIG_DB.HOST],
			port: Number(process.env[CONFIG_DB.PORT]),
			username: process.env[CONFIG_DB.USERNAME],
			password: process.env[CONFIG_DB.PASSWORD],
			database: process.env[CONFIG_DB.DB],
			entities: [__dirname + '/**/*.entity{.ts,.js}'],
			autoLoadEntities: false,
			synchronize: false,
		}),
		BullModule.forRoot({
			redis: {
				host: process.env.REDIS_HOST || 'redis',
				port: 6379,
				username: process.env.REDIS_USER,
				password: process.env.REDIS_PASSWORD,
				family: 0,
			},
		}),
		ThrottlerModule.forRoot({
			throttlers: [
				{
					ttl: 60000,
					limit: 100,
				},
			],
		}),
		ConfigModule.forRoot({
			isGlobal: true,
			validationSchema: configValidationSchema,
		}),
		ScheduleModule.forRoot(),
		LoggerModule,
		MailerModule,
		BeehiivModule,
		QdrantModule,
		ActivityModule,
		AuthModule,
		BillingModule,
		UsersModule,
		AdminModule,
		PromptsModule,
		GeneratorModule,
		UserProductsModule,
		LeadsModule,
		ProductsModule,
		BlogModule,
		ReviewsModule,
		MailModule,
		NotificationsModule,
	],
	providers: [
		{
			provide: APP_GUARD,
			useClass: ThrottlerGuard,
		},
		{
			provide: APP_INTERCEPTOR,
			useClass: RequestLoggerInterceptor,
		},
		{
			provide: APP_INTERCEPTOR,
			useClass: ActivityInterceptor,
		},
	],
})
export class AppModule {}
