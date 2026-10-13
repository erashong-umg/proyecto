import { create } from 'zustand';
import api, { TOKEN_KEY } from '../services/api';
import type { User } from '../types/user';

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: 'student' | 'tutor';
}

export interface GoogleStubData {
  email: string;
  name: string;
  role: 'student' | 'tutor';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSuspended: boolean;
}

interface AuthStore extends AuthState {
  /** Verifica si ya hay un token guardado y, de haberlo, recupera la sesión. Llamar una sola vez al montar la app. */
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  googleStub: (data: GoogleStubData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const refreshUser = async (
  set: (partial: Partial<AuthState>) => void
): Promise<void> => {
  try {
    const { data } = await api.get<{ user: User }>('/auth/me');
    set({
      user: data.user,
      isAuthenticated: true,
      isLoading: false,
      isSuspended: data.user.status === 'suspended',
    });
  } catch {
    localStorage.removeItem(TOKEN_KEY);
    set({ user: null, isAuthenticated: false, isLoading: false, isSuspended: false });
  }
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isSuspended: false,

  refreshUser: () => refreshUser(set),

  initialize: async () => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      set({ isLoading: false });
      return;
    }
    await get().refreshUser();
  },

  login: async (email, password) => {
    const { data } = await api.post<{ token: string }>('/auth/login', { email, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    await get().refreshUser();
  },

  register: async (reg) => {
    const { data } = await api.post<{ token: string }>('/auth/register', reg);
    localStorage.setItem(TOKEN_KEY, data.token);
    await get().refreshUser();
  },

  googleStub: async (stub) => {
    const { data } = await api.post<{ token: string }>('/auth/google', stub);
    localStorage.setItem(TOKEN_KEY, data.token);
    await get().refreshUser();
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Token stateless — si el logout falla igual limpiamos la sesión local.
    }
    localStorage.removeItem(TOKEN_KEY);
    set({ user: null, isAuthenticated: false, isLoading: false, isSuspended: false });
  },
}));
