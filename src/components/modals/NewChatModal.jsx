import React from 'react';
import { Modal, Stack, Avatar, Text, UnstyledButton, Group, TextInput, Flex, Loader, Box } from '@mantine/core';
import { IoSearchOutline } from "react-icons/io5";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';

const NewChatModal = ({ opened, onClose }) => {
    const { token } = useAuth();
    const { chats, setSelectedChat, fetchMessages } = useChat();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (opened && token) {
            setLoading(true);
            axios.get('/auth/users')
                .then(res => setUsers(res.data))
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [opened, token]);

    const startChat = async (recipientId) => {
        try {
            const { data } = await axios.post('/chats', { recipientId });
            // Ideally ChatContext should update its chats list locally or re-fetch
            // For now force reload or we need a method in context to addChat
            window.location.reload(); // Simple refresh to load new chat or rely on context
            // But let's try to set it if we can
            // setSelectedChat(data._id);
            onClose();
        } catch (error) {
            console.error(error);
        }
    };

    const filteredUsers = users.filter(u => u.username.toLowerCase().includes(search.toLowerCase()));

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title="New Chat"
            centered
            styles={{
                header: { backgroundColor: '#202329', color: 'white' },
                content: { backgroundColor: '#202329', color: 'white' }
            }}
        >
            <TextInput
                placeholder="Search users"
                leftSection={<IoSearchOutline />}
                mb="md"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                styles={{ input: { backgroundColor: '#2A2D35', border: 'none', color: '#fff' } }}
            />

            {loading ? (
                <Flex justify="center" p="xl"><Loader color="teal" /></Flex>
            ) : (
                <Stack>
                    {filteredUsers.map(user => (
                        <UnstyledButton
                            key={user._id}
                            p="sm"
                            onClick={() => startChat(user._id)}
                            style={{ borderRadius: 8 }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2A2D35'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <Group>
                                <Avatar color="blue" radius="xl">{user.username[0]}</Avatar>
                                <Box>
                                    <Text c="white">{user.username}</Text>
                                    <Text size="xs" c="dimmed">{user.email}</Text>
                                </Box>
                            </Group>
                        </UnstyledButton>
                    ))}
                    {filteredUsers.length === 0 && <Text c="dimmed" ta="center">No users found</Text>}
                </Stack>
            )}
        </Modal>
    );
};

export default NewChatModal;
