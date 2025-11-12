import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/config';
import { api } from '../api/api';

interface User {
  userId: string;
  userType: string;
  role: string;
  fullName: string;
  email: string;
  phone: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    userName: string;
    password: string;
    userType: 'APPLICANT' | 'EMPLOYER';
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const [userId, userType, role, fullName, email, phone] = await AsyncStorage.multiGet([
        STORAGE_KEYS.USER_ID,
        STORAGE_KEYS.USER_TYPE,
        STORAGE_KEYS.ROLE,
        STORAGE_KEYS.FULL_NAME,
        STORAGE_KEYS.EMAIL,
        STORAGE_KEYS.PHONE,
      ]);

      if (userId[1] && userType[1]) {
        setUser({
          userId: userId[1],
          userType: userType[1],
          role: role[1] || '',
          fullName: fullName[1] || '',
          email: email[1] || '',
          phone: phone[1] || '',
        });
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await api.login({
        username,
        password,
        platform: 'MOBILE',
        versionApp: '1.0.0',
        deviceToken: 'mobile-device',
      });

      const { accessToken, refreshToken, role, userId, fullName, email, phone } = response.data;

      await AsyncStorage.multiSet([
        [STORAGE_KEYS.TOKEN, accessToken],
        [STORAGE_KEYS.REFRESH_TOKEN, refreshToken],
        [STORAGE_KEYS.USER_ID, userId],
        [STORAGE_KEYS.USER_TYPE, role],
        [STORAGE_KEYS.ROLE, role],
        [STORAGE_KEYS.FULL_NAME, fullName],
        [STORAGE_KEYS.EMAIL, email],
        [STORAGE_KEYS.PHONE, phone || ''],
      ]);

      setUser({
        userId,
        userType: role,
        role,
        fullName,
        email,
        phone: phone || '',
      });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_ID,
        STORAGE_KEYS.USER_TYPE,
        STORAGE_KEYS.ROLE,
        STORAGE_KEYS.FULL_NAME,
        STORAGE_KEYS.EMAIL,
        STORAGE_KEYS.PHONE,
      ]);
      setUser(null);
    }
  };

  const register = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    userName: string;
    password: string;
    userType: 'APPLICANT' | 'EMPLOYER';
  }) => {
    try {
      await api.register(data);
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

