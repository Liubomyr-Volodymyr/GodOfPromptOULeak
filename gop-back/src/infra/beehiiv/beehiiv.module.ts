import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BeehiivService } from './beehiiv.service';

@Global()
@Module({
	imports: [ConfigModule],
	providers: [BeehiivService],
	exports: [BeehiivService],
})
export class BeehiivModule {}
