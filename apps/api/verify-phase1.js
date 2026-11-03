/**
 * Phase 1 security verification — runs against compiled code, no DB needed.
 * Tests: argon2id hashing, JWT sign/verify, JwtAuthGuard, RolesGuard,
 * TenantGuard header enforcement, and DTO validation.
 */
const assert = require('assert');
const argon2 = require('argon2');
const { JwtService } = require('@nestjs/jwt');
const { validate } = require('class-validator');

const { JwtAuthGuard } = require('./dist/common/guards/jwt-auth.guard');
const { RolesGuard } = require('./dist/common/guards/roles.guard');
const { TenantGuard } = require('./dist/common/guards/tenant.guard');
const { RegisterDto } = require('./dist/auth/dto/register.dto');

function mockContext({ handlerMeta = {}, classMeta = {}, req = {} } = {}) {
  const store = new Map();
  const reflector = {
    getAllAndOverride: (key) => handlerMeta[key] ?? classMeta[key] ?? undefined,
  };
  return {
    reflector,
    ctx: {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => req }),
    },
  };
}

(async () => {
  let pass = 0;
  const ok = (name) => { pass++; console.log(`  PASS ${name}`); };

  // 1. argon2id password hashing
  const hash = await argon2.hash('correct-horse-123', { type: argon2.argon2id });
  assert.ok(await argon2.verify(hash, 'correct-horse-123'));
  assert.ok(!(await argon2.verify(hash, 'wrong-password')));
  assert.ok(hash.startsWith('$argon2id$'), 'must be argon2id, not bcrypt');
  ok('argon2id hash/verify, rejects wrong password');

  // 2. JWT sign / verify round-trip
  const jwt = new JwtService({ secret: 'test-secret' });
  const token = await jwt.signAsync({ sub: 'u1', email: 'a@b.c', roles: ['merchant'] }, { expiresIn: '15m' });
  const payload = await jwt.verifyAsync(token);
  assert.strictEqual(payload.sub, 'u1');
  assert.deepStrictEqual(payload.roles, ['merchant']);
  ok('JWT sign/verify round-trip');

  // 3. JwtAuthGuard
  const mkGuard = (meta = {}) => {
    const { reflector, ctx } = mockContext({ handlerMeta: meta });
    return { guard: new JwtAuthGuard(jwt, reflector), ctx };
  };
  // 3a. public route bypasses auth
  {
    const { guard, ctx } = mkGuard({ isPublic: true });
    assert.strictEqual(await guard.canActivate(ctx), true);
    ok('JwtAuthGuard: @Public() bypasses auth');
  }
  // 3b. valid token attaches user
  {
    const req = { headers: { authorization: `Bearer ${token}` } };
    const { guard, ctx } = mockContext({ req });
    const g = new JwtAuthGuard(jwt, mockContext().reflector);
    assert.strictEqual(await g.canActivate(ctx), true);
    assert.strictEqual(req.user.sub, 'u1');
    ok('JwtAuthGuard: valid token attaches user payload');
  }
  // 3c. missing token -> 401
  {
    const { ctx } = mockContext({ req: { headers: {} } });
    const g = new JwtAuthGuard(jwt, mockContext().reflector);
    await assert.rejects(() => g.canActivate(ctx), /Missing bearer token/);
    ok('JwtAuthGuard: missing token -> 401');
  }
  // 3d. tampered token -> 401
  {
    const req = { headers: { authorization: `Bearer ${token}tampered` } };
    const { ctx } = mockContext({ req });
    const g = new JwtAuthGuard(jwt, mockContext().reflector);
    await assert.rejects(() => g.canActivate(ctx), /Invalid or expired token/);
    ok('JwtAuthGuard: tampered token -> 401');
  }

  // 4. RolesGuard
  {
    const { reflector, ctx } = mockContext({
      handlerMeta: { roles: ['platform_admin'] },
      req: { user: { roles: ['merchant'] } },
    });
    const g = new RolesGuard(reflector);
    await assert.rejects(async () => g.canActivate(ctx), /Insufficient role/);
    ok('RolesGuard: merchant blocked from platform_admin route (403)');
  }
  {
    const { reflector, ctx } = mockContext({
      handlerMeta: { roles: ['platform_admin'] },
      req: { user: { roles: ['platform_admin'] } },
    });
    assert.strictEqual(new RolesGuard(reflector).canActivate(ctx), true);
    ok('RolesGuard: platform_admin allowed');
  }
  {
    const { reflector, ctx } = mockContext({ req: { user: { roles: ['merchant'] } } });
    assert.strictEqual(new RolesGuard(reflector).canActivate(ctx), true);
    ok('RolesGuard: no @Roles metadata -> open to any authenticated user');
  }

  // 5. TenantGuard: missing header -> 403 (no DB needed for this path)
  {
    const fakeTenants = { findMembership: async () => { throw new Error('should not reach DB'); } };
    const { ctx } = mockContext({ req: { headers: {}, user: { sub: 'u1' } } });
    const g = new TenantGuard(fakeTenants);
    await assert.rejects(() => g.canActivate(ctx), /Missing X-Tenant-Id/);
    ok('TenantGuard: missing X-Tenant-Id -> 403');
  }
  {
    const fakeTenants = { findMembership: async () => null };
    const { ctx } = mockContext({ req: { headers: { 'x-tenant-id': 't1' }, user: { sub: 'u1' } } });
    const g = new TenantGuard(fakeTenants);
    await assert.rejects(() => g.canActivate(ctx), /Not a member/);
    ok('TenantGuard: non-member -> 403');
  }
  {
    const fakeTenants = { findMembership: async () => ({ role: 'merchant_admin' }) };
    const req = { headers: { 'x-tenant-id': 't1' }, user: { sub: 'u1' } };
    const { ctx } = mockContext({ req });
    const g = new TenantGuard(fakeTenants);
    assert.strictEqual(await g.canActivate(ctx), true);
    assert.strictEqual(req.tenant.id, 't1');
    ok('TenantGuard: member passes, tenant attached to request');
  }

  // 6. DTO validation
  {
    const bad = new RegisterDto();
    bad.email = 'not-an-email'; bad.password = 'short';
    const errors = await validate(bad);
    assert.ok(errors.length >= 2, 'expected validation errors');
    ok('RegisterDto: invalid email + short password rejected');
  }
  {
    const good = new RegisterDto();
    good.email = 'user@example.com'; good.password = 'long-enough-password-1';
    const errors = await validate(good);
    assert.strictEqual(errors.length, 0);
    ok('RegisterDto: valid input passes');
  }

  console.log(`\nALL ${pass} SECURITY CHECKS PASSED`);
})().catch((e) => { console.error('FAILED:', e); process.exit(1); });
