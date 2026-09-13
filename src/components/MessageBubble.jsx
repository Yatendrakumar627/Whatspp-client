import React, { useState } from 'react';
import { Paper, Text, Group, Menu, Box, ActionIcon, Transition, Popover } from '@mantine/core';
import { IoChevronDown, IoHappyOutline, IoCheckmark, IoCheckmarkDone, IoBan, IoStar, IoArrowUndo, IoDownloadOutline, IoDocumentOutline } from 'react-icons/io5';
import { useGesture } from '@use-gesture/react';
import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion';
import axios from 'axios';
import ReactionPicker from './ReactionPicker';
import MessageContextMenu from './MessageContextMenu';
import Lightbox from './Lightbox';

const WS_BASE = (axios.defaults.baseURL || 'http://localhost:5200/api').replace(/\/api\/?$/, '');

const resolveMediaUrl = (url) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `${WS_BASE}${url.startsWith('/') ? url : `/${url}`}`;
};

const fileNameFromUrl = (url) => {
    try { return decodeURIComponent(url.split('/').pop() || 'file'); }
    catch (e) { return url.split('/').pop() || 'file'; }
};

// Memoize the component to prevent re-renders when parent state changes (e.g. typing)
const MessageBubble = React.memo(function MessageBubble({ message, isMe, onAction, currentUserId, showTail = true }) {
    const [hovered, setHovered] = useState(false);
    const [menuOpened, setMenuOpened] = useState(false);
    const [reactionPickerOpened, setReactionPickerOpened] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    const renderTicks = () => {
        if (!isMe) return null;
        const size = 15;
        const isGroup = !message.receiver; // Group messages have no receiver field

        if (isGroup) {
            // Group read receipts based on readBy[] entries
            const reads = (message.readBy || []).length;
            const isReadAll = message.read || message.status === 'read';
            const isReceived = message.status === 'delivered' || message.status === 'read' || reads > 0;

            if (isReceived) {
                return (
                    <>
                        <IoCheckmarkDone size={size} color={isReadAll ? '#53bdeb' : 'rgba(255,255,255,0.6)'} />
                        {reads > 0 && (
                            <Text size="10px" fw={700} style={{ color: isReadAll ? '#53bdeb' : 'rgba(255,255,255,0.6)', lineHeight: 1 }}>
                                {reads}
                            </Text>
                        )}
                    </>
                );
            }
            return <IoCheckmark size={size} color="rgba(255,255,255,0.6)" />;
        }

        const color = message.status === 'read' || message.read ? '#53bdeb' : 'rgba(255,255,255,0.6)';
        return message.status === 'read' || message.read || message.status === 'delivered' ?
            <IoCheckmarkDone size={size} color={color} /> :
            <IoCheckmark size={size} color={color} />;
    };

    const isDeleted = message.isDeletedForEveryone;

    const reactionCounts = {};
    if (message.reactions) {
        message.reactions.forEach(r => {
            reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
        });
    }

    const bubbleStyle = {
        maxWidth: '100%',
        minWidth: '100px',
        width: 'fit-content',
        backgroundColor: isMe ? 'var(--wa-message-sent)' : 'var(--wa-message-received)',
        color: 'var(--wa-text-primary)',
        position: 'relative',
        borderRadius: '7.5px',
        borderTopRightRadius: isMe && showTail ? '0px' : '7.5px',
        borderTopLeftRadius: !isMe && showTail ? '0px' : '7.5px',
        boxShadow: '0 1px 0.5px rgba(11,20,26,.13)',
        fontSize: '14.2px',
        lineHeight: '19px',
        padding: '6px 7px 8px 9px',
    };

    const renderContent = () => {
        const forwardedChip = message.forwarded && (
            <Text
                size="11px"
                fw={700}
                tt="uppercase"
                c={isMe ? "rgba(255,255,255,0.75)" : "var(--wa-green-accent)"}
                mb={2}
                style={{ letterSpacing: '0.3px' }}
            >
                Forwarded
            </Text>
        );

        if (message.type === 'image') {
            return (
                <Box mb={2} style={{ width: '100%', minWidth: '150px' }}>
                    {forwardedChip}
                    <img
                        src={resolveMediaUrl(message.content)}
                        alt="Shared"
                        style={{
                            maxWidth: '100%',
                            maxHeight: '300px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'block'
                        }}
                        onClick={() => setLightboxOpen(true)}
                    />
                    <Lightbox
                        opened={lightboxOpen}
                        onClose={() => setLightboxOpen(false)}
                        src={resolveMediaUrl(message.content)}
                    />
                </Box>
            );
        }

        if (message.type === 'video') {
            return (
                <Box mb={2} style={{ width: '100%', minWidth: '200px' }}>
                    {forwardedChip}
                    <video
                        controls
                        preload="metadata"
                        src={resolveMediaUrl(message.content)}
                        style={{
                            width: '100%',
                            maxWidth: '320px',
                            maxHeight: '320px',
                            borderRadius: '6px',
                            display: 'block'
                        }}
                    />
                </Box>
            );
        }

        if (message.type === 'file') {
            const fileName = fileNameFromUrl(message.content);
            return (
                <Box mb={2} style={{ width: '220px' }}>
                    {forwardedChip}
                    <Group
                        gap="sm"
                        p="sm"
                        style={{
                            backgroundColor: 'rgba(0,0,0,0.05)',
                            borderRadius: '8px',
                            border: '1px solid var(--wa-border-subtle)'
                        }}
                    >
                        <Box
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: '10px',
                                backgroundColor: 'rgba(0,168,132,0.15)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}
                        >
                            <IoDocumentOutline size={22} color="var(--wa-green)" />
                        </Box>
                        <Box style={{ flex: 1, minWidth: 0 }}>
                            <Text size="sm" c={isMe ? "#e9edef" : "var(--wa-text-primary)"} fw={600} truncate>
                                {fileName}
                            </Text>
                            <Text size="xs" c="var(--wa-text-secondary)">Document</Text>
                        </Box>
                        <ActionIcon
                            variant="subtle"
                            component="a"
                            href={resolveMediaUrl(message.content)}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <IoDownloadOutline size={20} />
                        </ActionIcon>
                    </Group>
                </Box>
            );
        }

        if (message.type === 'audio') {
            return (
                <Box
                    style={{
                        width: '240px',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '8px 4px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(0,0,0,0.05)'
                    }}
                >
                    {forwardedChip && <Box mb={2} />}
                    <audio
                        controls
                        src={resolveMediaUrl(message.content)}
                        className="custom-audio-player"
                        style={{
                            width: '100%',
                            height: '32px',
                            filter: isMe ? 'invert(1) opacity(0.8)' : 'opacity(0.8)'
                        }}
                    />
                </Box>
            );
        }

        return (
            <div className="message-text-container">
                {forwardedChip}
                <Text
                    style={{
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap',
                        display: 'inline',
                        fontSize: '14.2px',
                        lineHeight: '19px',
                    }}
                >
                    {message.content}

                    {/* Spacer to push floating info down if text fills line */}
                    <span style={{ display: 'inline-block', width: '70px', height: '0px' }}></span>
                </Text>

                {/* Timestamp & Ticks - Floated relative to text */}
                <span
                    style={{
                        float: 'right',
                        marginTop: '6px',
                        marginLeft: '-60px', /* Minimal negative margin just to line up if space permits */
                        paddingLeft: '10px',
                        position: 'relative',
                        top: '2px', // Fine visual adjustment
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        opacity: 0.7,
                        height: '15px'
                    }}
                >
                    {message.starredBy && message.starredBy.includes(currentUserId) && <IoStar size={10} color={isMe ? "#e9edef" : "#8696a0"} />}
                    <Text size="11px" c={isMe ? "#e9edef" : "var(--wa-text-secondary)"} style={{ lineHeight: 1 }}>
                        {new Date(message.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                    </Text>
                    {renderTicks()}
                </span>
            </div>
        );
    };

    return (
        <Group
            align="flex-start"
            justify={isMe ? 'flex-end' : 'flex-start'}
            mb={Object.keys(reactionCounts).length > 0 ? 24 : 2}
            style={{
                width: '100%',
                position: 'relative',
                paddingLeft: isMe ? 0 : 10,
                paddingRight: isMe ? 10 : 0,
                marginTop: showTail ? 6 : 2
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            gap={0}
        >
            {/* Wrapper for Relative Positioning - Responsive Max Width */}
            <Box maw={{ base: '85%', md: '65%' }} style={{ position: 'relative', touchAction: 'pan-y' }}>



                {/* Smiley (Reaction Picker) */}
                <Transition mounted={!isDeleted && (hovered || menuOpened || reactionPickerOpened)} transition="fade" duration={200}>
                    {(styles) => (
                        <Box
                            style={{
                                ...styles,
                                position: 'absolute',
                                top: 0,
                                [isMe ? 'left' : 'right']: isMe ? -38 : -38,
                                zIndex: 10,
                                paddingTop: 4
                            }}
                        >
                            <Popover
                                opened={reactionPickerOpened}
                                onChange={setReactionPickerOpened}
                                position="top"
                                withArrow
                                shadow="xl"
                                trapFocus
                                offset={{ mainAxis: 8, crossAxis: 0 }}
                            >
                                <Popover.Target>
                                    <ActionIcon
                                        variant="filled"
                                        radius="xl"
                                        size={28}
                                        style={{
                                            backgroundColor: 'var(--wa-popup-bg)',
                                            color: 'var(--wa-text-secondary)',
                                            border: '1px solid var(--wa-border-subtle)',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                        }}
                                        onClick={() => setReactionPickerOpened((o) => !o)}
                                    >
                                        <IoHappyOutline size={16} />
                                    </ActionIcon>
                                </Popover.Target>
                                <Popover.Dropdown
                                    bg="transparent"
                                    p={0}
                                    style={{ border: 'none', boxShadow: 'none' }}
                                >
                                    <ReactionPicker
                                        onSelect={(emoji) => {
                                            onAction('react', message, { emoji });
                                            setReactionPickerOpened(false);
                                        }}
                                        onMore={() => console.log("More clicked")}
                                    />
                                </Popover.Dropdown>
                            </Popover>
                        </Box>
                    )}
                </Transition>


                {/* Message Bubble - Draggable */}
                <SwipeableBubble
                    message={message}
                    onReply={() => onAction('reply', message)}
                    onLongPressHandler={() => {
                        setMenuOpened(true);
                    }}
                >
                    <Paper
                        style={bubbleStyle}
                        className={`${isMe ? 'bubble-sent' : 'bubble-received'} ${showTail ? 'has-tail' : ''}`}
                    >
                        {/* Context Menu Trigger - Chevron */}
                        <Transition mounted={!isDeleted && (hovered || menuOpened) || (isDeleted && (hovered || menuOpened))} transition="fade" duration={200}>
                            {(styles) => (
                                <Box
                                    style={{
                                        ...styles,
                                        position: 'absolute',
                                        top: 3,
                                        right: 3,
                                        zIndex: 10
                                    }}
                                >
                                    <Menu
                                        shadow="xl"
                                        width={200}
                                        position="bottom-end"
                                        withinPortal
                                        onOpen={() => setMenuOpened(true)}
                                        onClose={() => setMenuOpened(false)}
                                        radius="md"
                                        offset={4}
                                    >
                                        <Menu.Target>
                                            <ActionIcon
                                                variant="transparent"
                                                size={22}
                                                style={{
                                                    background: 'radial-gradient(circle, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0) 70%)',
                                                    color: 'rgba(255,255,255, 0.9)',
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <IoChevronDown size={14} />
                                            </ActionIcon>
                                        </Menu.Target>
                                        <Menu.Dropdown bg="var(--wa-popup-bg)" style={{ border: '1px solid var(--wa-border-subtle)' }}>
                                            <MessageContextMenu
                                                onAction={onAction}
                                                message={message}
                                                isMe={isMe}
                                                currentUserId={currentUserId}
                                            />
                                        </Menu.Dropdown>
                                    </Menu>
                                </Box>
                            )}
                        </Transition>

                        {/* Reply Preview */}
                        {message.replyTo && (
                            <Box
                                p={6}
                                mb={4}
                                style={{
                                    backgroundColor: 'rgba(0,0,0,0.1)',
                                    borderRadius: '4px',
                                    borderLeft: `4px solid ${isMe ? '#d1d7db' : 'var(--wa-green)'}`,
                                    cursor: 'pointer',
                                    overflow: 'hidden'
                                }}
                            >
                                <Text size="xs" fw={700} c={isMe ? "rgba(255,255,255,0.9)" : "var(--wa-green-accent)"} lh={1.2} mb={2}>
                                    {message.replyTo.sender?.username || 'User'}
                                </Text>
                                <Text size="xs" lineClamp={1} c="var(--wa-text-secondary)" lh={1.2} style={{ opacity: 0.8 }}>
                                    {message.replyTo.content}
                                </Text>
                            </Box>
                        )}

                        <Box style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
                            {isDeleted ? (
                                <Group gap={6} align="center" style={{ opacity: 0.6, paddingBottom: 2 }}>
                                    <IoBan size={14} />
                                    <Text size="sm" fs="italic">This message was deleted</Text>
                                </Group>
                            ) : (
                                renderContent()
                            )}
                        </Box>

                        {/* Reactions Display */}
                        {Object.keys(reactionCounts).length > 0 && (
                            <Group
                                gap={4}
                                style={{
                                    position: 'absolute',
                                    bottom: -22,
                                    [isMe ? 'right' : 'left']: 0,
                                    backgroundColor: 'var(--wa-popup-bg)',
                                    padding: '2px 6px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--wa-border-subtle)',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                    zIndex: 2,
                                    cursor: 'pointer'
                                }}
                                onClick={() => setReactionPickerOpened(true)}
                            >
                                {Object.entries(reactionCounts).map(([emoji, count]) => (
                                    <Text key={emoji} size="11px" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        {emoji} {count > 1 && <span style={{ fontSize: '10px', fontWeight: 700 }}>{count}</span>}
                                    </Text>
                                ))}
                            </Group>
                        )}
                    </Paper>
                </SwipeableBubble>

                <style>
                    {`
              .has-tail::before {
                content: "";
                position: absolute;
                top: 0;
                width: 10px;
                height: 10px;
                z-index: 0;
              }

              /* Sent Tail (Right) - Triangle pointing top right */
              .bubble-sent.has-tail::before {
                right: -10px;
                top: 0;
                box-shadow: -3px 3px 6px -3px rgba(0,0,0,0.2) inset; /* faux shadow */
                background: linear-gradient(135deg, var(--wa-message-sent) 50%, transparent 50%);
                background: var(--wa-message-sent);
                clip-path: polygon(0 0, 100% 0, 0 100%);
              }

              /* Received Tail (Left) */
              .bubble-received.has-tail::before {
                left: -10px;
                top: 0;
                background: var(--wa-message-received);
                clip-path: polygon(100% 0, 0 0, 100% 100%);
              }
            `}
                </style>
            </Box>
        </Group>
    );
});

export default MessageBubble;

const SwipeableBubble = ({ children, onReply, onLongPressHandler, message }) => {
    const x = useMotionValue(0);
    // Use a spring that follows the motion value for smooth snapping
    const springX = useSpring(x, { stiffness: 400, damping: 30 });

    const bind = useGesture({
        onDrag: ({ down, movement: [mx], cancel }) => {
            // Only allow dragging to the right (positive mx)
            if (mx < 0) {
                if (down) x.set(0);
                return;
            }

            if (down) {
                // Apply resistance after 80px
                const damped = mx > 80 ? 80 + (mx - 80) * 0.2 : mx;
                x.set(damped);
            } else {
                if (mx > 50) {
                    onReply();
                }
                x.set(0);
            }
        },
        onLongPress: () => {
            // Trigger haptic feedback if available
            if (navigator.vibrate) navigator.vibrate(50);
            // Trigger the menu open callback
            if (onLongPressHandler) onLongPressHandler();
        }
    }, {
        drag: {
            axis: 'x',
            filterTaps: true,
            from: () => [x.get(), 0], // Important for consistency
        },
    });

    // We can access the raw x value to drive the icon opacity directly/instantly or through the spring
    // Using springX for the bubble movement
    // The icon is OUTSIDE this component in the parent render, drove by the component?
    // Wait, the icon logic in the parent used: `x: useTransform(useMotionValue(0)...)` which was a placeholder.
    // I need to connect the icon in the parent to THIS component's state.
    // The previous edit put the icon in the parent. 
    // And I removed the placeholder `useMotionValue` from the parent's icon.
    // PROBLEM: The parent component (MessageBubble) doesn't have access to `springX` inside `SwipeableBubble`.
    // SOLVE: Move the Icon INSIDE `SwipeableBubble`.

    // Icon Logic Revised:
    // The Icon should be BEHIND the bubble. 
    // If I put it inside SwipeableBubble, I can position it absolute behind the children.

    const iconOpacity = useTransform(springX, [0, 40], [0, 1]);
    const iconScale = useTransform(springX, [0, 40], [0.5, 1]);
    const iconX = useTransform(springX, [0, 50], [-20, 0]);

    return (
        <Box style={{ position: 'relative' }}>
            {/* Reply Icon - Absolute positioned behind the bubble content */}
            <motion.div
                style={{
                    position: 'absolute',
                    left: -40, // Adjust based on need
                    top: '50%',
                    y: '-50%',
                    // zIndex: -1, // Behind the bubble? No, container is relative. 
                    // Children (Paper) has zIndex? Paper usually doesn't.
                    // But if I put zIndex -1 it might go behind the main background if not careful.
                    // Let's try zIndex 0 and ensure children is zIndex 1.
                    zIndex: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    backgroundColor: 'var(--wa-header-bg)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    opacity: iconOpacity,
                    scale: iconScale,
                    x: iconX
                }}
            >
                <IoArrowUndo size={18} color="var(--wa-green)" />
            </motion.div>

            <motion.div
                {...bind()}
                style={{
                    x: springX,
                    touchAction: 'pan-y',
                    position: 'relative',
                    zIndex: 1 // Ensure above icon
                }}
            >
                {children}
            </motion.div>
        </Box>
    );
};
