import React, { useState, useRef, useEffect } from 'react';
import { Modal, Box, Button, Group, Slider, Text, Stack, ActionIcon } from '@mantine/core';
import { IoClose, IoCheckmark, IoArrowBack, IoAdd, IoRemove } from 'react-icons/io5';
import { IoMdRefresh } from "react-icons/io";

export default function ImageAdjustmentModal({ opened, onClose, imageSrc, onConfirm }) {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const imageRef = useRef(null);
    const containerRef = useRef(null);
    const [minScale, setMinScale] = useState(1);

    // Reset state when modal opens or image changes
    useEffect(() => {
        if (opened && imageSrc) {
            setScale(1);
            setPosition({ x: 0, y: 0 });
            // Calculate min scale to fit the container
            if (imageRef.current && containerRef.current) {
                // We'll do this calculation on image load actually
            }
        }
    }, [opened, imageSrc]);

    const handleImageLoad = (e) => {
        const { naturalWidth, naturalHeight } = e.target;
        const containerSize = 300; // Fixed size for the view box

        // Calculate the minimum scale needed to cover the container
        const widthRatio = containerSize / naturalWidth;
        const heightRatio = containerSize / naturalHeight;
        const newMinScale = Math.max(widthRatio, heightRatio);

        setMinScale(newMinScale);
        setScale(newMinScale); // Start at minimum scale (cover)
        setPosition({ x: 0, y: 0 }); // Center
    };

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleWheel = (e) => {
        e.preventDefault();
        const newScale = Math.max(minScale, Math.min(3, scale - e.deltaY * 0.001));
        setScale(newScale);
    };

    const getCroppedImage = () => {
        const canvas = document.createElement('canvas');
        const size = 300;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        if (!ctx || !imageRef.current) return;

        // Draw the image onto the canvas based on current position and scale relative to the 300x300 container
        // The container is the "viewport"

        const img = imageRef.current;

        // We need to map the DOM position/scale to the canvas
        // The image is displayed at natural dimensions * scale, translated by position.x/y
        // The viewport is 300x300 centered in the UI, but let's assume the render logic:

        // Actually, let's use the straightforward drawImage:
        // ctx.drawImage(img, sourceX, sourceY, sourceW, sourceH, destX, destY, destW, destH)

        // Or easier: transform the context
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, size, size);

        // Determine the offset of the image relative to the container center
        // In the render: 
        // Container is 300x300. Center is 150,150.
        // Image center is at (position.x + imgWidth/2, position.y + imgHeight/2) relative to container top-left? 
        // Let's refine the render logic first to be sure.

        // Simplified approach for crop:
        // 1. Clear canvas
        // 2. Translate to center of canvas (150, 150)
        // 3. Translate by user's pan position ({x, y} - these should be offsets from center)
        // 4. Scale by user's scale
        // 5. Draw image centered at 0,0

        // Wait, 'position' in state is usually top-left offset. Let's make it intuitive.
        // If we treat 'position' as the translation of the image center relative to container center

        const centerX = size / 2;
        const centerY = size / 2;

        ctx.translate(centerX, centerY);
        ctx.translate(position.x, position.y);
        ctx.scale(scale, scale);
        ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

        canvas.toBlob((blob) => {
            onConfirm(blob);
        }, 'image/jpeg', 0.9);
    };

    // Adjusted render logic to match the crop logic:
    // Image should be centered in container + position offset + scaled

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            centered
            withCloseButton={false}
            padding={0}
            size="md"
            styles={{
                content: { backgroundColor: '#111b21', color: 'white', borderRadius: '10px' },
                body: { padding: 0 }
            }}
        >
            <Stack gap={0}>
                {/* Header */}
                <Group justify="space-between" p="md" style={{ backgroundColor: '#202c33' }}>
                    <Group gap="xs" style={{ cursor: 'pointer' }} onClick={onClose}>
                        <IoClose size={24} color="#aebac1" />
                        <Text c="#d1d7db" fw={500}>Drag the image to adjust</Text>
                    </Group>
                    <Button
                        variant="subtle"
                        color="gray"
                        leftSection={<IoMdRefresh size={20} />}
                        onClick={() => {
                            setPosition({ x: 0, y: 0 });
                            setScale(minScale);
                        }}
                        styles={{ root: { color: '#aebac1', '&:hover': { backgroundColor: 'transparent' } } }}
                    >
                        Reset
                    </Button>
                </Group>

                {/* Main Viewport */}
                <Box
                    style={{
                        height: 400,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#0b141a',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                    onWheel={handleWheel}
                >
                    {/* The "Mask" or View Area - typically a circle or square for profile */}
                    {/* WhatsApp web just uses a square viewport in the center */}
                    <Box
                        ref={containerRef}
                        style={{
                            width: 300,
                            height: 300,
                            border: '2px solid rgba(255,255,255,0.3)',
                            position: 'relative',
                            overflow: 'hidden',
                            cursor: isDragging ? 'grabbing' : 'grab',
                            zIndex: 10
                        }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        {/* Image Layer */}
                        {imageSrc && (
                            <img
                                ref={imageRef}
                                src={imageSrc}
                                alt="To adjust"
                                onLoad={handleImageLoad}
                                draggable={false}
                                style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${scale})`,
                                    transformOrigin: 'center center',
                                    pointerEvents: 'none', // Let container handle mouse events for smoother drag
                                    maxWidth: 'none',
                                    maxHeight: 'none'
                                }}
                            />
                        )}

                    </Box>

                    {/* Overlay to dim outside - optional aesthetic */}
                </Box>

                {/* Footer / Controls */}
                <Stack p="md" gap="md" style={{ backgroundColor: '#202c33' }}>
                    <Group justify="center" gap="md">
                        <IoRemove size={24} color='#aebac1' style={{ cursor: 'pointer' }} onClick={() => setScale(Math.max(minScale, scale - 0.1))} />
                        <Slider
                            value={scale}
                            onChange={setScale}
                            min={minScale}
                            max={3}
                            step={0.01}
                            style={{ flex: 1, maxWidth: 300 }}
                            color="teal"
                            label={null}
                            thumbSize={16}
                            styles={{
                                track: { backgroundColor: '#374045' },
                                thumb: { borderColor: '#00a884', backgroundColor: '#00a884' }
                            }}
                        />
                        <IoAdd size={24} color='#aebac1' style={{ cursor: 'pointer' }} onClick={() => setScale(Math.min(3, scale + 0.1))} />
                    </Group>

                    <Group justify="flex-end">
                        <Button variant="filled" color="teal" onClick={getCroppedImage} radius="xl" size="md" style={{ backgroundColor: '#00a884' }}>
                            <IoCheckmark size={24} />
                        </Button>
                    </Group>
                </Stack>
            </Stack>
        </Modal>
    );
}
