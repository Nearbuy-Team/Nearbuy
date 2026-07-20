import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import { ApiError, authApi, type ApiUser, usersApi } from '@/lib/api';

const TOKEN_KEY = 'nb_token';
const USER_KEY = 'nb_user';
const ONBOARD_KEY = 'nb_seen_onboarding';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  trustScore: number;
  idVerified: boolean;
  createdAt: string;
}

export interface RegisterFields {
  name: string;
  email: string;
  phone: string;
  password: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  seenOnboarding: boolean;
  pendingEmail: string | null;
  login: (idOrEmail: string, password: string) => Promise<void>;
  register: (fields: RegisterFields) => Promise<void>;
  verifyOtp: (code: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, password: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const mem = new Map<string, string>();
const store = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        return globalThis.localStorage?.getItem(key) ?? mem.get(key) ?? null;
      } catch {
        return mem.get(key) ?? null;
      }
    }
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        globalThis.localStorage?.setItem(key, value);
      } catch {
        mem.set(key, value);
      }
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async del(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        globalThis.localStorage?.removeItem(key);
      } catch {
        mem.delete(key);
      }
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

const toAuthUser = (user: ApiUser): AuthUser => ({
  id: user.id,
  name: user.fullName,
  email: user.email,
  phone: user.phone,
  trustScore: user.trustScore,
  idVerified: user.idVerified,
  createdAt: user.createdAt,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [seenOnboarding, setSeenOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pending, setPending] = useState<RegisterFields | null>(null);

  const persistSession = async (nextToken: string, apiUser: ApiUser) => {
    const nextUser = toAuthUser(apiUser);
    setToken(nextToken);
    setUser(nextUser);
    await Promise.all([
      store.set(TOKEN_KEY, nextToken),
      store.set(USER_KEY, JSON.stringify(nextUser)),
    ]);
  };

  const clearSession = async () => {
    setUser(null);
    setToken(null);
    await Promise.all([store.del(TOKEN_KEY), store.del(USER_KEY)]);
  };

  useEffect(() => {
    void (async () => {
      try {
        const [storedToken, storedUser, onboarding] = await Promise.all([
          store.get(TOKEN_KEY),
          store.get(USER_KEY),
          store.get(ONBOARD_KEY),
        ]);
        if (onboarding === '1') setSeenOnboarding(true);
        if (!storedToken || !storedUser) return;

        setToken(storedToken);
        setUser(JSON.parse(storedUser) as AuthUser);
        try {
          const current = await usersApi.me(storedToken);
          await persistSession(storedToken, current);
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) await clearSession();
        }
      } catch {
        await clearSession();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      seenOnboarding,
      pendingEmail: pending?.email ?? null,
      login: async (identifier, password) => {
        const normalizedIdentifier = identifier.trim();
        try {
          const result = await authApi.login(normalizedIdentifier, password);
          const current = await usersApi.me(result.token);
          await persistSession(result.token, current);
        } catch (error) {
          const verificationRequired =
            error instanceof ApiError &&
            error.status === 401 &&
            error.message.toLowerCase().includes('verify your account');

          if (verificationRequired && normalizedIdentifier.includes('@')) {
            setPending({
              name: '',
              email: normalizedIdentifier.toLowerCase(),
              phone: '',
              password,
            });
          }
          throw error;
        }
      },
      register: async (fields) => {
        const normalized = { ...fields, email: fields.email.trim().toLowerCase() };
        await authApi.register({
          fullName: normalized.name.trim(),
          email: normalized.email,
          phone: normalized.phone.trim(),
          password: normalized.password,
        });
        setPending(normalized);
      },
      verifyOtp: async (code) => {
        if (!pending) throw new Error('Registration session expired. Please sign up again.');
        await authApi.verifyOtp(pending.email, code);
        const result = await authApi.login(pending.email, pending.password);
        const current = await usersApi.me(result.token);
        await persistSession(result.token, current);
        setPending(null);
      },
      resendVerification: async () => {
        if (!pending) throw new Error('Registration session expired. Please sign up again.');
        await authApi.resendVerification(pending.email);
      },
      requestPasswordReset: (email) => authApi.requestPasswordReset(email).then(() => undefined),
      resetPassword: (email, code, password) =>
        authApi.resetPassword(email, code, password).then(() => undefined),
      refreshUser: async () => {
        if (!token) return;
        const current = await usersApi.me(token);
        await persistSession(token, current);
      },
      logout: clearSession,
      completeOnboarding: async () => {
        setSeenOnboarding(true);
        await store.set(ONBOARD_KEY, '1');
      },
    }),
    [user, token, isLoading, seenOnboarding, pending]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an <AuthProvider>');
  return ctx;
}
