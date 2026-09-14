import { Module } from '@nestjs/common';
import { CsvService } from './services/csv.service';

@Module({
	controllers: [],
	providers: [CsvService],
	imports: [],
	exports: [CsvService],
})
export class CsvModule {}
