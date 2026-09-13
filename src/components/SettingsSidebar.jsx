import React from 'react';
import { Paper, Text, Avatar, Group, UnstyledButton, TextInput, Stack, Box, Divider, ScrollArea, ActionIcon, Flex } from '@mantine/core';
import {
    IoSearchOutline,
    IoLaptopOutline,
    IoKeyOutline,
    IoLockClosedOutline,
    IoChatbubbleOutline,
    IoVideocamOutline,
    IoNotificationsOutline,
    IoKeypadOutline,
    IoHelpCircleOutline,
    IoLogOutOutline,
    IoArrowBack
} from "react-icons/io5";
import { useAuth } from '../context/AuthContext';
import WallpaperSettings from './settings/WallpaperSettings';
import ChatSettings from './settings/ChatSettings';
import { useState } from 'react';

export default function SettingsSidebar({ onProfileClick, onChatsClick, onBack }) {
    const { user, logout } = useAuth();
    const [currentView, setCurrentView] = useState('main'); // main, chat_settings, wallpaper

    if (currentView === 'chat_settings') {
        return (
            <ChatSettings
                onBack={() => setCurrentView('main')}
                onWallpaperClick={() => setCurrentView('wallpaper')}
            />
        );
    }

    if (currentView === 'wallpaper') {
        return <WallpaperSettings onBack={() => setCurrentView('chat_settings')} />;
    }

    const MenuItem = ({ icon: Icon, label, subLabel, onClick, color }) => (
        <UnstyledButton
            p="md"
            onClick={onClick}
            style={{
                transition: 'all 0.2s ease',
                '&:hover': {
                    backgroundColor: 'var(--wa-active-bg)',
                    paddingLeft: '20px'
                }
            }}
        >
            <Group>
                <Icon size={22} color={color || "var(--wa-text-secondary)"} />
                <Box>
                    <Text size="md" c={color || "var(--wa-text-primary)"} fw={500}>{label}</Text>
                    {subLabel && <Text size="xs" c="var(--wa-text-secondary)" mt={2}>{subLabel}</Text>}
                </Box>
            </Group>
        </UnstyledButton>
    );

    return (
        <Paper
            h="100%"
            radius={0}
            style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'var(--wa-sidebar-bg)',
                zIndex: 2
            }}
            bg="var(--wa-sidebar-bg)"
        >
            {/* Header */}
            <Flex
                h={64}
                px="md"
                align="center"
                style={{
                    borderBottom: '1px solid var(--wa-border)',
                    flexShrink: 0,
                    backgroundColor: 'var(--wa-header-bg)',
                    backdropFilter: 'var(--wa-blur)',
                    WebkitBackdropFilter: 'var(--wa-blur)',
                }}
            >
                <Group gap="md">
                    <Text size="xl" fw={800} c="var(--wa-text-primary)" style={{ letterSpacing: '-0.5px' }}>Settings</Text>
                </Group>
            </Flex>

            {/* Search */}
            <Box px="md" py="sm">
                <TextInput
                    placeholder="Search settings"
                    leftSection={<IoSearchOutline size={18} color="var(--wa-text-secondary)" />}
                    radius="lg"
                    size="sm"
                    styles={{
                        input: {
                            backgroundColor: 'var(--wa-active-bg)',
                            border: '1px solid transparent',
                            color: 'var(--wa-text-primary)',
                            paddingLeft: '40px',
                            transition: 'all 0.2s ease',
                            '&:focus': {
                                borderColor: 'var(--wa-green)',
                                boxShadow: '0 0 0 2px rgba(0, 168, 132, 0.15)',
                                backgroundColor: 'var(--wa-sidebar-bg)'
                            },
                        }
                    }}
                />
            </Box>

            <ScrollArea style={{ flex: 1 }} type="hover">
                <Stack gap={0}>
                    {/* Profile Section */}
                    <UnstyledButton
                        p="md"
                        style={{
                            transition: 'background-color 0.2s',
                            '&:hover': { backgroundColor: 'var(--wa-active-bg)' }
                        }}
                        onClick={onProfileClick}
                    >
                        <Group gap="md">
                            <Avatar
                                src={user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : `http://localhost:5200${user.avatar}`) : null}
                                radius="xl"
                                size={60}
                                color="teal"
                                style={{ border: '2px solid var(--wa-border)' }}
                            >
                                {user?.username?.[0]?.toUpperCase()}
                            </Avatar>
                            <Box style={{ flex: 1 }}>
                                <Text size="lg" fw={600} c="var(--wa-text-primary)">{user?.username}</Text>
                                <Text size="sm" c="var(--wa-text-secondary)" lineClamp={1}>{user?.about || 'Hey there! I am using WhatsApp.'}</Text>
                            </Box>
                        </Group>
                    </UnstyledButton>

                    <Divider my="xs" color="var(--wa-border)" opacity={0.5} />

                    <MenuItem icon={IoLaptopOutline} label="General" subLabel="Startup and close" />
                    <MenuItem icon={IoKeyOutline} label="Account" subLabel="Security notifications, account info" />
                    <MenuItem icon={IoLockClosedOutline} label="Privacy" subLabel="Blocked contacts, disappearing messages" />
                    <MenuItem
                        icon={IoChatbubbleOutline}
                        label="Chats"
                        subLabel="Theme, wallpaper, chat settings"
                        onClick={() => setCurrentView('chat_settings')}
                    />
                    <MenuItem icon={IoVideocamOutline} label="Video & voice" subLabel="Camera, microphone & speakers" />
                    <MenuItem icon={IoNotificationsOutline} label="Notifications" subLabel="Message notifications" />
                    <MenuItem icon={IoKeypadOutline} label="Keyboard shortcuts" subLabel="Quick actions" />
                    <MenuItem icon={IoHelpCircleOutline} label="Help and feedback" subLabel="Help centre, contact us, privacy policy" />

                    <Divider my="sm" color="var(--wa-border)" opacity={0.5} />

                    <MenuItem
                        icon={IoLogOutOutline}
                        label="Log out"
                        color="#ef5350"
                        onClick={logout}
                    />

                    <Box py="xl" />
                </Stack>
            </ScrollArea>
        </Paper>
    );
}
