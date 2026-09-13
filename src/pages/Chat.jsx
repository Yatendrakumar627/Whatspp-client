import React, { useState } from 'react';
import { Flex, Text, Center, Box, Title, Stack } from '@mantine/core';
import { FaWhatsapp } from 'react-icons/fa';
import NavigationRail from '../components/NavigationRail';
import ChatWindow from '../components/layout/ChatWindow';
import MobileNav from '../components/layout/MobileNav';
import Sidebar from '../components/Sidebar';
import SettingsSidebar from '../components/SettingsSidebar';
import CallsSidebar from '../components/CallsSidebar';
import StatusSidebar from '../components/StatusSidebar';
import CommunitiesSidebar from '../components/CommunitiesSidebar';
import { useChat } from '../context/ChatContext';

import ProfileSidebar from '../components/ProfileSidebar';
import ChatSettingsSidebar from '../components/ChatSettingsSidebar';

export default function Chat() {
    const { selectedChat } = useChat();
    const [activeTab, setActiveTab] = useState('chats');
    const [prevTab, setPrevTab] = useState('chats');

    const handleTabChange = (tab) => {
        setPrevTab(activeTab);
        setActiveTab(tab);
    };

    const renderSidebar = () => {
        switch (activeTab) {
            case 'settings': return (
                <SettingsSidebar
                    onProfileClick={() => handleTabChange('profile')}
                    onChatsClick={() => handleTabChange('chat_settings')}
                />
            );
            case 'calls': return <CallsSidebar />;
            case 'status': return <StatusSidebar />;
            case 'communities': return <CommunitiesSidebar />;
            case 'profile': return <ProfileSidebar onBack={() => setActiveTab(prevTab)} />;
            case 'chat_settings': return <ChatSettingsSidebar onBack={() => setActiveTab('settings')} />;
            default: return <Sidebar />;
        }
    };

    return (
        <Flex h="100vh" bg="var(--wa-bg)" style={{ overflow: 'hidden', position: 'relative' }}>
            {/* Desktop Navigation Rail */}
            <Box display={{ base: 'none', sm: 'block' }}>
                <NavigationRail active={activeTab} onSelect={handleTabChange} />
            </Box>

            {/* Sidebar Area */}
            <Box
                w={{ base: '100%', sm: 340 }}
                h="100%"
                style={{
                    borderRight: '1px solid var(--wa-border)',
                    transition: 'all 0.3s ease'
                }}
                display={{ base: selectedChat ? 'none' : 'block', sm: 'block' }}
                pb={{ base: selectedChat ? 0 : 65, sm: 0 }} // Room for mobile nav
            >
                {renderSidebar()}
            </Box>

            {/* Chat Area */}
            <Box
                style={{ flex: 1, position: 'relative' }}
                display={{ base: selectedChat ? 'block' : 'none', sm: 'block' }}
            >
                {selectedChat ? (
                    <ChatWindow />
                ) : (
                    <Box
                        h="100%"
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'var(--wa-bg)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        <Box
                            style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: '6px',
                                backgroundColor: 'var(--wa-green)',
                                opacity: 0.8
                            }}
                        />
                        <Center style={{ flexDirection: 'column' }}>
                            <Stack align="center" gap="xl">
                                <Box style={{ position: 'relative' }}>
                                    <FaWhatsapp size={100} color="var(--wa-text-secondary)" style={{ opacity: 0.15 }} />
                                </Box>
                                <Box style={{ textAlign: 'center' }}>
                                    <Title c="var(--wa-text-primary)" order={2} fw={600} style={{ letterSpacing: '-0.5px' }}>
                                        Download WhatsApp for Windows
                                    </Title>
                                    <Text c="var(--wa-text-secondary)" size="sm" mt="md" maw={450}>
                                        Make calls, share your screen and get a faster experience when you download the Windows app.
                                    </Text>
                                </Box>
                            </Stack>
                        </Center>
                        <Box style={{ position: 'absolute', bottom: 40, opacity: 0.5 }}>
                            <Text size="xs" c="var(--wa-text-secondary)" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '10px' }}>🔒</span> End-to-end encrypted
                            </Text>
                        </Box>
                    </Box>
                )}
            </Box>

            {/* Mobile Bottom Navigation */}
            <Box display={{ base: selectedChat ? 'none' : 'block', sm: 'none' }}>
                <MobileNav active={activeTab} onSelect={handleTabChange} />
            </Box>
        </Flex>
    );
}
