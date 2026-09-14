import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export enum AdminRole {
	SUPERADMIN = 'superadmin',
	ADMIN = 'admin',
	MANAGER = 'manager',
	MODERATOR = 'moderator',
}

@Entity('admins')
export class Admins {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'varchar', nullable: true })
	email: string;

	@Column({ type: 'varchar', nullable: true })
	password: string;

	@Column({ type: 'boolean', name: 'is_active', nullable: true })
	isActive: boolean;

	@Column({ type: 'varchar', name: 'first_name', nullable: true })
	firstName: string;

	@Column({ type: 'varchar', name: 'last_name', nullable: true })
	lastName: string;

	@Column({
		type: 'enum',
		enum: AdminRole,
		default: AdminRole.MANAGER,
	})
	role: AdminRole;

	@Column({ type: 'uuid', name: 'avatar_id', nullable: true })
	avatarId: string;
}
