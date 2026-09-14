import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { PromptFormat } from '../../library/entities/prompt-format.entity';
import { Tool } from '../../library/entities/tools.entity';

@Entity('prompt_field_ai_instructions')
@Index(['promptFormat'])
@Index(['tool'])
@Index(['promptFieldName'])
export class PromptFieldAiInstructions {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'varchar', name: 'prompt_field_name' })
	promptFieldName: string;

	@Column({ type: 'text', name: 'field_ai_instruction' })
	fieldAiInstruction: string;

	@Column({ type: 'text', name: 'field_ai_instruction_premium', nullable: true })
	fieldAiInstructionPremium: string;

	@ManyToOne(() => PromptFormat, { nullable: true, onDelete: 'CASCADE' })
	@JoinColumn({ name: 'prompt_format_id' })
	promptFormat: PromptFormat;

	@ManyToOne(() => Tool, { nullable: true, onDelete: 'CASCADE' })
	@JoinColumn({ name: 'tool_id' })
	tool: Tool;
}
