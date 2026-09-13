import React from 'react';
import { Paper, Text, Group, Stack, Box, ActionIcon, Divider, Flex, Switch, Modal, Radio, Button } from '@mantine/core';
import { IoArrowBack, IoChevronForward } from "react-icons/io5";
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { useMantineColorScheme } from '@mantine/core';
import WallpaperSettings from './settings/WallpaperSettings';

export default function ChatSettingsSidebar({ onBack }) {
    const { user, setUser } = useAuth();
    const { setColorScheme } = useMantineColorScheme();
    const [themeModalOpen, setThemeModalOpen] = useState(false);
    const [tempTheme, setTempTheme] = useState(user?.settings?.theme || 'system');

    const settings = user?.settings || {
        enterIsSend: true,
        spellCheck: true,
        replaceTextWithEmoji: true,
        theme: 'system',
        wallpaper: ''
    };

    const handleToggle = async (key, value) => {
        try {
            const res = await axios.put('/users/profile', {
                settings: { [key]: value }
            });
            setUser(res.data);
            notifications.show({ title: 'Success', message: 'Setting updated', color: 'teal', autoClose: 1000 });
        } catch (error) {
            console.error("Settings Update Error:", error);
            notifications.show({ title: 'Error', message: 'Failed to update setting', color: 'red' });
        }
    };

    const handleThemeConfirm = async () => {
        try {
            const res = await axios.put('/users/profile', {
                settings: { theme: tempTheme }
            });
            setUser(res.data);

            if (tempTheme === 'system') setColorScheme('auto');
            else setColorScheme(tempTheme);

            setThemeModalOpen(false);
            notifications.show({ title: 'Success', message: 'Theme updated', color: 'teal', autoClose: 1000 });
        } catch (error) {
            console.error("Theme Update Error:", error);
            notifications.show({ title: 'Error', message: 'Failed to update theme', color: 'red' });
        }
    };

    const SettingItem = ({ label, subLabel, value, onChange, isToggle = true, onClick }) => (
        <Box
            px="xl"
            py="md"
            style={{
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': { backgroundColor: 'var(--wa-active-bg)' }
            }}
            onClick={onClick}
        >
            <Group justify="space-between" align="center" wrap="nowrap">
                <Box style={{ flex: 1 }}>
                    <Text size="md" fw={500} c="var(--wa-text-primary)">{label}</Text>
                    {subLabel && <Text size="xs" c="var(--wa-text-secondary)" mt={2}>{subLabel}</Text>}
                </Box>
                {isToggle ? (
                    <Switch
                        checked={value}
                        onChange={(event) => onChange(event.currentTarget.checked)}
                        size="md"
                        color="teal"
                    />
                ) : (
                    <IoChevronForward size={18} color="var(--wa-text-secondary)" />
                )}
            </Group>
        </Box>
    );

    const [showWallpaper, setShowWallpaper] = useState(false);

    if (showWallpaper) {
        return <WallpaperSettings onBack={() => setShowWallpaper(false)} />;
    }

    const themeLabels = {
        'light': 'Light',
        'dark': 'Dark',
        'system': 'System default'
    };

    return (
        <>
            <Paper
                h="100%"
                radius={0}
                style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'var(--wa-sidebar-bg)',
                    zIndex: 4
                }}
            >
                {/* Header */}
                <Flex
                    h={50}
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
                        <ActionIcon variant="subtle" radius="xl" onClick={onBack} size="lg" style={{ color: 'var(--wa-text-primary)' }}>
                            <IoArrowBack size={24} />
                        </ActionIcon>
                        <Text size="xl" fw={800} c="var(--wa-text-primary)" style={{ letterSpacing: '-0.5px' }}>Chats</Text>
                    </Group>
                </Flex>

                <Stack gap={0} style={{ overflowY: 'auto', flex: 1 }}>
                    <Box py="sm">
                        <Text size="sm" c="var(--wa-green)" px="xl" py="sm" fw={700} tt="uppercase" style={{ letterSpacing: '0.5px' }}>
                            Display
                        </Text>
                        <SettingItem
                            label="Theme"
                            subLabel={themeLabels[settings.theme] || 'System default'}
                            isToggle={false}
                            onClick={(e) => {
                                e.stopPropagation();
                                setTempTheme(settings.theme);
                                setThemeModalOpen(true);
                            }}
                        />
                        <SettingItem
                            label="Wallpaper"
                            isToggle={false}
                            onClick={() => setShowWallpaper(true)}
                        />
                    </Box>

                    <Divider color="var(--wa-border)" mx="xl" opacity={0.5} />

                    <Box py="sm">
                        <Text size="sm" c="var(--wa-green)" px="xl" py="sm" fw={700} tt="uppercase" style={{ letterSpacing: '0.5px' }}>
                            Chat settings
                        </Text>
                        <SettingItem
                            label="Media upload quality"
                            isToggle={false}
                        />
                        <SettingItem
                            label="Media auto-download"
                            isToggle={false}
                        />

                        <SettingItem
                            label="Spell check"
                            subLabel="Check spelling while typing"
                            value={settings.spellCheck}
                            onChange={(val) => handleToggle('spellCheck', val)}
                        />
                        <SettingItem
                            label="Replace text with emoji"
                            subLabel="Emoji will replace specific text as you type"
                            value={settings.replaceTextWithEmoji}
                            onChange={(val) => handleToggle('replaceTextWithEmoji', val)}
                        />
                        <SettingItem
                            label="Enter is send"
                            subLabel="Enter key will send your message"
                            value={settings.enterIsSend}
                            onChange={(val) => handleToggle('enterIsSend', val)}
                        />
                    </Box>

                    <Box py="xl" />
                </Stack>
            </Paper>

            <Modal
                opened={themeModalOpen}
                onClose={() => setThemeModalOpen(false)}
                title="Theme"
                centered
                size="sm"
                radius="lg"
                overlayProps={{
                    backgroundOpacity: 0.55,
                    blur: 3,
                }}
                styles={{
                    content: { backgroundColor: 'var(--wa-sidebar-bg)', color: 'var(--wa-text-primary)' },
                    header: { backgroundColor: 'var(--wa-sidebar-bg)', color: 'var(--wa-text-primary)' },
                    title: { fontSize: '24px', fontWeight: 700, letterSpacing: '-0.5px' }
                }}
            >
                <Radio.Group
                    value={tempTheme}
                    onChange={setTempTheme}
                    p="sm"
                >
                    <Stack gap="xl">
                        <Radio value="light" label="Light" color="teal" size="xs" styles={{ label: { color: 'var(--wa-text-primary)', fontSize: '14px', fontWeight: 500 } }} />
                        <Radio value="dark" label="Dark" color="teal" size="xs" styles={{ label: { color: 'var(--wa-text-primary)', fontSize: '14px', fontWeight: 500 } }} />
                        <Radio value="system" label="System default" color="teal" size="xs" styles={{ label: { color: 'var(--wa-text-primary)', fontSize: '14px', fontWeight: 500 } }} />
                    </Stack>
                </Radio.Group>

                <Group justify="flex-end" mt="xl" gap="sm">
                    <Button variant="subtle" color="gray" radius="xl" onClick={() => setThemeModalOpen(false)}>
                        Cancel
                    </Button>
                    <Button variant="filled" color="teal" radius="xl" px="xl" onClick={handleThemeConfirm}>
                        OK
                    </Button>
                </Group>
            </Modal>
        </>
    );
}
