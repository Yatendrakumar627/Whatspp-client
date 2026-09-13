import React from 'react';
import { Paper, Text, Avatar, Group, Stack, Box, ActionIcon, Divider, Flex, Center, ScrollArea, Switch } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IoClose, IoSearchOutline, IoVideocamOutline, IoCallOutline, IoStar, IoChevronForward, IoPencil, IoNotificationsOutline, IoLockClosedOutline, IoTimerOutline } from "react-icons/io5";

export default function ContactInfoSidebar({ contact, onClose, sharedMedia = [] }) {
    const isMobile = useMediaQuery('(max-width: 48em)');
    if (!contact) return null;

    const ActionButton = ({ icon: Icon, label, onClick }) => (
        <Stack align="center" gap={6} style={{ flex: 1, cursor: 'pointer' }} onClick={onClick}>
            <Box
                style={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    border: '1px solid var(--wa-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--wa-green)',
                    backgroundColor: 'rgba(0, 168, 132, 0.05)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        backgroundColor: 'rgba(0, 168, 132, 0.1)',
                        transform: 'translateY(-1px)'
                    }
                }}
            >
                <Icon size={18} />
            </Box>
            <Text size="xs" c="var(--wa-green)" fw={600} style={{ fontSize: '11px' }}>{label}</Text>
        </Stack>
    );

    const SettingsRow = ({ icon: Icon, title, value, hasChevron = true, hasSwitch = false, onClick }) => (
        <Box
            px="lg"
            py="sm"
            style={{
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
                '&:hover': { backgroundColor: 'var(--wa-active-bg)' }
            }}
            onClick={onClick}
        >
            <Group justify="space-between" align="center" wrap="nowrap">
                <Group gap="md" style={{ flex: 1 }}>
                    <Icon size={18} color="var(--wa-text-secondary)" />
                    <Box style={{ flex: 1 }}>
                        <Text size="xs" fw={500} c="var(--wa-text-primary)" style={{ fontSize: '13px' }}>{title}</Text>
                        {value && <Text size="xs" c="var(--wa-text-secondary)" mt={0} style={{ fontSize: '11px', lineHeight: 1.3 }}>{value}</Text>}
                    </Box>
                </Group>
                {hasSwitch ? (
                    <Switch size="xs" color="teal" />
                ) : hasChevron ? (
                    <IoChevronForward size={14} color="var(--wa-text-secondary)" />
                ) : null}
            </Group>
        </Box>
    );

    return (
        <Paper
            h="100%"
            w={isMobile ? '100%' : 340} // Slightly wider for premium feel
            radius={0}
            style={{
                borderLeft: '1px solid var(--wa-border)',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'var(--wa-glass-bg)',
                backdropFilter: 'var(--wa-blur)',
                WebkitBackdropFilter: 'var(--wa-blur)',
                zIndex: 200,
                boxShadow: isMobile ? 'none' : '-4px 0 20px rgba(0,0,0,0.15)',
                position: isMobile ? 'absolute' : 'relative',
                right: 0,
                top: 0
            }}
        >
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
                <Group justify="space-between" style={{ width: '100%' }}>
                    <Group gap="md">
                        <ActionIcon variant="subtle" radius="xl" color="gray" onClick={onClose} size="lg">
                            <IoClose size={24} />
                        </ActionIcon>
                        <Text size="md" fw={700} c="var(--wa-text-primary)" style={{ letterSpacing: '-0.3px' }}>Contact info</Text>
                    </Group>
                    <ActionIcon variant="subtle" radius="xl" color="gray" size="md">
                        <IoPencil size={20} />
                    </ActionIcon>
                </Group>
            </Flex>

            <ScrollArea h="100%" offsetScrollbars>
                <Stack gap={0}>
                    {/* Profile Section */}
                    <Box py={40} style={{ borderBottom: '1px solid var(--wa-border)' }}>
                        <Center>
                            <Avatar
                                src={contact?.avatar || contact?.chatImage}
                                size={200}
                                radius={100}
                                style={{
                                    border: '6px solid var(--wa-glass-bg)',
                                    boxShadow: 'var(--wa-shadow-md)'
                                }}
                                styles={{ placeholder: { fontSize: '64px', fontWeight: 800, background: 'var(--wa-premium-gradient)', color: 'white' } }}
                            >
                                {(contact?.username || contact?.recipientName)?.[0]?.toUpperCase()}
                            </Avatar>
                        </Center>
                        <Stack align="center" gap={4} mt="xl">
                            <Text size="xl" fw={800} c="var(--wa-text-primary)" style={{ letterSpacing: '-0.8px', fontSize: '24px' }}>
                                {contact?.username || contact?.recipientName || contact?.chatName}
                            </Text>
                            <Text size="sm" c="var(--wa-text-secondary)" fw={600} style={{ opacity: 0.8 }}>
                                {contact?.phone || '+91 75718 75252'}
                            </Text>
                        </Stack>
                    </Box>

                    {/* Actions Row */}
                    <Box p="xl" style={{ borderBottom: '8px solid var(--wa-bg)' }}>
                        <Flex justify="space-around">
                            <ActionButton icon={IoSearchOutline} label="Search" />
                            <ActionButton icon={IoVideocamOutline} label="Video" />
                            <ActionButton icon={IoCallOutline} label="Voice" />
                        </Flex>
                    </Box>

                    {/* About Section */}
                    <Box py="md" style={{ borderBottom: '8px solid var(--wa-bg)' }}>
                        <Text size="xs" c="var(--wa-green)" px="xl" pt="xs" fw={800} tt="uppercase" style={{ letterSpacing: '1.2px', fontSize: '10px' }}>
                            About
                        </Text>
                        <Box px="xl" py={12}>
                            <Text size="sm" c="var(--wa-text-primary)" lh={1.6} fw={500}>
                                {contact?.about || 'Cometer errores es normal... 😊'}
                            </Text>
                        </Box>
                    </Box>

                    {/* Media Section */}
                    <Box py="md" style={{ borderBottom: '8px solid var(--wa-bg)' }}>
                        <Group justify="space-between" px="xl" py={8} style={{ cursor: 'pointer' }}>
                            <Text size="xs" c="var(--wa-text-secondary)" fw={800} tt="uppercase" style={{ letterSpacing: '1.2px', fontSize: '10px' }}>
                                Media, links and docs
                            </Text>
                            <Group gap={6}>
                                <Text size="xs" c="var(--wa-text-secondary)" fw={700}>{sharedMedia.length}</Text>
                                <IoChevronForward size={14} color="var(--wa-text-secondary)" />
                            </Group>
                        </Group>

                        {sharedMedia.length > 0 ? (
                            <Flex gap="md" px="xl" py="sm" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                                {sharedMedia.slice(0, 4).map((m, i) => (
                                    <Box
                                        key={i}
                                        style={{
                                            minWidth: 80,
                                            height: 80,
                                            borderRadius: '12px',
                                            backgroundImage: `url(${m})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            backgroundColor: 'var(--wa-active-bg)',
                                            border: '1px solid var(--wa-border)',
                                            boxShadow: 'var(--wa-shadow-sm)',
                                            transition: 'transform 0.3s ease'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                    />
                                ))}
                            </Flex>
                        ) : (
                            <Text size="xs" c="var(--wa-text-secondary)" px="xl" pb="xs" fw={500}>No media shared yet</Text>
                        )}
                    </Box>

                    {/* Standard Settings Rows */}
                    <Stack gap={0} py="xs">
                        <SettingsRow icon={IoStar} title="Starred messages" />
                        <Divider color="var(--wa-border)" mx="xl" opacity={0.2} />
                        <SettingsRow icon={IoNotificationsOutline} title="Mute notifications" hasSwitch />
                        <Divider color="var(--wa-border)" mx="xl" opacity={0.2} />
                        <SettingsRow icon={IoTimerOutline} title="Disappearing messages" value="Off" />
                        <Divider color="var(--wa-border)" mx="xl" opacity={0.2} />
                        <SettingsRow icon={IoLockClosedOutline} title="Encryption" value="Messages and calls are end-to-end encrypted. Click to verify." />
                    </Stack>

                    <Box py="xl" />
                </Stack>
            </ScrollArea>
        </Paper>
    );
}
