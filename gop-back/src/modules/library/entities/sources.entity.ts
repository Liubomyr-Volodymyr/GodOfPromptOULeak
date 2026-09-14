import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('sources')
export class Source {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'varchar' })
	name: string;
}
