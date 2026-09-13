import React from 'react';
import { Stack, ActionIcon, Tooltip, Box, Avatar, UnstyledButton, useMantineColorScheme } from '@mantine/core';
import { IoChatbubbleEllipsesOutline, IoCallOutline, IoPeopleOutline, IoSettingsOutline, IoDiscOutline, IoSunnyOutline, IoMoonOutline } from "react-icons/io5";
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const NavigationRail = ({ active, onSelect }) => {
    const { user, setUser } = useAuth();
    const { colorScheme, toggleColorScheme } = useMantineColorScheme();

    const handleThemeToggle = async () => {
        const newTheme = colorScheme === 'dark' ? 'light' : 'dark';
        toggleColorScheme();

        try {
            const res = await axios.put('/users/profile', {
                settings: { theme: newTheme }
            });
            setUser(res.data);
        } catch (error) {
            console.error("Failed to sync theme", error);
        }
    };

    const NavItem = ({ icon: Icon, label, id }) => (
        <Tooltip label={label} position="right" withArrow offset={10} transitionProps={{ transition: 'slide-right', duration: 200 }}>
            <ActionIcon
                variant="transparent"
                size={36}
                onClick={() => onSelect(id)}
                style={{
                    color: active === id ? 'var(--wa-green)' : 'var(--wa-text-secondary)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    backgroundColor: active === id ? 'rgba(0, 168, 132, 0.15)' : 'transparent',
                    borderRadius: '10px'
                }}
                className="nav-item-glass"
            >
                <Icon size={22} style={{ filter: active === id ? 'drop-shadow(0 0 4px rgba(0, 168, 132, 0.4))' : 'none' }} />
                {active === id && (
                    <Box
                        style={{
                            position: 'absolute',
                            left: -12,
                            top: '10%',
                            height: '80%',
                            width: '4px',
                            backgroundColor: 'var(--wa-green)',
                            borderRadius: '0 4px 4px 0',
                            boxShadow: '0 0 12px rgba(0, 168, 132, 0.6)'
                        }}
                    />
                )}
            </ActionIcon>
        </Tooltip>
    );

    return (
        <Stack
            justify="space-between"
            h="100%"
            w={64} // Slightly wider
            bg="var(--wa-nav-rail)"
            py="md"
            style={{
                borderRight: '1px solid var(--wa-border)',
                flexShrink: 0,
                zIndex: 100,
                backgroundColor: 'var(--wa-glass-bg)',
                backdropFilter: 'var(--wa-blur)',
                WebkitBackdropFilter: 'var(--wa-blur)',
            }}
        >
            <Stack gap="md" align="center">
                <NavItem icon={IoChatbubbleEllipsesOutline} label="Chats" id="chats" />
                <NavItem icon={IoCallOutline} label="Calls" id="calls" />
                <NavItem icon={IoDiscOutline} label="Status" id="status" />
                <NavItem icon={IoPeopleOutline} label="Communities" id="communities" />
            </Stack>

            <Stack gap="md" align="center">
                <Tooltip label={colorScheme === 'dark' ? 'Light mode' : 'Dark mode'} position="right" transitionProps={{ transition: 'slide-right' }}>
                    <ActionIcon
                        variant="transparent"
                        size={36}
                        onClick={() => handleThemeToggle()}
                        style={{
                            color: 'var(--wa-text-secondary)',
                            transition: 'all 0.4s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'rotate(45deg) scale(1.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'rotate(0deg) scale(1)'}
                    >
                        {colorScheme === 'dark' ? <IoSunnyOutline size={22} /> : <IoMoonOutline size={22} />}
                    </ActionIcon>
                </Tooltip>

                <NavItem icon={IoSettingsOutline} label="Settings" id="settings" />

                <Tooltip label="Profile" position="right" transitionProps={{ transition: 'slide-right' }}>
                    <UnstyledButton
                        onClick={() => onSelect('profile')}
                        style={{
                            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            padding: '6px',
                            borderRadius: '50%'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.15) rotate(5deg)';
                            e.currentTarget.style.boxShadow = '0 0 15px rgba(0,0,0,0.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <Avatar
                            src={user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : `http://localhost:5200${user.avatar}`) : null}
                            size={32}
                            radius="xl"
                            style={{ border: '2px solid transparent', transition: 'border-color 0.3s' }}
                        >
                            {user?.username?.[0]?.toUpperCase()}
                        </Avatar>
                    </UnstyledButton>
                </Tooltip>
            </Stack>
        </Stack>
    );
};

export default NavigationRail;
