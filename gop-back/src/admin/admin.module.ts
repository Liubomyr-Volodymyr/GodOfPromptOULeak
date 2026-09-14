import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { AuthAdminModule } from './modules/auth/auth.module';
import { MembersModule } from './modules/members/members.module';
import { AdminsModule } from './modules/admins/admins.module';
import { AdminPromptsModule } from './modules/prompts/admin-prompts.module';
import { StatsModule } from './modules/stats/stats.module';
import { AdminMediaModule } from './modules/media/media.module';
import { EngagementModule } from './modules/engagement/engagement.module';
import { AdminOrdersModule } from './modules/orders/admin-orders.module';
import { AdminSeeder } from './infra/seeds/admin.seed';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admins } from './entities/admins.entity';

@Module({
	imports: [
		TypeOrmModule.forFeature([Admins]),
		AuthAdminModule,
		MembersModule,
		AdminsModule,
		AdminPromptsModule,
		StatsModule,
		AdminMediaModule,
		EngagementModule,
		AdminOrdersModule,
		RouterModule.register([
			{ path: 'admin/auth', module: AuthAdminModule },
			{ path: 'admin/members', module: MembersModule },
			{ path: 'admin/admins', module: AdminsModule },
			{ path: 'admin/prompts', module: AdminPromptsModule },
			{ path: 'admin/stats', module: StatsModule },
			{ path: 'admin/media', module: AdminMediaModule },
			{ path: 'admin/engagement', module: EngagementModule },
			{ path: 'admin/orders', module: AdminOrdersModule },
		]),
	],
	providers: [AdminSeeder],
})
export class AdminModule {}
