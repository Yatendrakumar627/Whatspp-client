import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Modal, Image, Text, Box, ActionIcon, Progress, Group, Avatar } from '@mantine/core';
import { IoClose, IoChevronBack, IoChevronForward } from "react-icons/io5";
import axios from 'axios';

export default function StatusViewModal({ opened, onClose, statusGroup }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const reportedRef = useRef(new Set());

    useEffect(() => {
        if (opened) {
            setCurrentIndex(0);
            setProgress(0);
        }
    }, [opened, statusGroup]);

    const currentStatus = statusGroup?.statuses?.[currentIndex];

    // Report a view for the currently visible status (deduped per session)
    useEffect(() => {
        if (!opened || !currentStatus?._id) return;
        if (reportedRef.current.has(currentStatus._id)) return;
        axios.post(`/status/${currentStatus._id}/view`).catch(() => { });
        reportedRef.current.add(currentStatus._id);
    }, [opened, currentStatus?._id]);

    const handleNext = useCallback(() => {
        if (!statusGroup) return;
        if (currentIndex < statusGroup.statuses.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setProgress(0);
        } else {
            onClose();
        }
    }, [currentIndex, statusGroup, onClose]);

    const handlePrev = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setProgress(0);
        }
    }, [currentIndex]);

    useEffect(() => {
        if (!opened || !statusGroup || !currentStatus) return;

        // If video, let the video element handle progress and next
        if (currentStatus.type === 'video') return;

        const duration = 5000; // 5 seconds per status (for images/text)
        const interval = 50; // Update progress every 50ms
        const step = 100 / (duration / interval);

        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    return 100;
                }
                return prev + step;
            });
        }, interval);

        return () => clearInterval(timer);
    }, [opened, statusGroup, currentIndex, currentStatus?.type]);

    useEffect(() => {
        // Only trigger next from progress if NOT video (video triggers via onEnded)
        if (progress >= 100 && currentStatus?.type !== 'video') {
            handleNext();
        }
    }, [progress, handleNext, currentStatus?.type]);

    if (!statusGroup) return null;

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            fullScreen
            withCloseButton={false}
            padding={0}
            styles={{
                content: { backgroundColor: '#000' },
                body: { height: '100vh', display: 'flex', flexDirection: 'column' }
            }}
        >
            {/* Progress Bars */}
            <Box style={{ position: 'absolute', top: 10, left: 10, right: 10, zIndex: 10, display: 'flex', gap: 4 }}>
                {statusGroup.statuses.map((_, index) => (
                    <Progress
                        key={index}
                        value={index < currentIndex ? 100 : index === currentIndex ? progress : 0}
                        size="sm"
                        radius="xl"
                        color="white"
                        style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.3)' }}
                    />
                ))}
            </Box>

            {/* Header */}
            <Group style={{ position: 'absolute', top: 25, left: 15, zIndex: 10 }} gap="sm">
                <ActionIcon variant="transparent" color="white" onClick={onClose}>
                    <IoClose size={28} />
                </ActionIcon>
                <Avatar src={statusGroup.user?.avatar} radius="xl" size="md" />
                <Box>
                    <Text c="white" fw={600} size="sm">{statusGroup.user?.username}</Text>
                    <Text c="rgba(255,255,255,0.7)" size="xs">
                        {new Date(currentStatus.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </Box>
            </Group>

            {/* Content */}
            <Box
                style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    backgroundColor: currentStatus.type === 'text' ? (currentStatus.background || '#005c4b') : '#000'
                }}
            >
                {/* Navigation Areas */}
                <Box
                    style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '30%', zIndex: 5 }}
                    onClick={handlePrev}
                />
                <Box
                    style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '30%', zIndex: 5 }}
                    onClick={handleNext}
                />

                {currentStatus.type === 'video' ? (
                    <video
                        src={currentStatus.content}
                        style={{ maxHeight: '100vh', maxWidth: '100vw', objectFit: 'contain' }}
                        autoPlay
                        playsInline
                        onTimeUpdate={(e) => setProgress((e.target.currentTime / e.target.duration) * 100)}
                        onEnded={handleNext}
                    />
                ) : currentStatus.type === 'image' ? (
                    <Image
                        src={currentStatus.content}
                        fit="contain"
                        style={{ maxHeight: '100vh', maxWidth: '100vw' }}
                    />
                ) : (
                    <Text
                        c="white"
                        size="xl"
                        fw={700}
                        ta="center"
                        px="xl"
                        style={{ fontSize: '2rem' }}
                    >
                        {currentStatus.content}
                    </Text>
                )}
            </Box>

            {/* Caption (if exists for image) */}
            {currentStatus.type === 'image' && currentStatus.caption && (
                <Box
                    bg="rgba(0,0,0,0.6)"
                    p="md"
                    style={{ position: 'absolute', bottom: 0, left: 0, right: 0, textAlign: 'center' }}
                >
                    <Text c="white">{currentStatus.caption}</Text>
                </Box>
            )}
        </Modal>
    );
}
