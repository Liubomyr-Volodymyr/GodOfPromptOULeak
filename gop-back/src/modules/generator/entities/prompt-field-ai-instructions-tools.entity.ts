import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('prompt_field_ai_instructions_tools')
export class PromptFieldAiInstructionsTools {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'int', nullable: true })
	prompt_field_ai_instructions_id: number;

	@Column({ type: 'int', nullable: true })
	tool_id: number;
}
