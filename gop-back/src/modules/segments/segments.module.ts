import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SegmentsService } from './segments.service';
import { Segment } from './entities/segments.entity';
import { UserSegment } from './entities/user-segments.entity';
import { User } from '../users/entities/users.entity';

@Module({
	imports: [TypeOrmModule.forFeature([Segment, UserSegment, User])],
	providers: [SegmentsService],
	exports: [SegmentsService],
})
export class SegmentsModule {}
