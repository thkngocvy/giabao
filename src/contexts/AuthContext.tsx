import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { db } from '../services/db';
import { SEED_USERS } from '../data/seedData';

interface AuthContextType {
  currentUser: UserProfile | null;
  currentRole: UserRole;
  isAuthenticated: boolean;
  activeClassId: string;
  activeChildId: string;
  setActiveClassId: (id: string) => void;
  setActiveChildId: (id: string) => void;
  login: (email: string, role?: UserRole) => boolean;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to TEACHER role for seamless Phase 1 evaluation
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('smartclass_current_user_v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const match = SEED_USERS.find(u => u.id === parsed.id || u.role === parsed.role);
        if (match) return match;
      } catch (e) {
        console.error(e);
      }
    }
    return SEED_USERS[0]; // Cô Lê Thu Hà (TEACHER)
  });

  const [activeClassId, setActiveClassIdState] = useState<string>(() => {
    return localStorage.getItem('smartclass_active_class') || 'class_10a1';
  });

  const [activeChildId, setActiveChildIdState] = useState<string>(() => {
    return localStorage.getItem('smartclass_active_child') || 'std_01';
  });

  const setActiveClassId = (id: string) => {
    setActiveClassIdState(id);
    localStorage.setItem('smartclass_active_class', id);
  };

  const setActiveChildId = (id: string) => {
    setActiveChildIdState(id);
    localStorage.setItem('smartclass_active_child', id);
  };

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('smartclass_current_user_v3', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('smartclass_current_user_v3');
    }
  }, [currentUser]);

  const login = (email: string, preferredRole?: UserRole): boolean => {
    const user = db.getUserByEmail(email) || SEED_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      setCurrentUser(user);
      return true;
    }
    // If not found by email but role requested, pick matching seed user
    if (preferredRole) {
      const match = SEED_USERS.find(u => u.role === preferredRole);
      if (match) {
        setCurrentUser(match);
        return true;
      }
    }
    return false;
  };

  const switchRole = (role: UserRole) => {
    const targetUser = SEED_USERS.find(u => u.role === role);
    if (targetUser) {
      setCurrentUser(targetUser);
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole: currentUser?.role || 'TEACHER',
        isAuthenticated: !!currentUser,
        activeClassId,
        activeChildId,
        setActiveClassId,
        setActiveChildId,
        login,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
