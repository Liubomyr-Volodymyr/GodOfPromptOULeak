import { Entity, Column, PrimaryGeneratedColumn, OneToMany, Index } from 'typeorm';
import { PromptsTools } from './prompts-tools.entity';
import { PromptFormatTools } from './prompt-format-tools.entity';

@Entity('tools')
@Index(['name'])
@Index(['slug'])
export class Tool {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'varchar', nullable: false })
	name: string;

	@Column({ type: 'varchar', nullable: true })
	description: string;

	@Column({ type: 'varchar', nullable: true })
	url: string;

	@Column({ type: 'varchar', nullable: true })
	slug: string;

	@Column({ type: 'varchar', nullable: true })
	public_id: string;

	@Column({ type: 'varchar', nullable: true })
	type: string | null;

	@Column({ type: 'int', nullable: true })
	parent_id: number | null;

	@Column({ type: 'varchar', nullable: true })
	title: string | null;

	@Column({ type: 'varchar', nullable: true })
	h1: string | null;

	@Column({ type: 'text', nullable: true })
	seo_description: string | null;

	@Column({ type: 'text', nullable: true })
	behavior: string | null;

	@Column({ type: 'text', nullable: true })
	tips: string | null;

	@Column({ type: 'text', nullable: true })
	how_to_use: string | null;

	@Column({ type: 'text', nullable: true })
	best_for: string | null;

	@Column({ type: 'varchar', nullable: true })
	icon: string | null;

	@Column({ type: 'varchar', nullable: true })
	hero_image_url: string | null;

	@Column({ type: 'varchar', nullable: true })
	screenshot_image_url: string | null;

	@Column({ type: 'varchar', nullable: true })
	pricing_model: string | null;

	@Column({ type: 'text', nullable: true })
	pricing_summary: string | null;

	@Column({ type: 'text', nullable: true })
	plb_instructions: string | null;

	@Column({ type: 'boolean', default: false })
	supports_variables: boolean;

	@Column({ type: 'timestamp', nullable: true })
	published_at: Date | null;

	@Column({ type: 'timestamp', nullable: true })
	last_reviewed_at: Date | null;

	@OneToMany(() => PromptsTools, (pt) => pt.tool)
	promptRelations: PromptsTools[];

	@OneToMany(() => PromptFormatTools, (rel) => rel.tool)
	promptFormatRelations: PromptFormatTools[];
}
