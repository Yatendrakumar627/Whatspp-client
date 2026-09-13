import React from 'react';
import { Paper, Group, UnstyledButton, Text, Box, Flex } from '@mantine/core';
import { IoChatbubbleEllipsesOutline, IoChatbubbleEllipses, IoCallOutline, IoCall, IoPeopleOutline, IoPeople, IoSettingsOutline, IoSettings, IoDiscOutline, IoDisc } from "react-icons/io5";

const MobileNav = ({ active, onSelect }) => {
    const items = [
        { id: 'chats', label: 'Chats', icon: IoChatbubbleEllipsesOutline, activeIcon: IoChatbubbleEllipses },
        { id: 'status', label: 'Updates', icon: IoDiscOutline, activeIcon: IoDisc },
        { id: 'communities', label: 'Communities', icon: IoPeopleOutline, activeIcon: IoPeople },
        { id: 'calls', label: 'Calls', icon: IoCallOutline, activeIcon: IoCall },
        { id: 'settings', label: 'Settings', icon: IoSettingsOutline, activeIcon: IoSettings },
    ];

    return (
        <Paper
            h={65}
            w="100%"
            radius={0}
            bg="var(--wa-glass-bg)"
            style={{
                borderTop: '1px solid var(--wa-border)',
                backdropFilter: 'var(--wa-blur)',
                WebkitBackdropFilter: 'var(--wa-blur)',
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 1000,
            }}
        >
            <Flex h="100%" align="center" justify="space-around" px="xs">
                {items.map((item) => {
                    const isActive = active === item.id;
                    const Icon = isActive ? item.activeIcon : item.icon;

                    return (
                        <UnstyledButton
                            key={item.id}
                            onClick={() => onSelect(item.id)}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '4px',
                                flex: 1,
                                height: '100%',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <Box
                                style={{
                                    backgroundColor: isActive ? 'rgba(0, 168, 132, 0.15)' : 'transparent',
                                    padding: '4px 20px',
                                    borderRadius: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                <Icon
                                    size={24}
                                    color={isActive ? 'var(--wa-green)' : 'var(--wa-text-secondary)'}
                                />
                            </Box>
                            <Text
                                size="xs"
                                fw={isActive ? 700 : 500}
                                c={isActive ? 'var(--wa-text-primary)' : 'var(--wa-text-secondary)'}
                                style={{
                                    fontSize: '11px',
                                    letterSpacing: '0.2px'
                                }}
                            >
                                {item.label}
                            </Text>
                        </UnstyledButton>
                    );
                })}
            </Flex>
        </Paper>
    );
};

export default MobileNav;
