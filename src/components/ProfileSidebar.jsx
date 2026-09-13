import React from 'react';
import { Paper, Text, Avatar, Group, Stack, Box, ActionIcon, TextInput, Divider, Flex, Center, Indicator, ScrollArea, Menu, Modal, Image } from '@mantine/core';
import { IoArrowBack, IoPencil, IoCheckmark, IoClose, IoCameraOutline, IoTrash, IoEye } from "react-icons/io5";
import { useAuth } from '../context/AuthContext';
import { useState, useRef } from 'react';
import axios from 'axios';
import { notifications } from '@mantine/notifications';
import ImageAdjustmentModal from './modals/ImageAdjustmentModal';

export default function ProfileSidebar({ onBack }) {
    const { user, setUser } = useAuth();
    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingAbout, setIsEditingAbout] = useState(false);
    const [tempName, setTempName] = useState(user?.displayName || user?.username || '');
    const [tempAbout, setTempAbout] = useState(user?.about || '');
    const [uploading, setUploading] = useState(false);
    const [hovered, setHovered] = useState(false);
    const [viewPhotoOpen, setViewPhotoOpen] = useState(false);
    const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const fileInputRef = useRef(null);

    const handleUpdateProfile = async (data) => {
        try {
            const res = await axios.put('/users/profile', data);
            setUser(res.data);
            notifications.show({ title: 'Success', message: 'Profile updated', color: 'teal' });
            return true;
        } catch (error) {
            console.error("Profile Update Error:", error);
            notifications.show({ title: 'Error', message: 'Failed to update profile', color: 'red' });
            return false;
        }
    };

    const handleSaveName = async () => {
        if (tempName.trim() === '') return;
        const success = await handleUpdateProfile({ displayName: tempName });
        if (success) setIsEditingName(false);
    };

    const handleSaveAbout = async () => {
        const success = await handleUpdateProfile({ about: tempAbout });
        if (success) setIsEditingAbout(false);
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Reset file input so same file can be selected again if needed
        e.target.value = null;

        const reader = new FileReader();
        reader.onload = () => {
            setSelectedImage(reader.result);
            setAdjustmentModalOpen(true);
        };
        reader.readAsDataURL(file);
    };

    const handleAdjustmentConfirm = async (blob) => {
        setAdjustmentModalOpen(false);
        setUploading(true);

        const formData = new FormData();
        // Append blob as 'file' with a filename
        formData.append('file', blob, 'profile_photo.jpg');

        try {
            const uploadRes = await axios.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const imageUrl = uploadRes.data.imageUrl;
            await handleUpdateProfile({ avatar: imageUrl });
        } catch (error) {
            console.error("Upload Error:", error);
            notifications.show({ title: 'Error', message: 'Failed to upload image', color: 'red' });
        } finally {
            setUploading(false);
            setSelectedImage(null);
        }
    };

    const handleRemoveImage = async () => {
        if (!user?.avatar) return;
        setUploading(true);
        try {
            await handleUpdateProfile({ avatar: '' });
            notifications.show({ title: 'Success', message: 'Profile photo removed', color: 'teal' });
        } catch (error) {
            console.error("Remove Image Error:", error);
            notifications.show({ title: 'Error', message: 'Failed to remove photo', color: 'red' });
        } finally {
            setUploading(false);
        }
    };

    return (
        <Paper
            h="100%"
            radius={0}
            style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'var(--wa-glass-bg)',
                backdropFilter: 'var(--wa-blur)',
                WebkitBackdropFilter: 'var(--wa-blur)',
                borderRight: '1px solid var(--wa-glass-border)',
                zIndex: 10
            }}
        >
            <Modal
                opened={viewPhotoOpen}
                onClose={() => setViewPhotoOpen(false)}
                centered
                withCloseButton={false}
                padding={0}
                styles={{
                    content: { backgroundColor: 'transparent', boxShadow: 'none' },
                    body: { padding: 0 }
                }}
            >
                <Box style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                    <Image
                        src={user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : `http://localhost:5200${user.avatar}`) : null}
                        w="auto"
                        fit="contain"
                        radius={0}
                        style={{ maxWidth: '100%', maxHeight: '85vh', boxShadow: 'var(--wa-shadow-xl)' }}
                    />
                    {/* Fallback to big native avatar if image fails or is empty, but modal shouldn't open then usually */}
                </Box>
            </Modal>

            <ImageAdjustmentModal
                opened={adjustmentModalOpen}
                onClose={() => { setAdjustmentModalOpen(false); setSelectedImage(null); }}
                imageSrc={selectedImage}
                onConfirm={handleAdjustmentConfirm}
            />

            {/* Header */}
            <Flex
                align="center"
                px="md"
                h={64}
                style={{
                    borderBottom: '1px solid var(--wa-border)',
                    flexShrink: 0,
                    backgroundColor: 'transparent',
                }}
            >
                <Group gap="xl">
                    <ActionIcon variant="subtle" radius="xl" style={{ color: 'var(--wa-text-primary)' }} onClick={onBack} size="lg">
                        <IoArrowBack size={24} />
                    </ActionIcon>
                    <Text size="xl" fw={800} c="var(--wa-text-primary)" style={{ letterSpacing: '-0.8px' }}>Profile</Text>
                </Group>
            </Flex>

            <ScrollArea h="100%" offsetScrollbars>
                <Stack gap={0} p={0}>
                    {/* Avatar Section */}
                    <Box py={32}>
                        <Center>
                            <Box style={{ position: 'relative' }}>
                                <Menu shadow="md" width={200} position="bottom">
                                    <Menu.Target>
                                        <Box
                                            style={{
                                                position: 'relative',
                                                width: 180,
                                                height: 180,
                                                borderRadius: '50%',
                                                overflow: 'hidden',
                                                cursor: 'pointer',
                                                boxShadow: 'var(--wa-shadow-md)',
                                                border: '5px solid var(--wa-glass-bg)'
                                            }}
                                            onMouseEnter={() => setHovered(true)}
                                            onMouseLeave={() => setHovered(false)}
                                        >
                                            <Avatar
                                                src={user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : `http://localhost:5200${user.avatar}`) : null}
                                                size={180}
                                                radius={90}
                                                styles={{ placeholder: { fontSize: '48px', fontWeight: 800, background: 'var(--wa-premium-gradient)', color: 'white' } }}
                                            >
                                                {user?.username?.[0]?.toUpperCase()}
                                            </Avatar>
                                            <Box
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    height: '100%',
                                                    backgroundColor: 'rgba(0,0,0,0.6)',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    opacity: hovered ? 1 : 0,
                                                    transition: 'opacity 0.3s ease',
                                                    color: 'white',
                                                    textAlign: 'center',
                                                    padding: '20px'
                                                }}
                                            >
                                                <IoCameraOutline size={32} style={{ marginBottom: 8 }} />
                                                <Text size="xs" fw={800} tt="uppercase" style={{ letterSpacing: '1.5px', fontSize: '10px' }}>
                                                    {uploading ? 'Updating...' : 'Change Profile Photo'}
                                                </Text>
                                            </Box>
                                        </Box>
                                    </Menu.Target>

                                    <Menu.Dropdown>
                                        {user?.avatar && (
                                            <Menu.Item
                                                leftSection={<IoEye size={16} />}
                                                onClick={() => setViewPhotoOpen(true)}
                                            >
                                                View photo
                                            </Menu.Item>
                                        )}
                                        <Menu.Item
                                            leftSection={<IoCameraOutline size={16} />}
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            Upload photo
                                        </Menu.Item>
                                        {user?.avatar && (
                                            <Menu.Item
                                                color="red"
                                                leftSection={<IoTrash size={16} />}
                                                onClick={handleRemoveImage}
                                            >
                                                Remove photo
                                            </Menu.Item>
                                        )}
                                    </Menu.Dropdown>
                                </Menu>
                            </Box>
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                accept="image/*"
                                onChange={handleImageUpload}
                            />
                        </Center>
                    </Box>

                    {/* Display Name Section */}
                    <Box px="xl" py="xl">
                        <Text size="xs" c="var(--wa-green)" mb={16} fw={800} tt="uppercase" style={{ letterSpacing: '1.2px' }}>
                            Your Name
                        </Text>
                        {isEditingName ? (
                            <Group align="flex-end" gap="xs">
                                <TextInput
                                    variant="unstyled"
                                    value={tempName}
                                    onChange={(e) => setTempName(e.target.value)}
                                    autoFocus
                                    styles={{
                                        input: {
                                            color: 'var(--wa-text-primary)',
                                            fontSize: '17px',
                                            fontWeight: 500,
                                            borderBottom: '2px solid var(--wa-green)',
                                            paddingBottom: 4,
                                            transition: 'all 0.3s ease',
                                            backgroundColor: 'rgba(0,0,0,0.05)',
                                            padding: '4px 8px',
                                            borderRadius: '4px'
                                        }
                                    }}
                                    style={{ flex: 1 }}
                                />
                                <ActionIcon variant="light" radius="xl" color="teal" onClick={handleSaveName} size="lg">
                                    <IoCheckmark size={24} />
                                </ActionIcon>
                                <ActionIcon variant="light" radius="xl" color="gray" onClick={() => { setIsEditingName(false); setTempName(user?.displayName || ''); }} size="lg">
                                    <IoClose size={24} />
                                </ActionIcon>
                            </Group>
                        ) : (
                            <Group justify="space-between">
                                <Text size="lg" fw={600} c="var(--wa-text-primary)" style={{ fontSize: '19px' }}>{user?.displayName || user?.username}</Text>
                                <ActionIcon variant="subtle" radius="xl" color="gray" onClick={() => setIsEditingName(true)}>
                                    <IoPencil size={20} />
                                </ActionIcon>
                            </Group>
                        )}
                        <Text size="xs" c="var(--wa-text-secondary)" mt="lg" lh={1.6} fw={500} style={{ opacity: 0.8 }}>
                            This name will be visible to your WhatsApp contacts.
                        </Text>
                    </Box>

                    <Divider color="var(--wa-border)" mx="xl" opacity={0.3} />

                    {/* Unique Name Section (Read-only for now or strictly editable) */}
                    <Box px="xl" py="xl">
                        <Text size="xs" c="var(--wa-green)" mb={16} fw={800} tt="uppercase" style={{ letterSpacing: '1.2px' }}>
                            Unique Name
                        </Text>
                        <Text size="lg" fw={600} c="var(--wa-text-primary)" style={{ fontSize: '19px' }}>@{user?.username}</Text>
                        <Text size="xs" c="var(--wa-text-secondary)" mt="sm" lh={1.6} fw={500} style={{ opacity: 0.8 }}>
                            This is your unique username. People can key this in to find you.
                        </Text>
                    </Box>

                    <Divider color="var(--wa-border)" mx="xl" opacity={0.3} />

                    {/* About Section */}
                    <Box px="xl" py="xl">
                        <Text size="xs" c="var(--wa-green)" mb={16} fw={800} tt="uppercase" style={{ letterSpacing: '1.2px' }}>
                            About
                        </Text>
                        {isEditingAbout ? (
                            <Group align="flex-end" gap="xs">
                                <TextInput
                                    variant="unstyled"
                                    value={tempAbout}
                                    onChange={(e) => setTempAbout(e.target.value)}
                                    autoFocus
                                    styles={{
                                        input: {
                                            color: 'var(--wa-text-primary)',
                                            fontSize: '15px',
                                            fontWeight: 400,
                                            borderBottom: '2px solid var(--wa-green)',
                                            paddingBottom: 4,
                                            backgroundColor: 'rgba(0,0,0,0.05)',
                                            padding: '4px 8px',
                                            borderRadius: '4px'
                                        }
                                    }}
                                    style={{ flex: 1 }}
                                />
                                <ActionIcon variant="light" radius="xl" color="teal" onClick={handleSaveAbout} size="lg">
                                    <IoCheckmark size={24} />
                                </ActionIcon>
                                <ActionIcon variant="light" radius="xl" color="gray" onClick={() => { setIsEditingAbout(false); setTempAbout(user?.about || ''); }} size="lg">
                                    <IoClose size={24} />
                                </ActionIcon>
                            </Group>
                        ) : (
                            <Group justify="space-between">
                                <Text size="md" fw={500} c="var(--wa-text-primary)" lh={1.5}>
                                    {user?.about || 'Hey there! I am using WhatsApp.'}
                                </Text>
                                <ActionIcon variant="subtle" radius="xl" color="gray" onClick={() => setIsEditingAbout(true)}>
                                    <IoPencil size={20} />
                                </ActionIcon>
                            </Group>
                        )}
                    </Box>

                    <Divider color="var(--wa-border)" mx="xl" opacity={0.3} />

                    {/* Email Section (Read-only) */}
                    <Box px="xl" py="xl">
                        <Text size="xs" c="var(--wa-green)" mb={16} fw={800} tt="uppercase" style={{ letterSpacing: '1.2px' }}>
                            Email
                        </Text>
                        <Text size="md" fw={600} c="var(--wa-text-primary)">{user?.email}</Text>
                    </Box>

                    <Box py="xl" />
                </Stack>
            </ScrollArea>
        </Paper>
    );
}
