import * as dotenv from 'dotenv';
dotenv.config();
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { GlobalPipesConfig } from './common/pipes/global.pipe';
import { LoggerService } from './infra/logger/services/logger.service';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { CONFIG } from './config/enums';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BillingModule } from './modules/billing/billing.module';
import { LeadsModule } from './modules/leads/leads.module';
import { GotenbergModule } from './modules/gotenberg/gotenberg.module';
import { QdrantModule } from './modules/qdrant/qdrant.module';
import { AdminModule } from './admin/admin.module';
import { GeneratorModule } from './modules/generator/generator.module';
import { NotionModule } from './modules/notion/notion.module';
import { PromptsModule } from './modules/prompts/prompts.module';
import { AdminPromptsModule } from './admin/modules/prompts/admin-prompts.module';
import { EngagementModule } from './admin/modules/engagement/engagement.module';
import { ProductsModule } from './modules/products/products.module';
import { BlogModule } from './modules/blog/blog.module';
import { ReviewsModule } from './modules/reviews/reviews.module';

async function start() {
	const PORT = Number(process.env.APP_PORT) || 5000;
	const app = await NestFactory.create<NestExpressApplication>(AppModule, {
		snapshot: true,
		rawBody: true,
	});

	app.set('trust proxy', 1);
	app.useBodyParser('json', { limit: '25mb' });
	app.useBodyParser('urlencoded', { limit: '25mb', extended: true });
	app.setGlobalPrefix('api');

	if (process.env[CONFIG.NODE_ENV] !== 'production') {
		const config = new DocumentBuilder()
			.setTitle('God of Prompt API')
			.setVersion(`${process.env[CONFIG.NODE_ENV]}`)
			.setDescription(
				'A NestJS-based application for prompt management and generation with PostgreSQL database and Redis for job queue processing.',
			)
			.addBearerAuth(
				{
					type: 'http',
					scheme: 'bearer',
					bearerFormat: 'JWT',
					name: 'Authorization',
					description: 'Paste your access token here',
					in: 'header',
				},
				'access_token',
			)
			.addTag('Auth')
			.addTag('Users')
			.build();

		const groups: Record<string, any[]> = {
			default: [AuthModule, UsersModule, BillingModule, LeadsModule, GotenbergModule, QdrantModule, AdminModule],
			admin: [AdminModule, AdminPromptsModule, EngagementModule, ProductsModule, BlogModule],
			generator: [GeneratorModule],
			notion: [NotionModule],
			prompts: [PromptsModule, AdminPromptsModule],
			products: [ProductsModule],
			reviews: [ReviewsModule],
		};

		const urls: { url: string; name: string }[] = [];
		for (const [slug, mods] of Object.entries(groups)) {
			const doc = SwaggerModule.createDocument(app, config, { include: mods, deepScanRoutes: true });
			SwaggerModule.setup(`api/docs/${slug}`, app, doc, {
				jsonDocumentUrl: `api/docs/${slug}/json`,
				customSiteTitle: `GoP API — ${slug}`,
			});
			urls.push({ url: `/api/docs/${slug}/json`, name: slug });
		}

		const fullDoc = SwaggerModule.createDocument(app, config);
		SwaggerModule.setup('api/docs', app, fullDoc, {
			jsonDocumentUrl: 'api/docs/json',
			customSiteTitle: 'GoP API Docs',
			swaggerOptions: { urls: [{ url: '/api/docs/json', name: 'all' }, ...urls] },
		});

		const plbModules = [...new Set(Object.values(groups).flat())].filter((m) => m !== AuthModule && m !== UsersModule);
		const plbConfig = new DocumentBuilder()
			.setTitle('GoP Prompts API')
			.setVersion(`${process.env[CONFIG.NODE_ENV]}`)
			.addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT', name: 'Authorization', in: 'header' }, 'access_token')
			.build();
		const plbDoc = SwaggerModule.createDocument(app, plbConfig, { include: plbModules, deepScanRoutes: true });
		SwaggerModule.setup('api/docs/plb', app, plbDoc, {
			jsonDocumentUrl: 'api/docs/plb/json',
			customSiteTitle: 'GoP Prompts API',
			swaggerOptions: { tagsSorter: 'alpha', operationsSorter: 'alpha' },
		});
	}

	const logger = app.get(LoggerService);
	app.useGlobalFilters(new AllExceptionsFilter(logger));
	app.useGlobalPipes(GlobalPipesConfig);

	// First-party frontends that must always be able to call this API from the
	// browser. Kept in code — not only in ALLOWED_ORIGINS — because a missing or
	// partial env var on a deploy breaks every client-side call with an opaque
	// "Failed to fetch" and no server-side trace. ALLOWED_ORIGINS still adds
	// extra origins (previews, localhost) on top of these.
	const FIRST_PARTY_ORIGINS = ['https://development.godofprompt.ai', 'https://godofprompt.ai', 'https://www.godofprompt.ai'];

	const ALLOWED_ORIGINS = Array.from(
		new Set([
			...(process.env.ALLOWED_ORIGINS ?? '')
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean),
			...FIRST_PARTY_ORIGINS,
		]),
	);

	app.enableCors({
		origin: ALLOWED_ORIGINS,
		methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
		allowedHeaders: 'Content-Type, Accept, Authorization, X-Requested-With',
		credentials: true,
	});

	await app.listen(PORT, () => console.info('\x1b[34m%s\x1b[0m', `Server started on port = ${PORT}`));
}
void start();
