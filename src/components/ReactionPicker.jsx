import React from 'react';
import { Group, Text, ActionIcon, Tooltip } from '@mantine/core';
import { IoAdd } from 'react-icons/io5';

export default function ReactionPicker({ onSelect, onMore }) {
    const emojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

    return (
        <Group
            gap={4}
            p={6}
            style={{
                backgroundColor: 'var(--wa-sidebar-bg)', // Dark background
                borderRadius: '24px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                width: 'fit-content',
                flexWrap: 'nowrap'
            }}
        >
            {emojis.map((emoji) => (
                <Tooltip key={emoji} label={emoji} withArrow position="top" transitionProps={{ duration: 0 }}>
                    <Text
                        style={{
                            fontSize: '24px',
                            cursor: 'pointer',
                            transition: 'transform 0.1s',
                            lineHeight: 1,
                            padding: '4px'
                        }}
                        onClick={() => onSelect(emoji)}
                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.3)'}
                        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                    >
                        {emoji}
                    </Text>
                </Tooltip>
            ))}
            <ActionIcon
                variant="subtle"
                color="gray"
                radius="xl"
                size="lg"
                onClick={onMore}
                style={{ marginLeft: 4 }}
            >
                <IoAdd size={20} />
            </ActionIcon>
        </Group>
    );
}
