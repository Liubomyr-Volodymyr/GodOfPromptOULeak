import { ErrorLogData } from './dto/logger.dto';

export interface IAppLogger {
	info(message: string): void;
	error(error: ErrorLogData): void;
}
