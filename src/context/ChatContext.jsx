import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import { notifications } from '@mantine/notifications';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

// Create single stable API instance
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5200/api',
});

export const ChatProvider = ({ children }) => {
    const { user, token } = useAuth();
    const { socket } = useSocket();
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState({}); // { chatId: [messages] }
    const [loadingChats, setLoadingChats] = useState(false);

    const [typingUsers, setTypingUsers] = useState({});

    // Dedupe real-time messages (server emits to the chat room AND the receiver user-room for reliability)
    const processedMessageIds = useRef(new Set());
    // Always-fresh snapshot of chats for use in socket handlers
    const chatsRef = useRef(chats);
    chatsRef.current = chats;

    useEffect(() => {
        if (token) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
    }, [token]);

    const fetchChats = useCallback(async () => {
        if (!user) return;
        try {
            setLoadingChats(true);
            const { data } = await api.get('/chats');
            setChats(data);
        } catch (error) {
            console.error("Failed to fetch chats", error);
        } finally {
            setLoadingChats(false);
        }
    }, [user]);

    const fetchMessages = useCallback(async (chatId, { before = null, limit = 50 } = {}) => {
        if (!chatId) return;
        try {
            const params = { limit };
            if (before) params.before = before;

            const { data } = await api.get(`/messages/${chatId}`, { params });

            setMessages(prev => {
                const currentMessages = prev[chatId] || [];
                if (before) {
                    // Prepend older messages
                    // Filter out any duplicates just in case, though logically simpler to just spread
                    // Since data is chronological [oldest ... newest], and current is [oldest ... newest]
                    return { ...prev, [chatId]: [...data, ...currentMessages] };
                } else {
                    // Initial load
                    return { ...prev, [chatId]: data };
                }
            });

            // Return data length for checking if more exist
            return data.length;
        } catch (error) {
            console.error("Failed to fetch messages", error);
            return 0;
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchChats();
        } else {
            setChats([]);
            setMessages({});
            setSelectedChat(null);
        }
    }, [user, fetchChats]);

    useEffect(() => {
        if (socket && selectedChat) {
            socket.emit('join_chat', { chatId: selectedChat });

            // Allow immediate UI update to clear badge
            setChats(prev => prev.map(chat => {
                if (chat._id === selectedChat && chat.unreadCount > 0) {
                    return { ...chat, unreadCount: 0 };
                }
                return chat;
            }));
        }
    }, [socket, selectedChat]);

    useEffect(() => {
        if (!socket) return;

        const handleReceiveMessage = (newMessage) => {
            if (!newMessage || !newMessage._id) return;
            if (processedMessageIds.current.has(newMessage._id)) return;
            processedMessageIds.current.add(newMessage._id);

            setMessages(prev => {
                const chatId = newMessage.chat;
                const chatMessages = prev[chatId] || [];
                if (chatMessages.some(m => m._id === newMessage._id)) return prev;
                return { ...prev, [chatId]: [...chatMessages, newMessage] };
            });

            setChats(prev => {
                const updatedChats = prev.map(chat => {
                    if (chat._id === newMessage.chat) {
                        const isChatOpen = selectedChat === newMessage.chat;
                        const unreadCount = isChatOpen ? 0 : (chat.unreadCount || 0) + 1;
                        return {
                            ...chat,
                            lastMessage: newMessage,
                            updatedAt: newMessage.createdAt,
                            unreadCount: unreadCount
                        };
                    }
                    return chat;
                });
                return updatedChats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            });
        };

        const handleNewChat = (chat) => {
            setChats(prev => prev.some(c => c._id === chat._id) ? prev : [chat, ...prev]);
            if (socket) {
                socket.emit('join_chat', { chatId: chat._id });
            }
        };

        const handleMessageUpdated = (updatedMessage) => {
            setMessages(prev => {
                const chatId = updatedMessage.chat;
                const chatMessages = prev[chatId] || [];
                return { ...prev, [chatId]: chatMessages.map(m => m._id === updatedMessage._id ? updatedMessage : m) };
            });

            setChats(prev => prev.map(chat => {
                if (chat.lastMessage && String(chat.lastMessage._id) === String(updatedMessage._id)) {
                    return { ...chat, lastMessage: { ...chat.lastMessage, ...updatedMessage } };
                }
                return chat;
            }));
        };

        const handleChatDeleted = ({ chatId, deletedBy }) => {
            setChats(prev => prev.filter(c => c._id !== chatId));
            if (selectedChat === chatId) setSelectedChat(null);
            if (deletedBy !== (user?.id || user?._id)) {
                notifications.show({ title: 'Chat Deleted', message: 'A chat was deleted.', color: 'info' });
            }
        };

        const handleMessageDeleted = ({ messageId, chatId }) => {
            setMessages(prev => {
                const chatMessages = prev[chatId] || [];
                return { ...prev, [chatId]: chatMessages.filter(m => m._id !== messageId) };
            });

            // If the deleted message was the lastMessage preview, refetch chats for a fresh preview
            const chat = chatsRef.current.find(c => c._id === chatId);
            if (chat?.lastMessage && String(chat.lastMessage._id) === String(messageId)) {
                fetchChats();
            }
        };

        const handleTypingStart = ({ senderId, roomId }) => {
            setTypingUsers(prev => ({
                ...prev,
                [roomId]: [...(prev[roomId] || []), senderId]
            }));
        };

        const handleUserUpdated = ({ userId, username, displayName, avatar }) => {
            setChats(prev => prev.map(chat => {
                // If it's a 1-on-1 chat with this user
                if (!chat.isGroup && chat.recipientId === userId) {
                    return {
                        ...chat,
                        chatName: displayName || username || chat.chatName,
                        recipientName: displayName || username || chat.recipientName,
                        chatImage: avatar || chat.chatImage // Update avatar
                    };
                }
                // If it's a group, update participant info if we stored it
                if (chat.isGroup && chat.participants) {
                    const updatedParticipants = chat.participants.map(p => {
                        if (p._id === userId) {
                            return { ...p, username: username || p.username, displayName: displayName || p.displayName, avatar: avatar || p.avatar };
                        }
                        return p;
                    });
                    return { ...chat, participants: updatedParticipants };
                }
                return chat;
            }));
        };

        const handleTypingStop = ({ senderId, roomId }) => {
            setTypingUsers(prev => ({
                ...prev,
                [roomId]: (prev[roomId] || []).filter(id => id !== senderId)
            }));
        };

        socket.on('receive_message', handleReceiveMessage);
        socket.on('new_chat', handleNewChat);
        socket.on('message_updated', handleMessageUpdated);
        socket.on('chat_deleted', handleChatDeleted);
        socket.on('message_deleted', handleMessageDeleted);
        socket.on('typing_start', handleTypingStart);
        socket.on('typing_stop', handleTypingStop);
        socket.on('user_updated', handleUserUpdated);

        return () => {
            socket.off('receive_message', handleReceiveMessage);
            socket.off('new_chat', handleNewChat);
            socket.off('message_updated', handleMessageUpdated);
            socket.off('chat_deleted', handleChatDeleted);
            socket.off('message_deleted', handleMessageDeleted);
            socket.off('typing_start', handleTypingStart);
            socket.off('typing_stop', handleTypingStop);
            socket.off('user_updated', handleUserUpdated);
        };
    }, [socket, user?._id, user?.id, selectedChat, fetchChats]);

    const addMessage = useCallback((chatId, message) => {
        setMessages(prev => {
            const chatMessages = prev[chatId] || [];
            if (chatMessages.some(m => m._id === message._id)) return prev;
            return { ...prev, [chatId]: [...chatMessages, message] };
        });
        setChats(prev => prev.map(chat => chat._id === chatId ? { ...chat, lastMessage: message, updatedAt: message.createdAt } : chat).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
    }, []);

    const contextValue = useMemo(() => ({
        chats, fetchChats, selectedChat, setSelectedChat, messages, fetchMessages,
        loadingChats, addMessage, typingUsers, api
    }), [chats, fetchChats, selectedChat, messages, fetchMessages, loadingChats, addMessage, typingUsers]);

    return (
        <ChatContext.Provider value={contextValue}>
            {children}
        </ChatContext.Provider>
    );
};
