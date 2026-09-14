import { Module } from '@nestjs/common';
import { HttpModule as NestHttpModule, HttpService } from '@nestjs/axios';
import { HttpBuilder } from './http.builder';

@Module({
	imports: [NestHttpModule],
	providers: [
		{
			provide: HttpBuilder,
			inject: [HttpService],
			useFactory: (httpService: HttpService) =>
				new HttpBuilder(httpService.axiosRef),
		},
	],
	exports: [HttpBuilder],
})
export class HttpModule {}
