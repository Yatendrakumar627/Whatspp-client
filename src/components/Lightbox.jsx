import React, { useState } from 'react';
import { Modal, ActionIcon, Group, Text, Tooltip } from '@mantine/core';
import { IoClose, IoDownloadOutline, IoExpandOutline, IoContractOutline } from 'react-icons/io5';

const Lightbox = ({ opened, onClose, src, alt = 'Shared image' }) => {
    const [zoomed, setZoomed] = useState(false);

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            fullScreen
            withCloseButton={false}
            padding={0}
            style={{ zIndex: 300 }}
            styles={{
                content: {
                    backgroundColor: 'rgba(0,0,0,0.92)',
                    display: 'flex',
                    flexDirection: 'column'
                },
                body: { flex: 1, display: 'flex', flexDirection: 'column' }
            }}
        >
            {/* Top bar */}
            <Group
                justify="space-between"
                px="md"
                py="sm"
                style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20 }}
            >
                <ActionIcon variant="transparent" color="white" size="lg" radius="xl" onClick={onClose}>
                    <IoClose size={26} />
                </ActionIcon>
                <Group gap={4}>
                    <Tooltip label={zoomed ? 'Zoom out' : 'Zoom in'}>
                        <ActionIcon
                            variant="transparent"
                            color="white"
                            size="lg"
                            radius="xl"
                            onClick={() => setZoomed(z => !z)}
                        >
                            {zoomed ? <IoContractOutline size={24} /> : <IoExpandOutline size={24} />}
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Download">
                        <ActionIcon
                            variant="transparent"
                            color="white"
                            size="lg"
                            radius="xl"
                            component="a"
                            href={src}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <IoDownloadOutline size={24} />
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </Group>

            {/* Image */}
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: zoomed ? 'auto' : 'hidden',
                    cursor: zoomed ? 'grab' : 'pointer',
                    padding: '40px 20px 20px',
                }}
                onClick={() => setZoomed(z => !z)}
            >
                <img
                    src={src}
                    alt={alt}
                    style={{
                        maxWidth: zoomed ? '200%' : '100%',
                        maxHeight: zoomed ? '200%' : '100%',
                        objectFit: zoomed ? 'contain' : 'contain',
                        transform: zoomed ? 'scale(1.5)' : 'scale(1)',
                        transition: 'transform 0.25s ease',
                        borderRadius: '4px'
                    }}
                />
            </div>

            <Text c="rgba(255,255,255,0.6)" size="xs" ta="center" pb="sm">
                Click to {zoomed ? 'zoom out' : 'zoom in'}
            </Text>
        </Modal>
    );
};

export default Lightbox;