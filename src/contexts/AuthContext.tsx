import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { listUsuarios, createUsuario } from '@/lib/api/usuarios';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  tier: 'vip' | 'padrao';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('helpdesk_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const login = async (username: string, password: string): Promise<boolean> => {
    const rows = await listUsuarios()
    const found = rows.find(u => (u.username || '') === username && (u.password_hash || '') === password)
    if (!found) return false
    const userData = {
      id: found.id,
      email: found.username,
      name: found.name,
      role: (found.is_admin === 1 || found.tier === 'admin') ? 'admin' as const : 'user' as const,
      tier: (found.tier === 'vip' || found.tier === 'admin') ? 'vip' as const : 'padrao' as const,
    };
    setUser(userData);
    localStorage.setItem('helpdesk_user', JSON.stringify(userData));
    return true;
  };

  const register = async (username: string, password: string, name: string): Promise<boolean> => {
    const created = await createUsuario({ nome: name, username, password, tipo: 'padrao' })
    const userData = {
      id: created.id,
      email: created.username,
      name: created.name,
      role: (created.tier === 'admin') ? 'admin' as const : 'user' as const,
      tier: (created.tier === 'vip' || created.tier === 'admin') ? 'vip' as const : 'padrao' as const,
    };
    setUser(userData);
    localStorage.setItem('helpdesk_user', JSON.stringify(userData));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('helpdesk_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
