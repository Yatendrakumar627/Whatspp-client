import React from 'react';
import { ActionIcon, Avatar, Box, Flex, Text, TextInput, Group, Paper, Modal, Button, Stack, Transition, Divider, Tooltip, ScrollArea, Popover, Loader, Center } from '@mantine/core';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useMediaQuery } from '@mantine/hooks';
import { IoSearchOutline, IoEllipsisVertical, IoSend, IoHappyOutline, IoMicOutline, IoCheckmark, IoClose, IoArrowBack, IoAdd, IoVideocamOutline, IoCallOutline, IoTrash, IoStop } from "react-icons/io5";
import MessageBubble from '../../components/MessageBubble';
import ContactInfoSidebar from '../../components/ContactInfoSidebar';
import EmojiPickerPanel from '../../components/EmojiPickerPanel';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useCall } from '../../context/CallContext';
import { useState, useEffect, useRef, useCallback } from 'react';
import GroupInfoModal from '../GroupInfoModal';
import ForwardModal from '../modals/ForwardModal';
import { notifications } from '@mantine/notifications';
import doodleBg from '../../assets/doodles.svg';

const formatDateLabel = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
};

const DateDivider = ({ dateLabel }) => (
    <Flex justify="center" my="md">
        <Box
            px="md"
            py={6}
            style={{
                backgroundColor: 'var(--wa-date-pill-bg, #182229)',
                borderRadius: '8px',
                boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)'
            }}
        >
            <Text size="xs" fw={500} c="var(--wa-text-secondary)" style={{ textTransform: 'uppercase' }}>
                {dateLabel}
            </Text>
        </Box>
    </Flex>
);

