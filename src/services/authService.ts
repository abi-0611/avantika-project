import { apiPost } from './apiClient';

export type AppRole = 'parent' | 'child' | 'user' | 'admin';

export interface AppUser {
  uid: string;
  email: string;
  displayName?: string | null;
  role: AppRole;
  createdAt?: number;
}

export async function register(email: string, password: string, displayName: string, role: AppRole) {
  const data = await apiPost('/api/auth/register', { email, password, displayName, role });
  localStorage.setItem('shieldbot_token', data.token);
  localStorage.setItem('shieldbot_user', JSON.stringify(data.user));
  return data.user as AppUser;
}

export async function login(email: string, password: string) {
  const data = await apiPost('/api/auth/login', { email, password });
  localStorage.setItem('shieldbot_token', data.token);
  localStorage.setItem('shieldbot_user', JSON.stringify(data.user));
  return data.user as AppUser;
}

export function logout() {
  localStorage.removeItem('shieldbot_token');
  localStorage.removeItem('shieldbot_user');
}

export function getStoredUser(): AppUser | null {
  const u = localStorage.getItem('shieldbot_user');
  return u ? (JSON.parse(u) as AppUser) : null;
}
