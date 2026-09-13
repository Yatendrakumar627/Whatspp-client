import React from 'react';
import { Modal, TextInput, Button, Stack, Group, Avatar, Text, Checkbox, ScrollArea, ActionIcon, Box } from '@mantine/core';
import { useState, useEffect, useMemo } from 'react';
import { useChat } from '../../context/ChatContext';
import { useSocket } from '../../context/SocketContext';
import { notifications } from '@mantine/notifications';
import { IoArrowForward, IoSearchOutline, IoClose } from "react-icons/io5";

const ForwardModal = ({ opened, onClose, message }) => {
    const { chats } = useChat();
    const { socket } = useSocket();
    const [selected, setSelected] = useState([]);
    const [searchValue, setSearchValue] = useState('');
    const [forwarding, setForwarding] = useState(false);

    useEffect(() => {
        if (opened) {
            setSelected([]);
            setSearchValue('');
        }
    }, [opened]);

    const filteredChats = useMemo(() => {
        if (!searchValue.trim()) return chats;
        const q = searchValue.toLowerCase();
        return (chats || []).filter(c =>
            (c.chatName || c.recipientName || '').toLowerCase().includes(q)
        );
    }, [chats, searchValue]);

    const toggleChat = (chatId) => {
        setSelected(prev => prev.includes(chatId) ? prev.filter(id => id !== chatId) : [...prev, chatId]);
    };

    const handleForward = async () => {
        if (!selected.length || !message || !socket) return;
        setForwarding(true);
        try {
            selected.forEach(chatId => {
                socket.emit('forward_message', { messageId: message._id, targetChatId: chatId });
            });
            notifications.show({
                title: 'Forwarded',
                message: `Message sent to ${selected.length} chat${selected.length > 1 ? 's' : ''}`,
                color: 'teal'
            });
            onClose();
        } catch (e) {
            notifications.show({ title: 'Error', message: 'Failed to forward message', color: 'red' });
        } finally {
            setForwarding(false);
        }
    };

    const renderChatPreview = (chat) => {
        const preview = chat.lastMessage;
        const senderName = preview && typeof preview.sender === 'object' && preview.sender ? preview.sender.username : null;
        const label = preview
            ? (chat.isGroup && senderName ? `${senderName}: ${preview.content || 'Media'}` : (preview.content || 'Media'))
            : 'No messages yet';
        const time = preview ? new Date(preview.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
        return { label, time };
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title="Forward message"
            centered
            radius="lg"
            size="sm"
            styles={{
                header: { backgroundColor: 'var(--wa-header-bg)', color: 'var(--wa-text-primary)' },
                content: { backgroundColor: 'var(--wa-popup-bg)' }
            }}
        >
            <Stack gap="md">
                {message && (
                    <Group gap="sm" align="flex-start" p="xs" style={{ backgroundColor: 'var(--wa-active-bg)', borderRadius: '8px' }}>
                        <ActionIcon variant="light" color="teal" radius="md" size="lg">
                            <IoArrowForward size={18} />
                        </ActionIcon>
                        <Box style={{ flex: 1 }}>
                            <Text size="xs" c="var(--wa-text-secondary)" tt="uppercase" fw={700}>Forwarding {message.type !== 'text' ? message.type : ''}</Text>
                            <Text size="sm" c="var(--wa-text-primary)" lineClamp={1}>
                                {message.type === 'text' ? message.content : (message.type === 'image' ? '📷 Image' : message.type === 'audio' ? '🎤 Voice message' : message.type === 'video' ? '🎬 Video' : message.type === 'file' ? '📄 File' : message.content)}
                            </Text>
                        </Box>
                    </Group>
                )}

                <TextInput
                    placeholder="Search chats..."
                    leftSection={<IoSearchOutline size={16} />}
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    rightSection={searchValue ? <ActionIcon size="xs" variant="subtle" onClick={() => setSearchValue('')}><IoClose size={16} /></ActionIcon> : null}
                    styles={{
                        input: {
                            backgroundColor: 'var(--wa-input-bg)',
                            border: '1px solid var(--wa-border)',
                            color: 'var(--wa-text-primary)'
                        }
                    }}
                />

                <ScrollArea h={260} type="hover">
                    <Stack gap={4}>
                        {(filteredChats || []).map(chat => {
                            const isSelected = selected.includes(chat._id);
                            const { label, time } = renderChatPreview(chat);
                            return (
                                <Checkbox
                                    key={chat._id}
                                    checked={isSelected}
                                    onChange={() => toggleChat(chat._id)}
                                    styles={{
                                        body: { alignItems: 'center', width: '100%' },
                                        input: { backgroundColor: isSelected ? 'var(--wa-green)' : 'var(--wa-input-bg)' }
                                    }}
                                    label={(
                                        <Group gap="sm" p="xs" style={{ borderRadius: '8px', width: '100%' }}>
                                            <Avatar
                                                src={chat.chatImage || null}
                                                radius="xl"
                                                size={40}
                                                styles={{ placeholder: { background: 'var(--wa-premium-gradient)', color: 'white', fontWeight: 700 } }}
                                            >
                                                {(chat.chatName || chat.recipientName || '?')[0]}
                                            </Avatar>
                                            <Box style={{ flex: 1 }}>
                                                <Text size="sm" fw={600} c="var(--wa-text-primary)" lineClamp={1}>
                                                    {chat.chatName || chat.recipientName || 'Unknown'}
                                                </Text>
                                                <Text size="xs" c="var(--wa-text-secondary)" lineClamp={1}>
                                                    {label}
                                                </Text>
                                            </Box>
                                            <Text size="xs" c="var(--wa-text-secondary)">{time}</Text>
                                        </Group>
                                    )}
                                />
                            );
                        })}

                        {filteredChats.length === 0 && (
                            <Text size="sm" c="var(--wa-text-secondary)" ta="center" py="xl">No chats found</Text>
                        )}
                    </Stack>
                </ScrollArea>

                <Group justify="space-between" align="center">
                    <Text size="sm" c="var(--wa-text-secondary)">
                        {selected.length > 0 ? `${selected.length} selected` : 'Select chats to forward'}
                    </Text>
                    <Button
                        radius="xl"
                        color="teal"
                        onClick={handleForward}
                        disabled={!selected.length}
                        loading={forwarding}
                        leftSection={<IoArrowForward size={16} />}
                        styles={{ root: { background: 'var(--wa-premium-gradient)' } }}
                    >
                        Forward
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
};

export default ForwardModal;