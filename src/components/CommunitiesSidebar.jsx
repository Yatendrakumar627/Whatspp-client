import React from 'react';
import { Paper, Text, Stack, ScrollArea, Avatar, Box, Button, Center, Flex } from '@mantine/core';
import { IoPeopleOutline } from "react-icons/io5";

export default function CommunitiesSidebar() {
    return (
        <Paper h="100%" radius={0} bg="var(--wa-sidebar-bg)" style={{ display: 'flex', flexDirection: 'column' }}>
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
                <Text size="xl" fw={800} c="var(--wa-text-primary)" style={{ letterSpacing: '-0.5px' }}>Communities</Text>
            </Flex>

            <ScrollArea style={{ flex: 1 }} type="hover">
                <Center h="100%" p={40} style={{ minHeight: 500 }}>
                    <Stack align="center" gap="xl" maw={320}>
                        <Box style={{ position: 'relative' }}>
                            <Avatar size={100} radius="xl" bg="rgba(0,0,0,0.05)" color="teal">
                                <IoPeopleOutline size={50} />
                            </Avatar>
                        </Box>
                        <Stack align="center" gap="sm">
                            <Text fw={700} size="xl" c="var(--wa-text-primary)" ta="center">Stay connected with a community</Text>
                            <Text size="sm" c="var(--wa-text-secondary)" ta="center" lh={1.6}>
                                Communities bring members together in topic-based groups, and make it easy to get admin announcements. Any community you're added to will appear here.
                            </Text>
                        </Stack>
                        <Button variant="filled" color="teal" radius="xl" size="md" fullWidth mt="md">
                            Start your community
                        </Button>
                    </Stack>
                </Center>
            </ScrollArea>
        </Paper>
    );
}
