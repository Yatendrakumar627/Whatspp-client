import React from 'react';
import { Paper, Text, Group, Box, ActionIcon, Switch, UnstyledButton, Stack, Divider, useMantineColorScheme, Modal, Radio, Button, Flex } from '@mantine/core';
import { IoArrowBack, IoChevronForward } from "react-icons/io5";
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

export default function ChatSettings({ onBack, onWallpaperClick }) {
    const { user, updateProfile } = useAuth();
    // Local state for immediate UI feedback, though updating profile is fast
    const [settings, setSettings] = useState(user?.settings || {});
    const [themeModalOpen, setThemeModalOpen] = useState(false);
    const [tempTheme, setTempTheme] = useState(user?.settings?.theme || 'system');

    const handleToggle = async (key, checked) => {
        const newSettings = { ...settings, [key]: checked };
        setSettings(newSettings); // Optimistic update
        try {
            await updateProfile({ settings: { [key]: checked } });
        } catch (error) {
            console.error(`Failed to update ${key}`, error);
            setSettings(settings); // Revert
        }
    };

    const handleThemeSave = async () => {
        try {
            await updateProfile({ settings: { theme: tempTheme } });
            setSettings(prev => ({ ...prev, theme: tempTheme }));
            setThemeModalOpen(false);
        } catch (error) {
            console.error("Failed to update theme", error);
        }
    };

    const MenuItem = ({ label, subLabel, onClick, rightSection }) => (
        <UnstyledButton
            p="md"
            onClick={onClick}
            style={{
                transition: 'background-color 0.2s',
                '&:hover': { backgroundColor: 'var(--wa-active-bg)' }
            }}
        >
            <Group justify="space-between">
                <Box>
                    <Text size="md" c="var(--wa-text-primary)">{label}</Text>
                    {subLabel && <Text size="sm" c="var(--wa-text-secondary)">{subLabel}</Text>}
                </Box>
                {rightSection || <IoChevronForward size={18} color="var(--wa-text-secondary)" />}
            </Group>
        </UnstyledButton>
    );

    const ToggleItem = ({ label, subLabel, checked, onChange }) => (
        <Group justify="space-between" p="md" style={{ '&:hover': { backgroundColor: 'transparent' } }}>
            <Box>
                <Text size="md" c="var(--wa-text-primary)">{label}</Text>
                <Text size="sm" c="var(--wa-text-secondary)">{subLabel}</Text>
            </Box>
            <Switch
                checked={checked}
                onChange={(event) => onChange(event.currentTarget.checked)}
                color="green"
                size="md"
            />
        </Group>
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
                    <ActionIcon variant="transparent" onClick={onBack} style={{ color: 'var(--wa-text-primary)' }}>
                        <IoArrowBack size={24} />
                    </ActionIcon>
                    <Text size="xl" fw={800} c="var(--wa-text-primary)" style={{ letterSpacing: '-0.5px' }}>Chats</Text>
                </Group>
            </Flex>

            <Box style={{ flex: 1, overflowY: 'auto' }}>
                <Stack gap={0} py="sm">

                    <Text size="sm" fw={700} c="var(--wa-green)" px="md" py="xs">Display</Text>

                    <MenuItem
                        label="Theme"
                        subLabel={user?.settings?.theme === 'system' ? 'System default' : (user?.settings?.theme === 'dark' ? 'Dark' : 'Light')}
                        onClick={() => {
                            setTempTheme(user?.settings?.theme || 'system');
                            setThemeModalOpen(true);
                        }}
                    />

                    <MenuItem
                        label="Wallpaper"
                        onClick={onWallpaperClick}
                    />

                    <Divider my="sm" color="var(--wa-border)" />

                    <Text size="sm" fw={700} c="var(--wa-green)" px="md" py="xs">Chat settings</Text>

                    <MenuItem label="Media upload quality" subLabel="Auto (recommended)" />
                    <MenuItem label="Media auto-download" />

                    <Divider my="xs" color="transparent" />

                    <ToggleItem
                        label="Spell check"
                        subLabel="Check spelling while typing"
                        checked={settings.spellCheck}
                        onChange={(val) => handleToggle('spellCheck', val)}
                    />

                    <ToggleItem
                        label="Replace text with emoji"
                        subLabel="Emoji will replace specific text as you type"
                        checked={settings.replaceTextWithEmoji}
                        onChange={(val) => handleToggle('replaceTextWithEmoji', val)}
                    />

                    <ToggleItem
                        label="Enter is send"
                        subLabel="Enter key will send your message"
                        checked={settings.enterIsSend}
                        onChange={(val) => handleToggle('enterIsSend', val)}
                    />
                </Stack>
            </Box>

            <Modal
                opened={themeModalOpen}
                onClose={() => setThemeModalOpen(false)}
                title="Choose theme"
                centered
            >
                <Radio.Group
                    value={tempTheme}
                    onChange={setTempTheme}
                    name="theme"
                >
                    <Stack mt="xs">
                        <Radio value="system" label="System default" color="green" styles={{ label: { color: 'var(--wa-text-primary)' }, radio: { cursor: 'pointer' } }} />
                        <Radio value="light" label="Light" color="green" styles={{ label: { color: 'var(--wa-text-primary)' }, radio: { cursor: 'pointer' } }} />
                        <Radio value="dark" label="Dark" color="green" styles={{ label: { color: 'var(--wa-text-primary)' }, radio: { cursor: 'pointer' } }} />
                    </Stack>
                </Radio.Group>
                <Group justify="flex-end" mt="md">
                    <Button variant="subtle" color="green" onClick={() => setThemeModalOpen(false)}>Cancel</Button>
                    <Button variant="filled" color="green" onClick={handleThemeSave}>OK</Button>
                </Group>
            </Modal>
        </Paper>
    );
}
