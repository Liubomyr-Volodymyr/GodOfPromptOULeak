import { Admins } from '../entities/admins.entity';

export interface IAuthRepository {
	findByEmailWithPassword(email: string): Promise<Admins | null>;
	findById(id: number): Promise<Admins | null>;
}
