import { Entity, Column, PrimaryGeneratedColumn, OneToMany, Index } from 'typeorm';
import { PromptsAudienceTypes } from './prompts-audience-types.entity';

@Entity('audience_types')
@Index(['slug'], { unique: true })
export class AudienceType {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'varchar', nullable: false })
	name: string;

	@Column({ type: 'varchar', nullable: false, unique: true })
	slug: string;

	@OneToMany(() => PromptsAudienceTypes, (pat) => pat.audienceType)
	promptRelations: PromptsAudienceTypes[];
}
