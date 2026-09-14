import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomGeneratorController } from './controllers/custom-generator.controller';
import { CustomGeneratorService } from './services/custom-generator.service';
import { AIModule } from '../ai/ai.module';
import { CustomPromptEntity } from './entities/custom-prompt.entity';
import { TaskEntity } from './entities/task.entity';
import { MailerModule } from '../../infra/mailer/mailer.module';
import { NotionModule } from '../notion/notion.module';
import { GotenbergModule } from '../gotenberg/gotenberg.module';
import { GoogleDriveModule } from '../google-drive/google-drive.module';
import { CsvModule } from '../csv/csv.module';
import { InternalGeneratorService } from './services/internal-generator.service';
import { MinioModule } from '../minio/minio.module';
import { GeneratorService } from './services/generator.service';
import { InternalGeneratorController } from './controllers/internal-generator.controller';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { AuthModule } from '../auth/auth.module';
import { BillingModule } from '../billing/billing.module';
import { PromptsModule } from '../prompts/prompts.module';
import { PromptsGenerationModule } from './prompts-generation/prompts-generation.module';
import { FieldsGenerationModule } from './fields-generation/fields-generation.module';

@Module({
	controllers: [CustomGeneratorController, InternalGeneratorController],
	providers: [GeneratorService, CustomGeneratorService, InternalGeneratorService],
	imports: [
		TypeOrmModule.forFeature([CustomPromptEntity, TaskEntity]),
		PassportModule,
		AuthModule,
		AIModule,
		MailerModule,
		NotionModule,
		GotenbergModule,
		CsvModule,
		GoogleDriveModule,
		MinioModule,
		PromptsModule,
		UsersModule,
		forwardRef(() => BillingModule),
		PromptsGenerationModule,
		FieldsGenerationModule,
	],
	exports: [TypeOrmModule, CustomGeneratorService, InternalGeneratorService],
})
export class GeneratorModule {}
