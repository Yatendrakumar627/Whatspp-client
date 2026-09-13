import React from 'react';
import { ActionIcon, Avatar, Box, Flex, ScrollArea, Text, TextInput, Tooltip, UnstyledButton, Group, Stack, Menu, Divider } from '@mantine/core';
import { IoSearchOutline, IoChatboxEllipsesOutline, IoEllipsisVertical, IoPeopleOutline, IoStarOutline, IoCheckboxOutline, IoCheckmarkDoneOutline, IoLockClosedOutline, IoLogOutOutline } from "react-icons/io5";
import { BiMessageSquareAdd } from "react-icons/bi";
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useState } from 'react';
import NewChatModal from '../modals/NewChatModal';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const { chats, selectedChat, setSelectedChat, loadingChats } = useChat();
    const [modalOpen, setModalOpen] = useState(false);

    return (
        <Flex direction="column" h="100%" style={{ borderRight: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#111B21' }}>
            <NewChatModal opened={modalOpen} onClose={() => setModalOpen(false)} />

            {/* Header */}
            <Flex justify="space-between" align="center" p="md" h={60} bg="#111B21">
                <Text fw={700} size="xl" c="#e9edef">Chats</Text>
                <Group gap="xs">
                    <Tooltip label="New Chat">
                        <ActionIcon variant="subtle" color="gray" size="lg" onClick={() => setModalOpen(true)}>
                            <BiMessageSquareAdd size={22} color="#aebac1" />
                        </ActionIcon>
                    </Tooltip>

                    <Menu shadow="md" width={220} position="bottom-end" transitionProps={{ transition: 'pop-top-right' }}>
                        <Menu.Target>
                            <Tooltip label="Menu">
                                <ActionIcon variant="subtle" color="gray" size="lg">
                                    <IoEllipsisVertical size={20} color="#aebac1" />
                                </ActionIcon>
                            </Tooltip>
                        </Menu.Target>

                        <Menu.Dropdown bg="#233138" style={{ border: 'none', padding: '8px 0' }}>
                            <Menu.Item leftSection={<IoPeopleOutline size={20} />} style={{ height: 40, padding: '0 20px' }} c="#e9edef">
                                New group
                            </Menu.Item>
                            <Menu.Item leftSection={<IoStarOutline size={20} />} style={{ height: 40, padding: '0 20px' }} c="#e9edef">
                                Starred messages
                            </Menu.Item>
                            <Menu.Item leftSection={<IoCheckboxOutline size={20} />} style={{ height: 40, padding: '0 20px' }} c="#e9edef">
                                Select chats
                            </Menu.Item>
                            <Menu.Item leftSection={<IoCheckmarkDoneOutline size={20} />} style={{ height: 40, padding: '0 20px' }} c="#e9edef">
                                Mark all as read
                            </Menu.Item>
                            <Divider color="rgba(255,255,255,0.05)" my={4} />
                            <Menu.Item leftSection={<IoLockClosedOutline size={20} />} style={{ height: 40, padding: '0 20px' }} c="#e9edef">
                                App lock
                            </Menu.Item>
                            <Menu.Item leftSection={<IoLogOutOutline size={20} />} onClick={logout} style={{ height: 40, padding: '0 20px' }} c="#e9edef">
                                Log out
                            </Menu.Item>
                        </Menu.Dropdown>
                    </Menu>
                </Group>
            </Flex>

            {/* Search */}
            <Box p="sm" pb="xs" bg="#111B21">
                <TextInput
                    placeholder="Search by Unique Name or start new chat"
                    leftSection={<IoSearchOutline color="#aebac1" size={18} />}
                    styles={{
                        input: {
                            backgroundColor: '#202C33',
                            border: 'none',
                            color: '#e9edef',
                            '&::placeholder': { color: '#8696a0' }
                        }
                    }}
                    radius="md"
                />
            </Box>

            {/* Chat List */}
            <ScrollArea style={{ flex: 1 }}>
                <Stack gap={0}>
                    {chats.map((chat, index) => (
                        <UnstyledButton
                            key={chat._id || index}
                            p="md"
                            onClick={() => setSelectedChat(chat._id)}
                            bg={selectedChat === chat._id ? '#2A2D35' : 'transparent'}
                            style={{
                                borderBottom: '1px solid #2C2E33',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = selectedChat === chat._id ? '#2A2D35' : '#202329'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedChat === chat._id ? '#2A2D35' : 'transparent'}
                        >
                            <Flex gap="md" align="center">
                                <Avatar size="lg" radius="xl" color="blue" src={null} alt={chat.recipientName}>
                                    {chat.recipientName?.[0]}
                                </Avatar>
                                <Box style={{ flex: 1, minWidth: 0 }}>
                                    <Flex justify="space-between" align="baseline">
                                        <Text c="white" fw={500}>{chat.recipientDisplayName || chat.recipientName || 'User'}</Text>
                                        <Text size="xs" c="dimmed">
                                            {new Date(chat?.updatedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </Flex>
                                    <Text size="sm" c="dimmed" truncate>{chat.lastMessage?.content || ""}</Text>
                                </Box>
                            </Flex>
                        </UnstyledButton>
                    ))}
                    {chats.length === 0 && (
                        <Text c="dimmed" ta="center" mt="xl">
                            No chats yet<br />
                            <Text component="span" size="sm" c="blue" style={{ cursor: 'pointer' }} onClick={() => setModalOpen(true)}>
                                Start a conversation
                            </Text>
                        </Text>
                    )}
                </Stack>
            </ScrollArea>
        </Flex>
    );
};

export default Sidebar;
