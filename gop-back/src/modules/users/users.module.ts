import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.service';
import { UserMediaService } from './services/user-media.service';
import { UserIdentityService } from './services/user-identity.service';
import { UsersVerificationService } from './services/users-verification.service';
import { SegmentsModule } from '../segments/segments.module';
import { UserEmails } from './entities/user-emails.entity';
import { User } from './entities/users.entity';
import { UserVerification } from './entities/user-verification.entity';
import { UserProducts } from '../user-products/entities/user-products.entity';
import { MinioModule } from '../minio/minio.module';

@Module({
	imports: [TypeOrmModule.forFeature([User, UserVerification, UserEmails, UserProducts]), MinioModule, SegmentsModule],
	controllers: [UsersController],
	providers: [UsersService, UserMediaService, UserIdentityService, UsersVerificationService],
	exports: [UsersService, UsersVerificationService, UserIdentityService],
})
export class UsersModule {}
