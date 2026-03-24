import { useCallback, useState } from 'react';
import * as authService from '../services/authService';
import type { AppRole } from '../services/authService';

export function useAuth() {
  const [user, setUser] = useState(authService.getStoredUser);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      setUser(await authService.login(email, password));
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, displayName: string, role: AppRole) => {
    setLoading(true);
    try {
      setUser(await authService.register(email, password, displayName, role));
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  return { user, loading, login, register, logout };
}
