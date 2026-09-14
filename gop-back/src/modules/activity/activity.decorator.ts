import { SetMetadata } from '@nestjs/common';
import { ActivityTypeEnum } from './enums/activity-type.enum';

export const TRACK_ACTIVITY_KEY = 'track_activity';

export const TrackActivity = (type: ActivityTypeEnum) => SetMetadata(TRACK_ACTIVITY_KEY, { type });
