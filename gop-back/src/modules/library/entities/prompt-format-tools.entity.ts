import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { PromptFormat } from './prompt-format.entity';
import { Tool } from './tools.entity';

@Entity('prompt_format_tools')
@Index('uq_prompt_format_tool', ['promptFormat', 'tool'], { unique: true })
export class PromptFormatTools {
	@PrimaryGeneratedColumn()
	id: number;

	@ManyToOne(() => PromptFormat, (pf) => pf.toolRelations, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'prompt_format_id' })
	promptFormat: PromptFormat;

	@ManyToOne(() => Tool, (tool) => tool.promptFormatRelations, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'tool_id' })
	tool: Tool;
}
