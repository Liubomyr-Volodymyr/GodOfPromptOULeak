import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { ApiHideProperty } from '@nestjs/swagger';
import { ProductOutputType } from './products-output-types.entity';

export const OUTPUT_TYPE = {
	TEXT: 1,
	IMAGE: 2,
	CODE: 3,
	ALL: 4,
} as const;

export type OutputTypeId = (typeof OUTPUT_TYPE)[keyof typeof OUTPUT_TYPE];

@Entity('output_types')
export class OutputTypes {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'varchar' })
	name: string;

	@Column({ type: 'varchar', length: 50, name: 'tech_name' })
	techName: string;

	@ApiHideProperty()
	@OneToMany(() => ProductOutputType, (pot) => pot.outputType)
	products: ProductOutputType[];
}
