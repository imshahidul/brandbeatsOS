import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, PlatformRole } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async create(data: {
    email: string;
    passwordHash: string;
    roles: PlatformRole[];
  }): Promise<User> {
    const user = this.users.create({
      email: data.email.toLowerCase().trim(),
      passwordHash: data.passwordHash,
      roles: data.roles,
    });
    return this.users.save(user);
  }

  findByEmail(email: string): Promise<User | null> {
    return this.users.findOne({ where: { email: email.toLowerCase().trim() } });
  }

  findById(id: string): Promise<User | null> {
    return this.users.findOne({ where: { id } });
  }

  /** Never expose the password hash to callers. */
  toSafe(user: User) {
    const { passwordHash: _ph, ...safe } = user;
    return safe;
  }
}
