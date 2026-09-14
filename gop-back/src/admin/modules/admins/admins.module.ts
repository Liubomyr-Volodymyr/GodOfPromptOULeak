import { Module } from '@nestjs/common';
import { AdminsService } from './services/admins.service';
import { AdminsController } from './admins.controller';
import { Admins } from '../../entities/admins.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
	imports: [TypeOrmModule.forFeature([Admins])],
	controllers: [AdminsController],
	providers: [AdminsService],
})
export class AdminsModule {}
