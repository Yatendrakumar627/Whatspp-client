import React, { useState, useRef } from 'react';
import { Paper, Text, Group, Box, ActionIcon, Grid, ColorSwatch, Button, Checkbox, Slider, useMantineTheme, Stack, LoadingOverlay, Flex } from '@mantine/core';
import { IoArrowBack, IoImageOutline, IoCheckmarkCircle, IoCheckmark } from "react-icons/io5";
import { useAuth } from '../../context/AuthContext';
import { useMantineColorScheme } from '@mantine/core';

// Predefined solid colors
const SOLID_COLORS = [
    '#000000', '#1f2c34', '#3c5a6d', '#6f8b9e', '#1c2e36',
    '#253540', '#4a4441', '#542626', '#3b253b', '#624128',
    '#4a5459', '#1d272d', '#283842', '#364955', '#161d21',
    '#222e35', '#0b141a', '#24343d', '#141d24' // Add more shades to match screenshot roughly
];
// Simplified doodle pattern overlay (CSS logic to be handled in ChatWindow, here we just toggle it)

export default function WallpaperSettings({ onBack }) {
    const { user, updateProfile } = useAuth();
    const { colorScheme } = useMantineColorScheme();
    const [selectedColor, setSelectedColor] = useState(user?.settings?.wallpaper?.startsWith('#') ? user.settings.wallpaper : null);
    const [uploadedImage, setUploadedImage] = useState(user?.settings?.wallpaper?.startsWith('url') ? user.settings.wallpaper.replace(/^url\(['"](.+)['"]\)$/, '$1') : (user?.settings?.wallpaper?.startsWith('/') ? user.settings.wallpaper : null));
    const [doodlesEnabled, setDoodlesEnabled] = useState(user?.settings?.doodles || false);
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(false);

    const handleDoodlesChange = async (checked) => {
        setDoodlesEnabled(checked);
        try {
            await updateProfile({ settings: { doodles: checked } });
        } catch (error) {
            console.error("Failed to update doodles setting", error);
            // Revert on failure?
        }
    };

    // If wallpaper is not set, default might be system or null
    // Assuming 'default' means a specific color or the dark theme background.

    const handleColorSelect = async (color) => {
        setLoading(true);
        setSelectedColor(color);
        setUploadedImage(null);
        try {
            await updateProfile({ settings: { wallpaper: color } });
        } catch (error) {
            console.error("Failed to update wallpaper", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            // Re-using the existing upload endpoint via fetch since useChat/api might not be available here directly or we can just use fetch
            // But we should use the auth token.
            // Let's rely on a helper or just plain fetch with localStorage token if needed.
            // Assuming AuthContext doesn't expose 'api' instance directly, but we can import it or use fetch.
            // Checking ChatWindow used 'api' from useChat. Let's try to import api utility if it exists or use fetch.
            // We'll use standard fetch for now, assuming index.js/cors setup allows it.

            // Wait, we need the token.
            const token = localStorage.getItem('token');

            const response = await fetch('http://localhost:5200/api/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();
            if (data.imageUrl) {
                const fullUrl = `url('${data.imageUrl}')`;
                setUploadedImage(data.imageUrl);
                setSelectedColor(null);
                await updateProfile({ settings: { wallpaper: fullUrl } });
            }
        } catch (error) {
            console.error("Upload failed", error);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async () => {
        setLoading(true);
        try {
            await updateProfile({ settings: { wallpaper: '' } }); // Reset to default
            setSelectedColor(null);
            setUploadedImage(null);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Paper
            h="100%"
            radius={0}
            style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'var(--wa-sidebar-bg)',
                zIndex: 3
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
                    <Text size="xl" fw={800} c="var(--wa-text-primary)" style={{ letterSpacing: '-0.5px' }}>Set chat wallpaper</Text>
                </Group>
            </Flex>

            <Box p="md" style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
                <LoadingOverlay visible={loading} overlayProps={{ radius: "sm", blur: 2 }} loaderProps={{ color: 'green', type: 'bars' }} />

                <Checkbox
                    label="Add WhatsApp doodles"
                    checked={doodlesEnabled}
                    onChange={(e) => handleDoodlesChange(e.currentTarget.checked)}
                    mb="lg"
                    styles={{
                        label: { color: 'var(--wa-text-primary)' }
                    }}
                    color="green"
                />

                <Grid gutter="xs">
                    {/* Default/Reset Option */}
                    <Grid.Col span={4}>
                        <Paper
                            h={100}
                            withBorder
                            style={{
                                backgroundColor: '#0b141a', // standard dark bg
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative'
                            }}
                            onClick={handleReset}
                        >
                            {!selectedColor && !uploadedImage && <IoCheckmarkCircle size={24} color="var(--wa-green)" style={{ position: 'absolute', top: 5, right: 5 }} />}
                            <Text size="xs" c="var(--wa-text-primary)">Default</Text>
                        </Paper>
                    </Grid.Col>

                    {/* Upload Option */}
                    <Grid.Col span={4}>
                        <Paper
                            h={100}
                            withBorder
                            style={{
                                backgroundColor: 'var(--wa-active-bg)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Stack align="center" gap={4}>
                                <IoImageOutline size={24} color="var(--wa-text-primary)" />
                                <Text size="xs" c="var(--wa-text-primary)">My Photos</Text>
                            </Stack>
                        </Paper>
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept="image/*"
                            onChange={handleFileUpload}
                        />
                    </Grid.Col>

                    {/* Solid Colors */}
                    {SOLID_COLORS.map((color, index) => (
                        <Grid.Col span={4} key={index}>
                            <ColorSwatch
                                color={color}
                                style={{
                                    width: '100%',
                                    height: '100px',
                                    cursor: 'pointer',
                                    borderRadius: 4
                                }}
                                onClick={() => handleColorSelect(color)}
                            >
                                {selectedColor === color && <IoCheckmark color="white" style={{ width: 20, height: 20 }} />}
                            </ColorSwatch>
                        </Grid.Col>
                    ))}
                </Grid>
            </Box>
        </Paper>
    );
}
