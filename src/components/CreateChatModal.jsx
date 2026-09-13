import React from 'react';
import { Modal, TextInput, Button, Stack, Group, Avatar, Text, Loader, UnstyledButton } from '@mantine/core';
import { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { notifications } from '@mantine/notifications';
import { IoSearchOutline } from "react-icons/io5";

const CreateChatModal = ({ opened, onClose }) => {
    const { api, fetchChats, setSelectedChat } = useChat();
    const [searchValue, setSearchValue] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);

    // Fetch users (Debounced)
    useEffect(() => {
        if (!opened) {
            setUsers([]);
            setSearchValue('');
            return;
        }

        const timer = setTimeout(async () => {
            if (!searchValue.trim()) {
                setUsers([]);
                return;
            }

            setLoading(true);
            try {
                const { data } = await api.get(`/users?search=${searchValue}`);
                setUsers(data);
            } catch (e) {
                console.error("Failed users", e);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [opened, searchValue, api]);

    const handleStartChat = async (userId) => {
        setCreating(true);
        try {
            const { data } = await api.post('/chats', { recipientId: userId });
            await fetchChats();
            setSelectedChat(data._id);
            onClose();
        } catch (error) {
            console.error("Full start chat error:", error);
            const errMsg = error.response?.data?.message || error.message || 'Failed to start chat';
            notifications.show({ title: 'Error', message: errMsg, color: 'red' });
        } finally {
            setCreating(false);
        }
    };

    return (
        <Modal opened={opened} onClose={onClose} title="New Chat" centered>
            <Stack>
                <TextInput
                    placeholder="Search by username or email..."
                    leftSection={<IoSearchOutline />}
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    data-autofocus
                />

                <Stack gap="xs" mt="sm" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {loading && <Loader size="sm" mx="auto" />}

                    {!loading && users.length === 0 && searchValue && (
                        <Text c="dimmed" size="sm" ta="center">No users found</Text>
                    )}

                    {!loading && users.map(user => (
                        <UnstyledButton
                            key={user._id}
                            onClick={() => handleStartChat(user._id)}
                            p="sm"
                            style={{
                                borderRadius: '8px',
                                transition: 'background-color 0.2s',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            disabled={creating}
                        >
                            <Group>
                                <Avatar src={null} color="blue" radius="xl">{user.username[0]}</Avatar>
                                <div>
                                    <Text size="sm" fw={500}>{user.username}</Text>
                                    <Text size="xs" c="dimmed">{user.email}</Text>
                                </div>
                            </Group>
                        </UnstyledButton>
                    ))}
                </Stack>
            </Stack>
        </Modal>
    );
};

export default CreateChatModal;
