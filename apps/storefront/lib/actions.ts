'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { login, fetchMyTenants } from './preview';

/**
 * Merchant login: exchanges credentials for a short-lived JWT kept in an
 * httpOnly cookie, then resolves the merchant's tenant (needed as the
 * X-Tenant-Id header on tenant-scoped API calls).
 */
export async function loginAction(formData: FormData): Promise<void> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const { accessToken } = await login(email, password);

  const tenants = await fetchMyTenants(accessToken);
  if (tenants.length === 0) {
    throw new Error('No store found for this account');
  }

  const jar = await cookies();
  jar.set('bb_token', accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 15, // matches the API's 15-minute access tokens
  });
  // v0: single-store merchants. Multi-store switching is future work.
  jar.set('bb_tenant', tenants[0].id, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 15,
  });
  redirect('/dashboard');
}

export async function logoutAction(): Promise<void> {
  const jar = await cookies();
  jar.delete('bb_token');
  jar.delete('bb_tenant');
  redirect('/');
}

/** Reads the auth cookies; redirects to login when missing. */
export async function requireSession(): Promise<{ token: string; tenantId: string }> {
  const jar = await cookies();
  const token = jar.get('bb_token')?.value;
  const tenantId = jar.get('bb_tenant')?.value;
  if (!token || !tenantId) redirect('/');
  return { token, tenantId };
}
