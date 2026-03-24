import { apiClient } from './apiClient';

export interface User {
  uid: string;
  email: string;
  displayName: string | null;
  role: 'child' | 'parent' | 'admin';
  createdAt: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const authService = {
  login: async (credentials: any): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/login', credentials);
    localStorage.setItem('shieldbot_token', res.token);
    localStorage.setItem('shieldbot_user', JSON.stringify(res.user));
    return res;
  },
  
  register: async (data: any): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/register', data);
    localStorage.setItem('shieldbot_token', res.token);
    localStorage.setItem('shieldbot_user', JSON.stringify(res.user));
    return res;
  },

  logout: () => {
    localStorage.removeItem('shieldbot_token');
    localStorage.removeItem('shieldbot_user');
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('shieldbot_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  getMe: async (): Promise<User> => {
    const user = await apiClient.get<User>('/auth/me');
    localStorage.setItem('shieldbot_user', JSON.stringify(user));
    return user;
  },

  updateProfile: async (data: { displayName: string }): Promise<User> => {
    const user = await apiClient.put<User>('/auth/profile', data);
    localStorage.setItem('shieldbot_user', JSON.stringify(user));
    return user;
  },

  deleteAccount: async (): Promise<void> => {
    await apiClient.delete('/auth/account');
    authService.logout();
  }
};
