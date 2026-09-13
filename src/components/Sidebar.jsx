import React, { useState } from 'react';
import { Paper, Text, ScrollArea, Avatar, Group, UnstyledButton, Divider, TextInput, Stack, ActionIcon, Box, Tooltip, Flex, Badge, Menu, Skeleton } from '@mantine/core';
import { IoSearchOutline, IoCreateOutline, IoEllipsisVertical, IoTrashOutline, IoChevronDownOutline, IoStarOutline, IoCheckboxOutline, IoCheckmarkDoneOutline, IoLockClosedOutline, IoLogOutOutline, IoPeopleOutline, IoBanOutline, IoQrCodeOutline } from "react-icons/io5";
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import CreateGroupModal from './CreateGroupModal';
import CreateChatModal from './CreateChatModal';
import DeviceLinkModal from './DeviceLinkModal';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';

export default function Sidebar({ onSelectChat }) {
    const { chats, selectedChat, setSelectedChat, api, loadingChats } = useChat();
    const { user, logout } = useAuth();
    const { onlineUsers } = useSocket();
    const [createGroupOpened, setCreateGroupOpened] = useState(false);
    const [createChatOpened, setCreateChatOpened] = useState(false);
    const [deviceLinkOpened, setDeviceLinkOpened] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredChats = chats.filter(chat => {
        if (searchQuery) {
            const name = chat.chatName || chat.recipientDisplayName || chat.recipientName || "";
            if (!name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        }
        if (activeFilter === 'groups') return chat.isGroup;
        if (activeFilter === 'unread') return chat.unreadCount > 0;
        return true;
    });

    const handleSelect = (chatId) => {
        setSelectedChat(chatId);
        if (onSelectChat) onSelectChat(chatId);
    };

    const isOnline = (chat) => chat && !chat.isGroup && onlineUsers && (Array.isArray(onlineUsers) ? onlineUsers.includes(chat.recipientId) : onlineUsers.has(chat.recipientId));

    const handleDeleteChat = (chatId, e) => {
        e.stopPropagation();
        modals.openConfirmModal({
            title: 'Delete Chat',
            centered: true,
            children: (
                <Text size="sm" c="var(--wa-text-primary)">
                    Are you sure you want to delete this chat? This action cannot be undone.
                </Text>
            ),
            labels: { confirm: 'Delete chat', cancel: 'Cancel' },
            confirmProps: { color: 'red' },
            onConfirm: async () => {
                try {
                    await api.delete(`/chats/${chatId}`);
                    notifications.show({ title: 'Success', message: 'Chat deleted', color: 'green' });
                    if (selectedChat === chatId) {
                        setSelectedChat(null);
                    }
                } catch (error) {
                    console.error("Delete Chat Error:", error);
                    notifications.show({ title: 'Error', message: 'Failed to delete chat', color: 'red' });
                }
            },
        });
    };

    const FilterPill = ({ label, id }) => (
        <Badge
            variant={activeFilter === id ? "filled" : "outline"}
            radius="xl"
            size="md"
            px={14}
            py={12}
            style={{
                cursor: 'pointer',
                backgroundColor: activeFilter === id ? 'var(--wa-green-accent)' : 'transparent',
                color: activeFilter === id ? '#111b21' : 'var(--wa-text-secondary)',
                borderColor: activeFilter === id ? 'transparent' : 'var(--wa-border-subtle)',
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '13px',
                transition: 'all 0.2s ease',
            }}
            onClick={() => setActiveFilter(id)}
        >
            {label}
        </Badge>
    );

    return (
        <Paper
            h="100%"
            radius={0}
            style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRight: '1px solid var(--wa-border)',
                backgroundColor: 'var(--wa-sidebar-bg)',
                zIndex: 2
            }}
        >
            <CreateGroupModal opened={createGroupOpened} onClose={() => setCreateGroupOpened(false)} />
            <CreateChatModal opened={createChatOpened} onClose={() => setCreateChatOpened(false)} />
            <DeviceLinkModal opened={deviceLinkOpened} onClose={() => setDeviceLinkOpened(false)} />

            {/* Header */}
            <Flex
                align="center"
                justify="space-between"
                h={64} // Matched with ChatWindow header
                px="md"
                className="glass-panel"
                style={{
                    borderBottom: 'none', // Sidebar header usually doesn't have a harsh border in new design
                }}
            >
                <Text size="xl" fw={700} c="var(--wa-text-primary)" style={{ letterSpacing: '-0.5px' }}>Chats</Text>
                <Group gap={8}>
                    <Tooltip label="New Chat">
                        <ActionIcon variant="transparent" size="lg" radius="xl" onClick={() => setCreateChatOpened(true)}>
                            <IoCreateOutline size={22} />
                        </ActionIcon>
                    </Tooltip>

                    <Menu shadow="xl" width={220} position="bottom-end" transitionProps={{ transition: 'pop-top-right' }}>
                        <Menu.Target>
                            <Tooltip label="Menu">
                                <ActionIcon variant="transparent" size="lg" radius="xl">
                                    <IoEllipsisVertical size={20} />
                                </ActionIcon>
                            </Tooltip>
                        </Menu.Target>

                        <Menu.Dropdown bg="var(--wa-popup-bg)" style={{ border: '1px solid var(--wa-border-subtle)' }}>
                            <Menu.Item leftSection={<IoPeopleOutline size={18} />} onClick={() => setCreateGroupOpened(true)}>New group</Menu.Item>
                            <Menu.Item leftSection={<IoQrCodeOutline size={18} />} onClick={() => setDeviceLinkOpened(true)}>Link a device</Menu.Item>
                            <Menu.Item leftSection={<IoStarOutline size={18} />}>Starred messages</Menu.Item>
                            <Menu.Item leftSection={<IoCheckboxOutline size={18} />}>Select chats</Menu.Item>
                            <Menu.Item leftSection={<IoCheckmarkDoneOutline size={18} />}>Mark all as read</Menu.Item>
                            <Menu.Divider />
                            <Menu.Item leftSection={<IoLockClosedOutline size={18} />}>App lock</Menu.Item>
                            <Menu.Item leftSection={<IoLogOutOutline size={18} />} onClick={logout} color="red">Log out</Menu.Item>
                        </Menu.Dropdown>
                    </Menu>
                </Group>
            </Flex>

            {/* Search */}
            <Box px="md" py="sm">
                <TextInput
                    placeholder="Search or start new chat"
                    leftSection={<IoSearchOutline size={18} color="var(--wa-text-secondary)" />}
                    radius="md"
                    size="sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.currentTarget.value)}
                    styles={{
                        input: {
                            backgroundColor: 'var(--wa-input-bg)',
                            border: 'none',
                            color: 'var(--wa-text-primary)',
                            paddingLeft: '40px',
                            height: '36px',
                            transition: 'all 0.2s ease',
                        }
                    }}
                />
            </Box>

            {/* Filters */}
            <Group px="md" pb="sm" gap={8} style={{ overflowX: 'auto', flexWrap: 'nowrap', scrollbarWidth: 'none' }}>
                <FilterPill label="All" id="all" />
                <FilterPill label="Unread" id="unread" />
                <FilterPill label="Groups" id="groups" />
            </Group>

            <Divider color="var(--wa-border)" opacity={0.3} />

            {/* Chat List */}
            <ScrollArea style={{ flex: 1 }} scrollbarSize={6} type="hover">
                <Stack gap={0}>
                    {loadingChats ? (
                        Array(5).fill(0).map((_, i) => (
                            <Box key={i} px="md" py={12}>
                                <Group wrap="nowrap">
                                    <Skeleton height={48} circle />
                                    <div style={{ flex: 1 }}>
                                        <Skeleton height={10} width="60%" radius="xl" mb={8} />
                                        <Skeleton height={8} width="40%" radius="xl" />
                                    </div>
                                </Group>
                            </Box>
                        ))
                    ) : (
                        filteredChats.map((chat) => (
                            <Box
                                className="chat-item animate-fade-in"
                                key={chat._id}
                                onClick={() => handleSelect(chat._id)}
                                px="md"
                                py={12}
                                style={{
                                    backgroundColor: selectedChat === chat._id ? 'var(--wa-active-bg)' : 'transparent',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    borderBottom: '1px solid var(--wa-border-subtle)'
                                }}
                            >
                                <Group align="center" wrap="nowrap" gap="md">
                                    <Box style={{ position: 'relative', flexShrink: 0 }}>
                                        <Avatar
                                            src={chat.chatImage || null}
                                            radius="xl"
                                            size={48}
                                            style={{
                                                border: 'none',
                                                flexShrink: 0
                                            }}
                                        >
                                            {chat.chatName?.[0] || chat.recipientName?.[0]}
                                        </Avatar>
                                        {isOnline(chat) && (
                                            <Box
                                                style={{
                                                    position: 'absolute',
                                                    bottom: 2,
                                                    right: 2,
                                                    width: 12,
                                                    height: 12,
                                                    borderRadius: '50%',
                                                    backgroundColor: 'var(--wa-green)',
                                                    border: '2px solid var(--wa-sidebar-bg)',
                                                    boxShadow: '0 0 6px rgba(0, 168, 132, 0.7)'
                                                }}
                                            />
                                        )}
                                    </Box>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <Group justify="space-between" align="baseline" mb={4}>
                                            <Text size="md" fw={500} c="var(--wa-text-primary)" truncate>
                                                {chat.chatName || chat.recipientDisplayName || chat.recipientName || "Unknown"}
                                            </Text>
                                            {chat.updatedAt && (
                                                <Text size="xs" c={chat.unreadCount > 0 ? "var(--wa-green-accent)" : "var(--wa-text-secondary)"} fw={chat.unreadCount > 0 ? 600 : 400}>
                                                    {new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                </Text>
                                            )}
                                        </Group>
                                        <Group justify="space-between" align="center" wrap="nowrap" gap="xs">
                                            <Text c="var(--wa-text-secondary)" size="sm" truncate style={{ flex: 1, lineHeight: '1.4' }}>
                                                {chat.lastMessage ? (
                                                    <span style={{
                                                        color: chat.unreadCount > 0 ? 'var(--wa-text-primary)' : 'var(--wa-text-secondary)',
                                                        fontWeight: chat.unreadCount > 0 ? 500 : 400
                                                    }}>
                                                        {(chat.lastMessage.sender === user?._id || chat.lastMessage.sender?._id === user?._id) && "You: "}
                                                        {chat.lastMessage.isDeletedForEveryone ? (
                                                            <span style={{ fontStyle: 'italic', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                                <IoBanOutline size={12} /> Deleted
                                                            </span>
                                                        ) : (
                                                            chat.lastMessage.type === 'image' ? "📷 Photo" : chat.lastMessage.content
                                                        )}
                                                    </span>
                                                ) : "No messages yet"}
                                            </Text>

                                            {chat.unreadCount > 0 && (
                                                <Badge
                                                    size="xs"
                                                    circle
                                                    bg="var(--wa-green-accent)"
                                                    c="#111b21"
                                                    h={20}
                                                    w={20}
                                                    style={{ fontWeight: 700 }}
                                                >
                                                    {chat.unreadCount}
                                                </Badge>
                                            )}

                                            <Menu shadow="xl" width={180} position="bottom-end" withinPortal>
                                                <Menu.Target>
                                                    <ActionIcon
                                                        variant="transparent"
                                                        size="sm"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="chat-chevron"
                                                        style={{ opacity: 0, transition: 'all 0.2s', width: 20, height: 20 }}
                                                    >
                                                        <IoChevronDownOutline size={16} />
                                                    </ActionIcon>
                                                </Menu.Target>
                                                <Menu.Dropdown bg="var(--wa-popup-bg)" p={4} style={{ border: '1px solid var(--wa-border-subtle)' }}>
                                                    <Menu.Item
                                                        color="red"
                                                        leftSection={<IoTrashOutline size={16} />}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteChat(chat._id, e);
                                                        }}
                                                    >
                                                        Delete chat
                                                    </Menu.Item>
                                                </Menu.Dropdown>
                                            </Menu>
                                        </Group>
                                    </div>
                                </Group>
                                <style>
                                    {`
                  .chat-item:hover { background-color: var(--wa-hover-bg) !important; }
                  .chat-item:hover .chat-chevron { opacity: 1 !important; }
                `}
                                </style>
                            </Box>
                        ))
                    )}
                    {filteredChats.length === 0 && !loadingChats && (
                        <Stack align="center" py="xl" gap="xs">
                            <Text c="dimmed" size="sm">No chats found.</Text>
                        </Stack>
                    )}
                </Stack>
            </ScrollArea>
        </Paper>
    );
}
