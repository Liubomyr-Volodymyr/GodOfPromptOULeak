import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

import { CONFIG_DB } from './src/config/enums';

config();
const configService = new ConfigService();

const options: DataSourceOptions = {
	type: 'postgres',
	host: configService.get(CONFIG_DB.HOST),
	port: configService.get(CONFIG_DB.PORT),
	username: configService.get(CONFIG_DB.USERNAME),
	password: configService.get(CONFIG_DB.PASSWORD),
	database: configService.get(CONFIG_DB.DB),
	entities: ['src/**/*.entity.ts'],
	migrations: ['migrations/*.ts'],
};

export default new DataSource(options);
