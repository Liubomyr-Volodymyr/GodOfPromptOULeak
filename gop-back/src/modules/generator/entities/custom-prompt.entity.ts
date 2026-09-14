import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('custom_prompts', { synchronize: false })
export class CustomPromptEntity {
	@PrimaryGeneratedColumn({ name: 'custom_prompt_id' })
	custom_prompt_id: number;

	@Column({ type: 'int', nullable: false })
	order: number;

	@Column({ type: 'varchar', nullable: false })
	model: string;

	@Column({ type: 'varchar', nullable: false, unique: true })
	name: string;

	@Column({ type: 'text', nullable: false })
	prompt: string;

	@Column({ type: 'text', nullable: false })
	insert: string;
}
