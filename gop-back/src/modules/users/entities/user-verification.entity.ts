import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('user_verification')
export class UserVerification {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'varchar' })
	code: string;

	@Column({ type: 'varchar' })
	email: string;

	@CreateDateColumn({ type: 'timestamp', name: 'created_at' })
	createdAt: Date;

	@Column({ type: 'timestamp', name: 'expires_at' })
	expiresAt: Date;
}
