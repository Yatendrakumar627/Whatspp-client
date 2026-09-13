import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useMantineColorScheme } from '@mantine/core';

axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5200/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);
    const { setColorScheme } = useMantineColorScheme();

    const verifyUser = useCallback(async (tokenToVerify) => {
        if (!tokenToVerify) {
            setLoading(false);
            return;
        }
        try {
            axios.defaults.headers.common['Authorization'] = `Bearer ${tokenToVerify}`;
            const res = await axios.get('/auth/me');
            setUser(res.data);
        } catch (err) {
            console.error("Auth verification failed:", err);
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        verifyUser(token);
    }, [token, verifyUser]);

    useEffect(() => {
        if (user?.settings?.theme) {
            const themePref = user.settings.theme;
            setColorScheme(themePref === 'system' ? 'auto' : themePref);
        }
    }, [user?.settings?.theme, setColorScheme]);

    const login = useCallback(async (email, password) => {
        const res = await axios.post('/auth/login', { email, password });
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        setUser(res.data.user);
        const themePref = res.data.user?.settings?.theme || 'system';
        if (themePref === 'system') setColorScheme('auto');
        else setColorScheme(themePref);
    }, [setColorScheme]);

    const register = useCallback(async (username, email, password, displayName) => {
        const res = await axios.post('/auth/register', { username, email, password, displayName });
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        setUser(res.data.user);
        const themePref = res.data.user?.settings?.theme || 'system';
        if (themePref === 'system') setColorScheme('auto');
        else setColorScheme(themePref);
    }, [setColorScheme]);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
    }, []);

    const updateProfile = useCallback(async (data) => {
        const res = await axios.put('/users/profile', data);
        setUser(res.data);
        const themePref = res.data.settings?.theme || 'system';
        if (themePref === 'system') setColorScheme('auto');
        else setColorScheme(themePref);
        return res.data;
    }, [setColorScheme]);

    const value = useMemo(() => ({
        user, setUser, token, login, register, logout, loading, updateProfile
    }), [user, token, login, register, logout, loading, updateProfile]);

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
