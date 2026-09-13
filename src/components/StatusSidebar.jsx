import React from 'react';
import { Paper, Text, Stack, ScrollArea, Group, Avatar, Box, Divider, Loader, UnstyledButton, Flex, Menu, ActionIcon } from '@mantine/core';
import { IoAdd, IoEllipsisVertical, IoTrash } from "react-icons/io5";
import { notifications } from '@mantine/notifications';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useEffect, useState } from 'react';
import CreateStatusModal from './CreateStatusModal';
import StatusViewModal from './StatusViewModal';

export default function StatusSidebar() {
    const { user } = useAuth();
    const { api } = useChat();
    const [statusFeed, setStatusFeed] = useState([]);
    const [loading, setLoading] = useState(true);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedStatusGroup, setSelectedStatusGroup] = useState(null);

    const fetchStatusFeed = async () => {
        try {
            const { data } = await api.get('/status/feed');
            setStatusFeed(data);
        } catch (error) {
            console.error("Failed to fetch status feed", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatusFeed();
    }, []);

    const myStatusGroup = statusFeed.find(group => group.user._id === user._id);
    const otherStatuses = statusFeed.filter(group => group.user._id !== user._id);

    const myViewerCount = React.useMemo(() => {
        if (!myStatusGroup) return 0;
        const viewers = new Set();
        myStatusGroup.statuses.forEach(s => (s.viewers || []).forEach(v => v?.user && viewers.add(String(v.user))));
        return viewers.size;
    }, [myStatusGroup]);

    const handleDeleteStatus = async (statusId, e) => {
        if (e) e.stopPropagation();
        try {
            await api.delete(`/status/${statusId}`);
            notifications.show({ title: 'Success', message: 'Status deleted', color: 'teal' });
            fetchStatusFeed();
        } catch (error) {
            console.error("Failed to delete status", error);
            notifications.show({ title: 'Error', message: 'Failed to delete status', color: 'red' });
        }
    };

    const handleViewStatus = (group) => {
        setSelectedStatusGroup(group);
        setViewModalOpen(true);
    };

    return (
        <Paper h="100%" radius={0} bg="var(--wa-sidebar-bg)" style={{ display: 'flex', flexDirection: 'column' }}>
            <CreateStatusModal
                opened={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onStatusCreated={fetchStatusFeed}
            />
            <StatusViewModal
                opened={viewModalOpen}
                onClose={() => setViewModalOpen(false)}
                statusGroup={selectedStatusGroup}
            />

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
                <Text size="xl" fw={800} c="var(--wa-text-primary)" style={{ letterSpacing: '-0.5px' }}>Status</Text>
            </Flex>

            <ScrollArea style={{ flex: 1 }} type="hover">
                <Stack gap="sm" p="sm">
                    {/* My Status */}
                    <Box style={{ position: 'relative' }}>
                        <UnstyledButton
                            p="md"
                            w="100%"
                            style={{
                                transition: 'all 0.2s ease',
                                '&:hover': { backgroundColor: 'var(--wa-active-bg)', borderRadius: '12px' }
                            }}
                            onClick={() => {
                                if (myStatusGroup) handleViewStatus(myStatusGroup);
                                else setCreateModalOpen(true);
                            }}
                        >
                            <Group gap="md">
                                <Box style={{ position: 'relative' }}>
                                    <Avatar
                                        src={user?.avatar}
                                        radius="xl"
                                        size={46}
                                        style={{
                                            border: myStatusGroup ? '2px solid var(--wa-green)' : 'none',
                                            padding: myStatusGroup ? '2px' : 0
                                        }}
                                    />
                                    {!myStatusGroup && (
                                        <Box
                                            bg="var(--wa-green)"
                                            style={{
                                                position: 'absolute',
                                                bottom: 0,
                                                right: 0,
                                                borderRadius: '50%',
                                                width: 18,
                                                height: 18,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: '2px solid var(--wa-sidebar-bg)'
                                            }}
                                        >
                                            <IoAdd size={14} color="white" />
                                        </Box>
                                    )}
                                </Box>
                                <Box style={{ flex: 1 }}>
                                    <Text size="md" fw={600} c="var(--wa-text-primary)">My status</Text>
                                    <Text size="xs" c="var(--wa-text-secondary)" mt={2}>
                                        {myStatusGroup
                                            ? `${myStatusGroup.statuses.length} update${myStatusGroup.statuses.length > 1 ? 's' : ''}`
                                            : "Tap to add status update"}
                                        {myStatusGroup && myViewerCount > 0 && (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 8 }}>
                                                👁 <span style={{ fontWeight: 600, color: 'var(--wa-text-primary)' }}>{myViewerCount}</span>
                                            </span>
                                        )}
                                    </Text>
                                </Box>
                            </Group>
                        </UnstyledButton>

                        {myStatusGroup && (
                            <Menu position="bottom-end" shadow="md">
                                <Menu.Target>
                                    <ActionIcon
                                        variant="subtle"
                                        style={{ position: 'absolute', top: 22, right: 10 }}
                                        size="lg"
                                        radius="xl"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <IoEllipsisVertical size={18} />
                                    </ActionIcon>
                                </Menu.Target>
                                <Menu.Dropdown>
                                    <Menu.Label>Your Updates</Menu.Label>
                                    {myStatusGroup.statuses.map(s => (
                                        <Menu.Item
                                            key={s._id}
                                            color="red"
                                            leftSection={<IoTrash size={14} />}
                                            onClick={(e) => handleDeleteStatus(s._id, e)}
                                        >
                                            Delete {s.type === 'text' ? 'Text' : 'Media'} Update
                                        </Menu.Item>
                                    ))}
                                </Menu.Dropdown>
                            </Menu>
                        )}
                    </Box>

                    <Divider color="var(--wa-border)" label="Recent" labelPosition="left" opacity={0.5} mt="md" />

                    {loading ? (
                        <Flex justify="center" py="xl">
                            <Loader color="teal" size="sm" />
                        </Flex>
                    ) : (
                        <Stack gap={4}>
                            {otherStatuses.map((group) => (
                                <UnstyledButton
                                    key={group.user._id}
                                    p="md"
                                    style={{
                                        transition: 'all 0.2s ease',
                                        '&:hover': { backgroundColor: 'var(--wa-active-bg)', borderRadius: '12px' }
                                    }}
                                    onClick={() => handleViewStatus(group)}
                                >
                                    <Group gap="md">
                                        <Box style={{ position: 'relative', padding: '2px', border: '2.5px solid var(--wa-green)', borderRadius: '50%' }}>
                                            <Avatar src={group.user.avatar} radius="xl" size={40} />
                                        </Box>
                                        <Box>
                                            <Text size="md" fw={600} c="var(--wa-text-primary)">{group.user.username}</Text>
                                            <Text size="xs" c="var(--wa-text-secondary)" mt={2}>
                                                {new Date(group.statuses[0].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Text>
                                        </Box>
                                    </Group>
                                </UnstyledButton>
                            ))}
                            {otherStatuses.length === 0 && (
                                <Box py={40}>
                                    <Text size="sm" c="var(--wa-text-secondary)" ta="center">No recent updates</Text>
                                </Box>
                            )}
                        </Stack>
                    )}
                </Stack>
            </ScrollArea>
        </Paper>
    );
}
