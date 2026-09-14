import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../users/entities/users.entity';
import { AudienceType } from './audience-type.entity';

@Entity('user_audience_types')
@Index('uq_user_audience_types', ['user', 'audienceType'], { unique: true })
export class UserAudienceTypes {
	@PrimaryGeneratedColumn()
	id: number;

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'user_id' })
	@Index('idx_user_audience_types_user_id')
	user: User;

	@ManyToOne(() => AudienceType, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'audience_type_id' })
	@Index('idx_user_audience_types_audience_type_id')
	audienceType: AudienceType;
}
