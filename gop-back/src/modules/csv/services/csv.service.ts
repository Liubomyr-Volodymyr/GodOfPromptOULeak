import { Injectable } from '@nestjs/common';
import { CreateCsvAttrs } from '../dto/csv.dto';

@Injectable()
export class CsvService {
	constructor() {}

	createCSV(dataArray: CreateCsvAttrs[]): Buffer {
		try {
			const headers = ['Task', 'Prompt Name', 'Prompt', 'Example Input'];

			const rows = dataArray.map((data) =>
				[
					this.escapeCSV(data.task),
					this.escapeCSV(data['prompt-name']),
					this.escapeCSV(data.prompt),
				].join(','),
			);

			const csvContent = [headers.join(','), ...rows].join('\n');

			return Buffer.from('\ufeff' + csvContent, 'utf8');
		} catch (error) {
			console.error('Failed to create CSV:', error);
			throw new Error(`Failed to create CSV: ${error.message}`);
		}
	}

	private escapeCSV(value: string): string {
		if (!value) return '""';
		const escaped = value.replace(/"/g, '""');
		const needsQuotes = /[,\n"]/.test(value);
		return needsQuotes ? `"${escaped}"` : escaped;
	}
}
