import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'crypto';
import { IsNull, MoreThan, Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service';
import { TenantsService } from '../tenants/tenants.service';
import { AuditService } from '../audit/audit.service';
import { User } from '../users/user.entity';
import { RefreshToken } from './refresh-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly tenants: TenantsService,
    private readonly audit: AuditService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokens: Repository<RefreshToken>,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.users.findByEmail(dto.email);
    if (exists) throw new ConflictException('Email already registered');

    const user = await this.users.create({
      email: dto.email,
      passwordHash: await argon2.hash(dto.password, { type: argon2.argon2id }),
      roles: ['merchant'],
    });

    const storeName =
      dto.storeName?.trim() || `${dto.email.split('@')[0]}'s store`;
    const tenant = await this.tenants.create(user.id, { name: storeName });

    await this.audit.log({
      actorUserId: user.id,
      tenantId: tenant.id,
      action: 'auth.register',
    });

    return { ...this.toTokens(user), user: this.users.toSafe(user), tenant };
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByEmail(dto.email);
    if (
      !user ||
      !user.isActive ||
      !(await argon2.verify(user.passwordHash, dto.password))
    ) {
      // Same response for unknown email vs wrong password (no user enumeration).
      throw new UnauthorizedException('Invalid email or password');
    }
    await this.audit.log({ actorUserId: user.id, action: 'auth.login' });
    return { ...this.toTokens(user), user: this.users.toSafe(user) };
  }

  /** Rotates the refresh token: the old one is revoked, a new pair is issued. */
  async refresh(rawToken: string) {
    const stored = await this.refreshTokens.findOne({
      where: { tokenHash: sha256(rawToken), revokedAt: IsNull() },
    });
    if (!stored || stored.expiresAt <= new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    const user = await this.users.findById(stored.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    await this.refreshTokens.update(stored.id, { revokedAt: new Date() });
    return { ...this.toTokens(user), user: this.users.toSafe(user) };
  }

  async logout(rawToken: string): Promise<{ ok: true }> {
    await this.refreshTokens.update(
      { tokenHash: sha256(rawToken) },
      { revokedAt: new Date() },
    );
    return { ok: true };
  }

  private async toTokens(user: User) {
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      roles: user.roles,
    });

    const rawRefresh = randomBytes(48).toString('hex');
    const days = this.config.get<number>('app.refreshExpiresDays', 30);
    await this.refreshTokens.save(
      this.refreshTokens.create({
        userId: user.id,
        tokenHash: sha256(rawRefresh),
        expiresAt: new Date(Date.now() + days * 24 * 3600 * 1000),
      }),
    );

    return { accessToken, refreshToken: rawRefresh, tokenType: 'Bearer' as const };
  }

  /** Housekeeping: delete expired/revoked tokens older than 60 days. */
  async pruneTokens(): Promise<number> {
    const cutoff = new Date(Date.now() - 60 * 24 * 3600 * 1000);
    const res = await this.refreshTokens
      .createQueryBuilder()
      .delete()
      .where('expires_at < :cutoff', { cutoff })
      .execute();
    return res.affected ?? 0;
  }

  /** Test helper: find non-revoked tokens (used by unit tests). */
  async countActiveTokens(userId: string): Promise<number> {
    return this.refreshTokens.count({
      where: {
        userId,
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
    });
  }
}
