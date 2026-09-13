import React from 'react';
import { Menu, Text } from '@mantine/core';
import {
    IoArrowUndoOutline,
    IoCopyOutline,
    IoHappyOutline,
    IoArrowRedoOutline,
    IoPinOutline,
    IoStarOutline,
    IoStar,
    IoTrashOutline,
    IoAlertCircleOutline,
    IoCheckmarkCircleOutline
} from 'react-icons/io5';

export default function MessageContextMenu({ onAction, message, isMe, currentUserId }) {
    const isStarred = message.starredBy?.includes(currentUserId);
    const isPinned = message.pinned; // Assuming pinned status is on message
    const isDeleted = message.isDeletedForEveryone;

    const itemStyle = {
        fontSize: '14px',
        color: 'var(--wa-text-primary)', // White/Off-white
        padding: '10px 16px',
    };

    const hoverStyle = {
        backgroundColor: 'var(--wa-hover-bg)', // Darker hover
    };

    if (isDeleted) {
        return (
            <Menu.Item
                color="red"
                leftSection={<IoTrashOutline size={18} />}
                onClick={() => onAction('delete', message)}
                style={itemStyle}
            >
                Delete
            </Menu.Item>
        );
    }

    return (
        <>
            <Menu.Item
                leftSection={<IoArrowUndoOutline size={18} />}
                onClick={() => onAction('reply', message)}
                style={itemStyle}
                className="context-menu-item"
            >
                Reply
            </Menu.Item>
            <Menu.Item
                leftSection={<IoCopyOutline size={18} />}
                onClick={() => {
                    navigator.clipboard.writeText(message.content);
                }}
                style={itemStyle}
                className="context-menu-item"
            >
                Copy
            </Menu.Item>
            <Menu.Item
                leftSection={<IoHappyOutline size={18} />}
                onClick={() => onAction('react_menu', message)}
                style={itemStyle}
                className="context-menu-item"
            >
                React
            </Menu.Item>
            <Menu.Item
                leftSection={<IoArrowRedoOutline size={18} />}
                onClick={() => onAction('forward', message)}
                style={itemStyle}
                className="context-menu-item"
            >
                Forward
            </Menu.Item>
            <Menu.Item
                leftSection={<IoPinOutline size={18} />}
                onClick={() => onAction('pin', message)}
                style={itemStyle}
                className="context-menu-item"
            >
                {isPinned ? 'Unpin' : 'Pin'}
            </Menu.Item>
            <Menu.Item
                leftSection={isStarred ? <IoStar size={18} color="yellow" /> : <IoStarOutline size={18} />}
                onClick={() => onAction('star', message)}
                style={itemStyle}
                className="context-menu-item"
            >
                {isStarred ? 'Unstar' : 'Star'}
            </Menu.Item>
            <Menu.Item
                leftSection={<IoAlertCircleOutline size={18} />}
                onClick={() => onAction('report', message)}
                style={itemStyle}
                className="context-menu-item"
            >
                Report
            </Menu.Item>
            <Menu.Item
                color="red"
                leftSection={<IoTrashOutline size={18} />}
                onClick={() => onAction('delete', message)}
                style={itemStyle}
                className="context-menu-item"
            >
                Delete
            </Menu.Item>

            <style>
                {`
                    .context-menu-item:hover {
                        background-color: rgba(255, 255, 255, 0.05) !important;
                    }
                `}
            </style>
        </>
    );
}
