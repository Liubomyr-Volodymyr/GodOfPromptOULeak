import { Entity, Column, PrimaryGeneratedColumn, Index, OneToMany } from 'typeorm';
import { Prompts } from './prompts.entity';

@Entity('input_format')
@Index('idx_input_format_tech_name', ['techName'], { unique: true })
export class InputFormat {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'varchar' })
	name: string;

	@Column({ type: 'varchar', name: 'tech_name' })
	techName: string;

	@OneToMany(() => Prompts, (prompt) => prompt.inputFormat)
	prompts: Prompts[];
}
