import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('prompt_field_ai_instructions_prompt_format')
export class PromptFieldAiInstructionsPromptFormat {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'int', nullable: true })
	prompt_field_ai_instructions_id: number;

	@Column({ type: 'int', nullable: true })
	prompt_format_id: number;
}
