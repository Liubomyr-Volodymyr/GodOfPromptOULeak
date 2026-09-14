import { Entity, Index, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Products } from './products.entity';
import { OutputTypes } from './output-types.entity';

@Entity('product_output_types')
@Index(['product', 'outputType'], { unique: true })
export class ProductOutputType {
	@PrimaryGeneratedColumn()
	id: number;

	@ManyToOne(() => Products, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'product_id' })
	product: Products;

	@ManyToOne(() => OutputTypes, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'output_type_id' })
	outputType: OutputTypes;
}