const ChatWindow = () => {
    const { selectedChat, messages, fetchMessages, chats, typingUsers, setSelectedChat, api } = useChat();
    const { user } = useAuth();
    const isMobile = useMediaQuery('(max-width: 48em)');
    const { socket, onlineUsers, presence } = useSocket();
    const [newMessage, setNewMessage] = useState('');
    const scrollRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const fileInputRef = useRef(null);

    const [deleteModalOpened, setDeleteModalOpened] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [editingMessage, setEditingMessage] = useState(null);
    const [replyingMessage, setReplyingMessage] = useState(null);
    const [forwardingMessage, setForwardingMessage] = useState(null);

    const [searchOpen, setSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [infoModalOpen, setInfoModalOpen] = useState(false);
    const [showContactInfo, setShowContactInfo] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    // Infinite Scroll State
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingOlder, setIsFetchingOlder] = useState(false);
    const previousScrollHeightRef = useRef(0);
    const previousScrollTopRef = useRef(0);

    // Voice Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerIntervalRef = useRef(null);

    const activeChat = chats.find(c => c._id === selectedChat);
    let currentMessages = messages[selectedChat] || [];
    if (searchOpen && searchTerm.trim()) {
        currentMessages = currentMessages.filter(m => m.content.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    const isRecipientOnline = activeChat && onlineUsers && (Array.isArray(onlineUsers) ? onlineUsers.includes(activeChat.recipientId) : onlineUsers.has(activeChat.recipientId));
    const typingIds = typingUsers[selectedChat] || [];
    const typingNames = activeChat?.isGroup
        ? typingIds
            .map(id => activeChat.participants?.find(p => String(p?._id || p?.id) === String(id))?.username || 'Someone')
            .filter(Boolean)
        : [];
    const isTyping = typingIds.length > 0 && (activeChat?.isGroup ? typingNames.length > 0 : typingIds.includes(activeChat.recipientId));
    const lastSeenAt = activeChat && !activeChat.isGroup ? presence[activeChat.recipientId]?.lastSeen : null;
    const lastSeenLabel = lastSeenAt
        ? `last seen at ${new Date(lastSeenAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
        : 'offline';

    // Flatten messages with date dividers for virtualization
    const items = React.useMemo(() => {
        const result = [];
        if (hasMore) {
            result.push({ type: 'loader', id: 'loader-top' });
        }
        currentMessages.forEach((msg, idx) => {
            const prevMsg = idx > 0 ? currentMessages[idx - 1] : null;
            const msgDate = formatDateLabel(msg.createdAt);
            const prevMsgDate = prevMsg ? formatDateLabel(prevMsg.createdAt) : null;

            if (msgDate !== prevMsgDate) {
                result.push({ type: 'date', id: `date-${msgDate}`, label: msgDate });
            }
            // Use message _id for key if available, otherwise fallback (shouldn't happen for saved msgs)
            result.push({ type: 'message', id: msg._id || `msg-${idx}`, data: msg, index: idx });
        });
        return result;
    }, [currentMessages, hasMore]);

    const parentRef = useRef(null);

    const rowVirtualizer = useVirtualizer({
        count: items.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 80, // Estimate based on average message height
        overscan: 10,
        getItemKey: (index) => items[index].id,
    });

    // Auto-scroll to bottom on new messages (only if we are NOT fetching older ones)
    // And on chat change
    useEffect(() => {
        if (!isFetchingOlder && items.length > 0) {
            // Only scroll to bottom if we are near bottom or it's a new chat/fresh load
            // For simplicity, let's keep the existing behaviour for new incoming messages:
            // But if we just loaded older messages, we MUST NOT scroll to bottom.
            if (previousScrollHeightRef.current === 0) {
                rowVirtualizer.scrollToIndex(items.length - 1);
            }
        }
    }, [items.length, selectedChat, isFetchingOlder]);

    // Reset infinite scroll state on chat change
    useEffect(() => {
        setHasMore(true);
        setIsFetchingOlder(false);
        previousScrollHeightRef.current = 0;
        if (selectedChat && user) {
            fetchMessages(selectedChat).then((count) => {
                if (count < 50) setHasMore(false);
            });
            socket?.emit('mark_read', { chatId: selectedChat, userId: user._id });
        }
    }, [selectedChat, user, socket]);

    // Detect Top Scroll for Infinite Loading
    useEffect(() => {
        const [firstItem] = rowVirtualizer.getVirtualItems();
        if (firstItem && firstItem.index === 0 && hasMore && !isFetchingOlder && currentMessages.length > 0) {
            const loadOlder = async () => {
                setIsFetchingOlder(true);
                // Capture scroll position before update
                if (parentRef.current) {
                    previousScrollHeightRef.current = parentRef.current.scrollHeight;
                    previousScrollTopRef.current = parentRef.current.scrollTop;
                }

                const oldestMessageId = currentMessages[0]?._id;
                if (oldestMessageId) {
                    const count = await fetchMessages(selectedChat, { before: oldestMessageId, limit: 50 });
                    if (count < 50) setHasMore(false);
                }

                // We need to wait for render to adjust scroll?
                // The useEffect below handles the adjustment after render
                setIsFetchingOlder(false);
            };
            loadOlder();
        }
    }, [rowVirtualizer.getVirtualItems(), hasMore, isFetchingOlder, currentMessages, selectedChat, fetchMessages]);

    // Adjust scroll position after loading older messages
    React.useLayoutEffect(() => {
        if (parentRef.current && previousScrollHeightRef.current > 0 && items.length > 0) {
            const newScrollHeight = parentRef.current.scrollHeight;
            const heightDifference = newScrollHeight - previousScrollHeightRef.current;

            if (heightDifference > 0) {
                parentRef.current.scrollTop = heightDifference + previousScrollTopRef.current;
                previousScrollHeightRef.current = 0; // Reset
            }
        }
    }, [items.length]);

    const handleTyping = (e) => {
        setNewMessage(e.target.value);
        if (!socket || !selectedChat) return;
        socket.emit('typing_start', { roomId: selectedChat });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('typing_stop', { roomId: selectedChat });
        }, 2000);
    };

    const getMessageType = (file) => {
        const type = file.type;
        if (type.startsWith('image/')) return 'image';
        if (type.startsWith('video/')) return 'video';
        if (type.startsWith('audio/')) return 'audio';
        return 'file';
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const { data } = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const messageType = getMessageType(file);
            const messageData = {
                chatId: selectedChat,
                sender: user._id,
                receiver: activeChat?.recipientId,
                content: data.imageUrl,
                type: messageType
            };
            socket?.emit('send_message', messageData);
        } catch (error) {
            console.error("Upload failed", error);
        }
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleStartRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setRecordingDuration(0);

            timerIntervalRef.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);

        } catch (error) {
            console.error("Error accessing microphone:", error);
            notifications.show({
                title: 'Microphone access',
                message: 'Could not access your microphone. Please allow microphone permission and try again.',
                color: 'red'
            });
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(timerIntervalRef.current);
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());

            // Return a promise that resolves with the blob when onstop fires
            return new Promise(resolve => {
                mediaRecorderRef.current.onstop = () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    resolve(audioBlob);
                };
            });
        }
        return Promise.resolve(null);
    };

    const handleCancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
        setIsRecording(false);
        clearInterval(timerIntervalRef.current);
        setRecordingDuration(0);
        audioChunksRef.current = [];
    };

    const handleSendRecording = async () => {
        const audioBlob = await handleStopRecording();
        if (!audioBlob) return;

        const formData = new FormData();
        formData.append('file', audioBlob, 'voice_message.webm');

        try {
            const { data } = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const messageData = {
                chatId: selectedChat,
                sender: user._id,
                receiver: activeChat?.recipientId,
                content: data.imageUrl, // Server returns 'imageUrl' for all files currently
                type: 'audio'
            };
            socket?.emit('send_message', messageData);
        } catch (error) {
            console.error("Failed to upload voice message", error);
        }
    };

    const handleSend = () => {
        if (!newMessage.trim() || !selectedChat || !user) return;

        if (editingMessage) {
            socket.emit('message_edit', {
                messageId: editingMessage._id,
                newContent: newMessage
            });
            setEditingMessage(null);
            setNewMessage('');
            return;
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            socket.emit('typing_stop', { roomId: selectedChat });
        }

        const messageData = {
            chatId: selectedChat,
            sender: user._id,
            receiver: activeChat?.recipientId,
            content: newMessage,
            replyTo: replyingMessage ? replyingMessage._id : null
        };
        socket?.emit('send_message', messageData);
        setNewMessage('');
        setReplyingMessage(null);
    };

    const handleAction = useCallback((action, message, data) => {
        if (action === 'delete') {
            setSelectedMessage(message);
            setDeleteModalOpened(true);
        } else if (action === 'reply') {
            setReplyingMessage(message);
            setEditingMessage(null);
        } else if (action === 'edit') {
            setEditingMessage(message);
            setNewMessage(message.content);
            setReplyingMessage(null);
        } else if (action === 'star') {
            socket.emit('message_star', { messageId: message._id });
        } else if (action === 'react') {
            socket.emit('message_reaction', { messageId: message._id, emoji: data.emoji });
        } else if (action === 'pin') {
            socket.emit('message_pin', { messageId: message._id });
        } else if (action === 'forward') {
            setForwardingMessage(message);
        } else if (action === 'report') {
            notifications.show({ title: 'Reported', message: 'Message reported to admins.', color: 'teal' });
        } else if (action === 'copy') {
            navigator.clipboard.writeText(message.content);
        }
    }, [socket]);

    const confirmDelete = (deleteForEveryone) => {
        if (!selectedMessage) return;
        socket.emit('message_delete', {
            messageId: selectedMessage._id,
            chatId: selectedChat,
            deleteForEveryone
        });
        setDeleteModalOpened(false);
        setSelectedMessage(null);
    };

    if (!selectedChat) {
        return (
            <Flex align="center" justify="center" h="100%" bg="var(--wa-bg)">
                <Stack align="center" gap="md">
                    <Text c="var(--wa-text-secondary)" size="lg" fw={500}>Select a chat to start messaging</Text>
                </Stack>
            </Flex>
        );
    }

    const { callUser } = useCall();

    const getChatBackgroundStyles = () => {
        const { wallpaper, doodles } = user?.settings || {};
        const isImage = wallpaper && (wallpaper.startsWith('http') || wallpaper.startsWith('/') || wallpaper.startsWith('url'));

        const style = {
            flex: 1,
            backgroundColor: 'var(--wa-bg)',
            backgroundImage: 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'scroll'
        };

        if (wallpaper) {
            if (isImage) {
                const urlValue = wallpaper.startsWith('url') ? wallpaper : `url(${wallpaper})`;
                style.backgroundImage = doodles ? `linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0)), url(${doodleBg}), ${urlValue}` : urlValue;
                style.backgroundSize = doodles ? '400px, cover' : 'cover';
                style.backgroundRepeat = doodles ? 'repeat, no-repeat' : 'no-repeat';
            } else {
                style.backgroundColor = wallpaper;
                if (doodles) {
                    style.backgroundImage = `url(${doodleBg})`;
                    style.backgroundSize = '400px';
                    style.backgroundRepeat = 'repeat';
                }
            }
        } else if (doodles) {
            style.backgroundImage = `url(${doodleBg})`;
            style.backgroundSize = '400px';
            style.backgroundRepeat = 'repeat';
        }

        return style;
    };

    return (
        <Flex h="100%" style={{ overflow: 'hidden', position: 'relative' }}>
            <Flex direction="column" h="100%" bg="var(--wa-bg)" style={{ position: 'relative', flex: 1, transition: 'all 0.3s ease' }}>
                {/* Header */}
                <Paper
                    px="md"
                    radius={0}
                    h={64}
                    style={{
                        zIndex: 20,
                        borderBottom: '1px solid var(--wa-border)',
                        flexShrink: 0,
                        backgroundColor: 'var(--wa-glass-bg)',
                        backdropFilter: 'var(--wa-blur)',
                        WebkitBackdropFilter: 'var(--wa-blur)',
                    }}
                >
                    <Flex align="center" justify="space-between" h="100%">
                        <Group gap="sm" onClick={() => setShowContactInfo(!showContactInfo)} style={{ cursor: 'pointer', flex: 1 }}>
                            <ActionIcon display={{ base: 'block', md: 'none' }} variant="subtle" radius="xl" color="gray" onClick={(e) => { e.stopPropagation(); setSelectedChat(null); }}><IoArrowBack size={22} /></ActionIcon>
                            <Avatar radius="xl" size={44} src={activeChat?.chatImage || null} alt={activeChat?.chatName || activeChat?.recipientName} style={{ border: 'var(--wa-avatar-border)', boxShadow: 'var(--wa-shadow-sm)' }} styles={{ placeholder: { background: 'var(--wa-premium-gradient)', color: 'white', fontWeight: 800 } }}>
                                {(activeChat?.chatName || activeChat?.recipientName)?.[0]}
                            </Avatar>
                            <Stack gap={0} justify="center">
                                <Text c="var(--wa-text-primary)" fw={700} size="md" style={{ letterSpacing: '-0.3px', lineHeight: 1.2, fontSize: '16px' }}>
                                    {activeChat?.chatName || activeChat?.recipientDisplayName || activeChat?.recipientName || 'User'}
                                </Text>
                                <Transition mounted={isTyping || (!activeChat?.isGroup && (isRecipientOnline || lastSeenAt))} transition="fade" duration={200}>
                                    {(styles) => (
                                        <Text style={{ ...styles, fontSize: '12px', fontWeight: isTyping ? 700 : 500, color: isTyping ? "var(--wa-green)" : "var(--wa-text-secondary)", lineHeight: 1 }}>
                                            {isTyping
                                                ? (activeChat?.isGroup
                                                    ? `${typingNames.slice(0, 2).join(', ')}${typingNames.length > 2 ? ` +${typingNames.length - 2}` : ''} ${typingNames.length > 1 ? 'are' : 'is'} typing...`
                                                    : "typing...")
                                                : (isRecipientOnline ? "online" : lastSeenLabel)}
                                        </Text>
                                    )}
                                </Transition>
                            </Stack>
                        </Group>

                        <Group gap="4px">
                            <Tooltip label="Video Call">
                                <ActionIcon
                                    variant="subtle"
                                    radius="xl"
                                    size="lg"
                                    onClick={() => activeChat?.recipientId && callUser(activeChat.recipientId, 'video')}
                                >
                                    <IoVideocamOutline size={22} />
                                </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Voice Call">
                                <ActionIcon
                                    variant="subtle"
                                    radius="xl"
                                    size="lg"
                                    onClick={() => activeChat?.recipientId && callUser(activeChat.recipientId, 'audio')}
                                >
                                    <IoCallOutline size={20} />
                                </ActionIcon>
                            </Tooltip>


                            {searchOpen ? (
                                <TextInput
                                    size="sm"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    radius="xl"
                                    styles={{
                                        input: {
                                            backgroundColor: 'var(--wa-active-bg)',
                                            borderColor: 'transparent',
                                            color: 'var(--wa-text-primary)'
                                        }
                                    }}
                                    rightSection={<ActionIcon size="xs" variant="transparent" onClick={() => { setSearchOpen(false); setSearchTerm(''); }}><IoClose size={16} /></ActionIcon>}
                                    autoFocus
                                />
                            ) : (
                                <ActionIcon variant="subtle" radius="xl" size="lg" onClick={() => setSearchOpen(true)}>
                                    <IoSearchOutline size={20} />
                                </ActionIcon>
                            )}
                            <ActionIcon variant="subtle" radius="xl" size="lg" onClick={() => setInfoModalOpen(true)}>
                                <IoEllipsisVertical size={20} />
                            </ActionIcon>
                        </Group>
                    </Flex>
                </Paper>

                {activeChat?.isGroup && (
                    <GroupInfoModal
                        opened={infoModalOpen}
                        onClose={() => setInfoModalOpen(false)}
                        chat={activeChat}
                    />
                )}

                {/* Messages Area - Virtualized */}
                <div
                    ref={parentRef}
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: isMobile ? '12px 10px' : '12px 64px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        ...getChatBackgroundStyles(),
                        backgroundBlendMode: 'overlay',
                        backgroundImage: user?.settings?.doodles ? `linear-gradient(rgba(11, 20, 26, 0.96), rgba(11, 20, 26, 0.96)), url(${doodleBg})` : 'none'
                    }}
                >
                    <Flex justify="center" my="xl">
                        <Text
                            size="xs"
                            fw={600}
                            px="md"
                            py={6}
                            style={{
                                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                                color: 'var(--wa-text-secondary)',
                                borderRadius: '8px',
                                textAlign: 'center',
                                backdropFilter: 'blur(4px)',
                            }}
                        >
                            Messages are end-to-end encrypted.
                        </Text>
                    </Flex>

                    <div
                        style={{
                            height: `${rowVirtualizer.getTotalSize()}px`,
                            width: '100%',
                            position: 'relative',
                        }}
                    >
                        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                            const item = items[virtualRow.index];
                            return (
                                <div
                                    key={virtualRow.key}
                                    data-index={virtualRow.index}
                                    ref={rowVirtualizer.measureElement}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        transform: `translateY(${virtualRow.start}px)`,
                                    }}
                                >
                                    {item.type === 'loader' ? (
                                        <Center py="sm">
                                            <Loader size="sm" color="var(--wa-green)" />
                                        </Center>
                                    ) : item.type === 'date' ? (
                                        <DateDivider dateLabel={item.label} />
                                    ) : (
                                        (() => {
                                            const msg = item.data;
                                            const isMe = msg.sender === user?._id || msg.sender?._id === user?._id;
                                            // Determine tail logic based on original indexing which we have in item.index
                                            // Need to check PREVIOUS message in original list
                                            const originalIdx = item.index;
                                            const prevMsg = originalIdx > 0 ? currentMessages[originalIdx - 1] : null;
                                            const prevIsMe = prevMsg ? (prevMsg.sender === user?._id || prevMsg.sender?._id === user?._id) : null;
                                            const showTail = originalIdx === 0 || isMe !== prevIsMe;

                                            return (
                                                <MessageBubble
                                                    message={msg}
                                                    isMe={isMe}
                                                    currentUserId={user?._id}
                                                    onAction={handleAction}
                                                    showTail={showTail}

                                                />
                                            );
                                        })()
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Input Area */}
                <Box
                    style={{
                        position: 'relative',
                        borderTop: '1px solid var(--wa-border)',
                        backgroundColor: 'var(--wa-header-bg)',
                        backdropFilter: 'var(--wa-blur)',
                        WebkitBackdropFilter: 'var(--wa-blur)',
                    }}
                    p="6px"
                    px="sm"
                >
                    {/* Context Panel (Reply/Edit) */}
                    <Transition mounted={!!replyingMessage || !!editingMessage} transition="slide-up" duration={250}>
                        {(styles) => (
                            <Paper
                                style={{ ...styles, position: 'absolute', bottom: '100%', left: 0, right: 0, zIndex: 5 }}
                                bg="var(--wa-header-bg)"
                                p="xs"
                                radius={0}
                                withBorder
                            >
                                <Flex justify="space-between" align="center" px="md">
                                    <Box style={{ borderLeft: `4px solid ${editingMessage ? 'var(--wa-green)' : '#53bdeb'}`, paddingLeft: '12px' }}>
                                        <Text size="xs" fw={800} c={editingMessage ? "var(--wa-green)" : "#53bdeb"} tt="uppercase">
                                            {editingMessage ? "Edit Message" : `Reply to ${replyingMessage?.sender?.username || 'User'}`}
                                        </Text>
                                        <Text size="sm" c="var(--wa-text-secondary)" lineClamp={1}>
                                            {editingMessage ? editingMessage.content : replyingMessage?.content}
                                        </Text>
                                    </Box>
                                    <ActionIcon variant="subtle" radius="xl" onClick={() => { setEditingMessage(null); setReplyingMessage(null); setNewMessage(''); }}>
                                        <IoClose size={20} />
                                    </ActionIcon>
                                </Flex>
                            </Paper>
                        )}
                    </Transition>

                    <Flex align="center" gap="sm">
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleFileSelect}
                        />

                        {isRecording ? (
                            <Flex align="center" gap="md" style={{ flex: 1 }}>
                                <ActionIcon
                                    variant="subtle"
                                    color="red"
                                    size="lg"
                                    radius="xl"
                                    onClick={handleCancelRecording}
                                >
                                    <IoTrash size={24} />
                                </ActionIcon>
                                <Text size="md" fw={500} c="var(--wa-text-primary)" style={{ flex: 1, textAlign: 'center' }}>
                                    {formatDuration(recordingDuration)}
                                </Text>
                                <Box style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'red', animation: 'pulse 1s infinite' }} />
                            </Flex>
                        ) : (
                            <>
                                <Group gap={4}>
                                    <ActionIcon variant="subtle" radius="xl" size="md" onClick={() => fileInputRef.current?.click()}>
                                        <IoAdd size={24} />
                                    </ActionIcon>
                                    <Popover
                                        opened={showEmojiPicker}
                                        onChange={setShowEmojiPicker}
                                        position="top-start"
                                        shadow="md"
                                        offset={12}
                                    >
                                        <Popover.Target>
                                            <ActionIcon
                                                variant="subtle"
                                                radius="xl"
                                                size="md"
                                                onClick={() => setShowEmojiPicker((o) => !o)}
                                            >
                                                <IoHappyOutline size={20} style={{ color: showEmojiPicker ? 'var(--wa-green)' : undefined }} />
                                            </ActionIcon>
                                        </Popover.Target>
                                        <Popover.Dropdown p={0} style={{ border: 'none' }}>
                                            <EmojiPickerPanel
                                                onEmojiClick={(emojiData) => {
                                                    setNewMessage(prev => prev + emojiData.emoji);
                                                    setShowEmojiPicker(false);
                                                }}
                                                width={320}
                                                height={380}
                                            />
                                        </Popover.Dropdown>
                                    </Popover>
                                </Group>

                                <TextInput
                                    placeholder={editingMessage ? "Edit message..." : "Type a message"}
                                    style={{ flex: 1 }}
                                    radius="xl"
                                    size="md"
                                    value={newMessage}
                                    onChange={handleTyping}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    styles={{
                                        input: {
                                            backgroundColor: 'var(--wa-input-bg)',
                                            border: '1px solid var(--wa-border)',
                                            color: 'var(--wa-text-primary)',
                                            height: '46px',
                                            fontSize: '16px',
                                            paddingLeft: '20px',
                                            transition: 'all 0.3s ease',
                                            '&:focus': {
                                                borderColor: 'var(--wa-green)',
                                                boxShadow: '0 0 0 2px rgba(0, 168, 132, 0.1)',
                                            }
                                        }
                                    }}
                                    autoComplete="off"
                                />
                            </>
                        )}

                        <ActionIcon
                            variant="filled"
                            color={newMessage.trim() || isRecording ? "teal" : "gray"}
                            size={44}
                            radius="xl"
                            onClick={isRecording ? handleSendRecording : (newMessage.trim() ? handleSend : handleStartRecording)}
                            disabled={!newMessage.trim() && !isRecording && false} /* Enabled for mic now */
                            style={{
                                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                background: (newMessage.trim() || isRecording) ? 'var(--wa-premium-gradient)' : 'transparent',
                                color: (newMessage.trim() || isRecording) ? 'white' : 'var(--wa-text-secondary)',
                                boxShadow: (newMessage.trim() || isRecording) ? '0 4px 12px rgba(0, 168, 132, 0.4)' : 'none'
                            }}
                        >
                            {editingMessage ? <IoCheckmark size={22} /> : (isRecording ? <IoSend size={20} /> : (newMessage.trim() ? <IoSend size={18} /> : <IoMicOutline size={20} />))}
                        </ActionIcon>
                    </Flex>
                </Box>

                {/* Delete Modal */}
                <Modal
                    opened={deleteModalOpened}
                    onClose={() => setDeleteModalOpened(false)}
                    title="Delete Message?"
                    centered
                    radius="lg"
                    overlayProps={{ blur: 3, opacity: 0.5 }}
                >
                    <Stack gap="md">
                        <Text size="sm" c="var(--wa-text-secondary)">Are you sure you want to delete this message?</Text>
                        <Group justify="flex-end" gap="sm">
                            <Button variant="subtle" color="gray" onClick={() => setDeleteModalOpened(false)}>Cancel</Button>
                            {selectedMessage?.isDeletedForEveryone ? (
                                <Button color="red" radius="md" onClick={() => confirmDelete(false)}>Delete</Button>
                            ) : (
                                <>
                                    <Button variant="light" color="red" radius="md" onClick={() => confirmDelete(false)}>Delete for me</Button>
                                    {selectedMessage && (selectedMessage.sender === user?._id || selectedMessage.sender?._id === user?._id) && (
                                        <Button color="red" radius="md" onClick={() => confirmDelete(true)}>Delete for everyone</Button>
                                    )}
                                </>
                            )}
                        </Group>
                    </Stack>
                </Modal>

                {/* Forward Modal */}
                <ForwardModal
                    opened={!!forwardingMessage}
                    onClose={() => setForwardingMessage(null)}
                    message={forwardingMessage}
                />
            </Flex>

            {/* Contact Info Sidebar */}
            <Transition mounted={showContactInfo} transition="slide-left" duration={300} timingFunction="ease">
                {(styles) => (
                    <Box style={{
                        ...styles,
                        height: '100%',
                        flexShrink: 0,
                        position: isMobile ? 'absolute' : 'relative',
                        top: 0,
                        right: 0,
                        width: isMobile ? '100%' : 'auto',
                        zIndex: isMobile ? 1000 : 1
                    }}>
                        <ContactInfoSidebar
                            contact={activeChat}
                            onClose={() => setShowContactInfo(false)}
                            sharedMedia={currentMessages.filter(m => m.type === 'image').map(m => m.content)}
                        />
                    </Box>
                )}
            </Transition>
        </Flex>
    );
};

export default ChatWindow;
