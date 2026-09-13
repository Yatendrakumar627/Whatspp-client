import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [presence, setPresence] = useState({});
    const { user } = useAuth();

    useEffect(() => {
        if (user?._id || user?.id) {
            const userId = user._id || user.id;
            const newSocket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5200', {
                query: { userId },
            });
            setSocket(newSocket);

            newSocket.on('online_users', (users) => {
                setOnlineUsers(users);
                setPresence(prev => {
                    const next = { ...prev };
                    (Array.isArray(users) ? users : Object.keys(users)).forEach(id => {
                        const existing = next[id] || {};
                        next[id] = { ...existing, isOnline: true };
                    });
                    return next;
                });
            });

            newSocket.on('presence_update', ({ userId: updatedId, isOnline, lastSeen }) => {
                setPresence(prev => ({
                    ...prev,
                    [updatedId]: { isOnline, lastSeen }
                }));
            });

            return () => newSocket.close();
        } else {
            if (socket) {
                socket.close();
                setSocket(null);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?._id, user?.id]);

    const value = useMemo(() => ({ socket, onlineUsers, presence }), [socket, onlineUsers, presence]);

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};
