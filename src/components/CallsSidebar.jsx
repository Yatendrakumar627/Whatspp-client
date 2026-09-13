import React from 'react';
import { Paper, Text, Stack, ScrollArea, Group, Avatar, ActionIcon, Box, Flex, Menu } from '@mantine/core';
import { IoCallOutline, IoLinkOutline, IoVideocamOutline, IoEllipsisVertical, IoTrashOutline } from "react-icons/io5";
import { useCall } from '../context/CallContext';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useEffect } from 'react';

export default function CallsSidebar() {
    const { callHistory, fetchCallHistory, callUser } = useCall();
    const { user } = useAuth();
    const { api } = useChat();

    useEffect(() => {
        fetchCallHistory();
    }, []);

    return (
        <Paper h="100%" radius={0} bg="var(--wa-sidebar-bg)" style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Flex
                h={64}
                px="md"
                align="center"
                justify="space-between"
                style={{
                    borderBottom: '1px solid var(--wa-border)',
                    flexShrink: 0,
                    backgroundColor: 'var(--wa-header-bg)',
                    backdropFilter: 'var(--wa-blur)',
                    WebkitBackdropFilter: 'var(--wa-blur)',
                }}
            >
                <Text size="xl" fw={800} c="var(--wa-text-primary)" style={{ letterSpacing: '-0.5px' }}>Calls</Text>
                {callHistory.length > 0 && (
                    <Menu position="bottom-end" shadow="md">
                        <Menu.Target>
                            <ActionIcon variant="subtle" radius="xl" size="lg">
                                <IoEllipsisVertical size={20} />
                            </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                            <Menu.Item
                                color="red"
                                leftSection={<IoTrashOutline size={16} />}
                                onClick={() => {
                                    if (window.confirm("Clear all call history?")) {
                                        api.delete('/calls').then(() => fetchCallHistory());
                                    }
                                }}
                            >
                                Clear call log
                            </Menu.Item>
                        </Menu.Dropdown>
                    </Menu>
                )}
            </Flex>

            <ScrollArea style={{ flex: 1 }} type="hover">
                <Stack gap="xs" p="sm">
                    <Box
                        p="md"
                        style={{
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': { backgroundColor: 'var(--wa-active-bg)' },
                            borderRadius: '12px'
                        }}
                    >
                        <Group gap="md">
                            <Avatar color="teal" radius="xl" size={40}>
                                <IoLinkOutline size={22} />
                            </Avatar>
                            <Box>
                                <Text size="md" fw={600} c="var(--wa-text-primary)">Create call link</Text>
                                <Text size="xs" c="var(--wa-text-secondary)" mt={2}>Share a link for your WhatsApp call</Text>
                            </Box>
                        </Group>
                    </Box>

                    <Text size="xs" c="var(--wa-green)" fw={700} px="md" mt="md" tt="uppercase" style={{ letterSpacing: '0.5px' }}>
                        Recent
                    </Text>

                    <Stack gap={2}>
                        {callHistory.length > 0 ? callHistory.map((callLog) => {
                            const isCaller = callLog.caller?._id === user?._id;
                            const peer = isCaller ? callLog.receiver : callLog.caller;
                            const isMissed = callLog.status === 'missed' || callLog.status === 'declined';

                            if (!peer) return null;

                            return (
                                <Box
                                    key={callLog._id}
                                    p="md"
                                    style={{
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        '&:hover': { backgroundColor: 'var(--wa-active-bg)' },
                                        borderRadius: '12px'
                                    }}
                                >
                                    <Group justify="space-between" wrap="nowrap">
                                        <Group gap="md">
                                            <Avatar src={peer.avatar} radius="xl" size={40}>
                                                {peer.username?.[0]?.toUpperCase()}
                                            </Avatar>
                                            <Box>
                                                <Text size="md" fw={600} c={isMissed ? "#ef5350" : "var(--wa-text-primary)"}>
                                                    {peer.username}
                                                </Text>
                                                <Group gap={4} align="center" mt={2}>
                                                    {callLog.type === 'video' ? <IoVideocamOutline size={12} /> : <IoCallOutline size={12} />}
                                                    <Text size="xs" c="var(--wa-text-secondary)">
                                                        {new Date(callLog.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                    </Text>
                                                </Group>
                                            </Box>
                                        </Group>
                                        <Group gap={0}>
                                            <ActionIcon
                                                variant="subtle"
                                                radius="xl"
                                                size="lg"
                                                color="teal"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    callUser(peer._id, callLog.type || 'audio');
                                                }}
                                            >
                                                {callLog.type === 'video' ? <IoVideocamOutline size={20} /> : <IoCallOutline size={20} />}
                                            </ActionIcon>
                                            <Menu position="bottom-end" shadow="md" withinPortal>
                                                <Menu.Target>
                                                    <ActionIcon variant="subtle" radius="xl" size="lg" onClick={(e) => e.stopPropagation()}>
                                                        <IoEllipsisVertical size={16} />
                                                    </ActionIcon>
                                                </Menu.Target>
                                                <Menu.Dropdown>
                                                    <Menu.Item
                                                        color="red"
                                                        leftSection={<IoTrashOutline size={14} />}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            api.delete(`/calls/${callLog._id}`).then(() => fetchCallHistory());
                                                        }}
                                                    >
                                                        Remove from log
                                                    </Menu.Item>
                                                </Menu.Dropdown>
                                            </Menu>
                                        </Group>
                                    </Group>
                                </Box>
                            );
                        }) : (
                            <Box py={40}>
                                <Text size="sm" c="var(--wa-text-secondary)" ta="center">No recent calls</Text>
                            </Box>
                        )}
                    </Stack>
                </Stack>
            </ScrollArea>
        </Paper>
    );
}
