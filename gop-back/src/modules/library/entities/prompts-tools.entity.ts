import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Prompts } from './prompts.entity';
import { Tool } from './tools.entity';

@Entity('prompts_tools')
@Index(['prompt', 'tool'], { unique: true })
export class PromptsTools {
	@PrimaryGeneratedColumn()
	id: number;

	@ManyToOne(() => Prompts, (prompt) => prompt.toolRelations, {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'prompts_id' })
	@Index()
	prompt: Prompts;

	@ManyToOne(() => Tool, (tool) => tool.promptRelations, {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'tool_id' })
	@Index()
	tool: Tool;
}
