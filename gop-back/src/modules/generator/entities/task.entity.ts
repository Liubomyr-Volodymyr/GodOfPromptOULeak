import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { PromptTypes } from '../../prompts/dto/prompt-types.dto';

@Entity('tasks', { synchronize: false })
export class TaskEntity {
	@PrimaryGeneratedColumn({ name: 'task_id' })
	task_id: number;

	@Column({ type: 'varchar', nullable: false })
	email: string;

	@Column({ type: 'text', nullable: false })
	task: string;

	@Column({ type: 'int', nullable: false, default: PromptTypes.DEFAULT })
	prompt_type: number;

	@Column({ type: 'boolean', nullable: false, default: false })
	done: boolean;

	@Column({ type: 'varchar', nullable: true })
	prompt_name: string;

	@Column({ type: 'varchar', nullable: true })
	page_name: string;

	@Column({ type: 'text', nullable: true })
	prompt_body: string;

	@Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
	date_created: Date;
}
