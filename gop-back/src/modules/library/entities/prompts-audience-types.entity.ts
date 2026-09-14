import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Prompts } from './prompts.entity';
import { AudienceType } from './audience-type.entity';

@Entity('prompts_audience_types')
@Index(['prompt', 'audienceType'], { unique: true })
export class PromptsAudienceTypes {
	@PrimaryGeneratedColumn()
	id: number;

	@ManyToOne(() => Prompts, (prompt) => prompt.audienceTypeRelations, {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'prompt_id' })
	@Index()
	prompt: Prompts;

	@ManyToOne(() => AudienceType, (at) => at.promptRelations, {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'audience_type_id' })
	@Index()
	audienceType: AudienceType;
}
