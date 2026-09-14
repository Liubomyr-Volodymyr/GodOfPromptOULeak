import { Entity, Column, PrimaryGeneratedColumn, OneToMany, Index } from 'typeorm';
import { PromptFormatTools } from './prompt-format-tools.entity';
import { Prompts } from './prompts.entity';

@Entity('prompt_format')
@Index('uq_prompt_format_tech_name', ['techName'], { unique: true })
export class PromptFormat {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'varchar' })
	name: string;

	@Column({ type: 'varchar', name: 'tech_name' })
	techName: string;

	@OneToMany(() => PromptFormatTools, (rel) => rel.promptFormat)
	toolRelations: PromptFormatTools[];

	@OneToMany(() => Prompts, (prompt) => prompt.promptFormat)
	prompts: Prompts[];
}
