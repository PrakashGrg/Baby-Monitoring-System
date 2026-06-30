import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { bootCheck(); }, []);

  const bootCheck = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        const me = await authAPI.me();
        setUser(me);
      }
    } catch {
      await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const data = await authAPI.login(username, password);
    await AsyncStorage.setItem('access_token', data.access);
    await AsyncStorage.setItem('refresh_token', data.refresh);
    const me = await authAPI.me();
    setUser(me);
    return me;
  };

  const register = async (formData) => {
    await authAPI.register(formData);
    return login(formData.username, formData.password);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};