import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Segment } from './segments.entity';
import { User } from '../../users/entities/users.entity';

@Entity('users_segments')
@Index(['user', 'segment'], { unique: true })
export class UserSegment {
	@PrimaryGeneratedColumn()
	id: bigint;

	@ManyToOne(() => User, (user) => user.segments, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'user_id' })
	user: User;

	@ManyToOne(() => Segment, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'segment_id' })
	segment: Segment;
}
