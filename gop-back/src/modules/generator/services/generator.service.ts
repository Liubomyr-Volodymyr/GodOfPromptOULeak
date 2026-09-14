import { Injectable } from '@nestjs/common';

@Injectable()
export class GeneratorService {
	startTimer(): (label: string) => number {
		const initialTime = process.hrtime();
		let stepStartTime = process.hrtime();

		return (label: string): number => {
			const stepDiff = process.hrtime(stepStartTime);
			console.log(`${label} took: ${(stepDiff[0] + stepDiff[1] / 1e9).toFixed(2)}s`);
			const totalDiff = process.hrtime(initialTime);
			stepStartTime = process.hrtime();
			return Number((totalDiff[0] + totalDiff[1] / 1e9).toFixed(2));
		};
	}
}
