import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type ThemePreference = 'dark' | 'light';
export type ChatFontSizePreference = 'sm' | 'md' | 'lg';

type PreferencesContextValue = {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;

  chatFontSize: ChatFontSizePreference;
  setChatFontSize: (size: ChatFontSizePreference) => void;

  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;

  memoryEnabled: boolean;
  setMemoryEnabled: (enabled: boolean) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

const STORAGE_KEYS = {
  theme: 'shieldbot_theme',
  chatFontSize: 'shieldbot_chat_font_size',
  notificationsEnabled: 'shieldbot_notifications_enabled',
  memoryEnabled: 'shieldbot_memory_enabled'
} as const;

function readBool(key: string, fallback: boolean) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return raw === 'true';
  } catch {
    return fallback;
  }
}

function readString<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback;
  } catch {
    return fallback;
  }
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>(() =>
    readString<ThemePreference>(STORAGE_KEYS.theme, ['dark', 'light'], 'dark')
  );

  const [chatFontSize, setChatFontSizeState] = useState<ChatFontSizePreference>(() =>
    readString<ChatFontSizePreference>(STORAGE_KEYS.chatFontSize, ['sm', 'md', 'lg'], 'md')
  );

  const [notificationsEnabled, setNotificationsEnabledState] = useState<boolean>(() =>
    readBool(STORAGE_KEYS.notificationsEnabled, true)
  );

  const [memoryEnabled, setMemoryEnabledState] = useState<boolean>(() =>
    readBool(STORAGE_KEYS.memoryEnabled, true)
  );

  useEffect(() => {
    try {
      document.documentElement.dataset.theme = theme;
    } catch {
      // ignore
    }

    try {
      localStorage.setItem(STORAGE_KEYS.theme, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.chatFontSize, chatFontSize);
    } catch {
      // ignore
    }
  }, [chatFontSize]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.notificationsEnabled, String(notificationsEnabled));
    } catch {
      // ignore
    }
  }, [notificationsEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.memoryEnabled, String(memoryEnabled));
    } catch {
      // ignore
    }
  }, [memoryEnabled]);

  const setTheme = (nextTheme: ThemePreference) => setThemeState(nextTheme);
  const setChatFontSize = (size: ChatFontSizePreference) => setChatFontSizeState(size);
  const setNotificationsEnabled = (enabled: boolean) => setNotificationsEnabledState(enabled);
  const setMemoryEnabled = (enabled: boolean) => setMemoryEnabledState(enabled);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      theme,
      setTheme,
      chatFontSize,
      setChatFontSize,
      notificationsEnabled,
      setNotificationsEnabled,
      memoryEnabled,
      setMemoryEnabled
    }),
    [theme, chatFontSize, notificationsEnabled, memoryEnabled]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used within a PreferencesProvider');
  return ctx;
}
