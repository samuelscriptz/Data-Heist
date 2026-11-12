import { cookies } from 'next/headers';
import { AuthSession } from './types';
import { getSession, saveSession, clearSession } from './db-store';

export const SESSION_COOKIE_NAME = 'dataheist_session';

// Generates a session identifier
export function generateSessionToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = 'dh_sess_';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value || null;
}

export async function getOrCreateSessionToken(): Promise<string> {
  const cookieStore = await cookies();
  let token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    token = generateSessionToken();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 6, // 6 hours
    });
  }
  return token;
}

export async function createSession(sessionData: AuthSession, explicitToken?: string): Promise<string> {
  const cookieStore = await cookies();
  const token = explicitToken || cookieStore.get(SESSION_COOKIE_NAME)?.value || generateSessionToken();
  saveSession(token, sessionData);

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 6, // 6 hours
  });

  return token;
}

export async function getCurrentSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  return getSession(token);
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    clearSession(token);
    cookieStore.delete(SESSION_COOKIE_NAME);
  }
}
