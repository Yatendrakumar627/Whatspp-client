import React from 'react';
import { Modal, Avatar, Text, Stack, Group, ActionIcon, Button, ScrollArea, Divider } from '@mantine/core';
import { IoClose, IoTrashOutline, IoPersonAddOutline } from "react-icons/io5";
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';

const GroupInfoModal = ({ opened, onClose, chat }) => {
    const { api, fetchChats, setSelectedChat } = useChat();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const isAdmin = chat?.admins?.includes(user?._id) || chat?.groupAdmins?.includes(user?._id); // API returns admins or groupAdmins

    const handleRemoveUser = async (userId) => {
        if (!confirm("Remove this user?")) return;
        try {
            await api.put('/chats/group/remove', { chatId: chat._id, userId });
            notifications.show({ title: 'Removed', message: 'User removed from group', color: 'green' });
            fetchChats(); // basic refresh
            onClose(); // close to avoid stale state or need re-fetch logic inside modal
        } catch (e) {
            notifications.show({ title: 'Error', message: e.response?.data?.message || 'Failed', color: 'red' });
        }
    };

    const handleLeaveGroup = async () => {
        if (!confirm("Leave this group?")) return;
        try {
            await api.put('/chats/group/remove', { chatId: chat._id, userId: user._id });
            notifications.show({ title: 'Left', message: 'You left the group', color: 'blue' });
            fetchChats();
            setSelectedChat(null);
            onClose();
        } catch (e) {
            notifications.show({ title: 'Error', message: e.response?.data?.message || 'Failed', color: 'red' });
        }
    };

    return (
        <Modal opened={opened} onClose={onClose} title="Group Info" centered>
            <Stack align="center" mt="md">
                <Avatar size="xl" radius="xl" color="orange" src={chat?.chatImage}>
                    {chat?.chatName?.[0]}
                </Avatar>
                <Text size="xl" fw={700}>{chat?.chatName}</Text>
                <Text c="dimmed" size="sm">Group · {chat?.participants?.length} participants</Text>
            </Stack>

            <Divider my="md" />

            <Text size="sm" fw={600} mb="xs" c="dimmed">Participants</Text>
            <ScrollArea h={300}>
                <Stack gap="sm">
                    {chat?.participants?.map(p => (
                        <Group key={p._id} justify="space-between">
                            <Group>
                                <Avatar src={null} radius="xl" color="blue">{p.username?.[0]}</Avatar>
                                <Stack gap={0}>
                                    <Text size="sm">{p.username} {p._id === user._id && "(You)"}</Text>
                                    {(chat.admins?.includes(p._id) || chat.groupAdmins?.includes(p._id)) && (
                                        <Text size="xs" c="green">Admin</Text>
                                    )}
                                </Stack>
                            </Group>
                            {isAdmin && p._id !== user._id && (
                                <ActionIcon color="red" variant="subtle" onClick={() => handleRemoveUser(p._id)}>
                                    <IoTrashOutline />
                                </ActionIcon>
                            )}
                        </Group>
                    ))}
                </Stack>
            </ScrollArea>

            <Divider my="md" />

            <Button color="red" variant="light" fullWidth onClick={handleLeaveGroup}>
                Exit Group
            </Button>
        </Modal>
    );
};

export default GroupInfoModal;
