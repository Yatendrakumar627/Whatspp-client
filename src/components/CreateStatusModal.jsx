import React from 'react';
import { Modal, Tabs, TextInput, FileButton, Button, Group, Box, ColorInput, Select, Text, Stack } from '@mantine/core';
import { useState, useRef } from 'react';
import { IoImageOutline, IoTextOutline, IoSend } from "react-icons/io5";
import { useChat } from '../context/ChatContext';

export default function CreateStatusModal({ opened, onClose, onStatusCreated }) {
    const { api } = useChat();
    const [activeTab, setActiveTab] = useState('text');
    const [textContent, setTextContent] = useState('');
    const [bgColor, setBgColor] = useState('#000000');
    const [file, setFile] = useState(null);
    const [caption, setCaption] = useState('');
    const [privacy, setPrivacy] = useState('everyone');
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        setLoading(true);
        try {
            let contentUrl = textContent;
            let type = activeTab;

            if (activeTab !== 'text' && file) {
                const formData = new FormData();
                formData.append('file', file);
                const uploadRes = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                contentUrl = uploadRes.data.imageUrl;
                type = file.type.startsWith('image') ? 'image' : 'video';
            }

            await api.post('/status/create', {
                type,
                content: contentUrl,
                caption,
                background: bgColor,
                privacy
            });

            onStatusCreated();
            onClose();
            // Reset state
            setTextContent('');
            setFile(null);
            setCaption('');
        } catch (error) {
            console.error("Failed to create status", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title="Create Status"
            centered
            styles={{ content: { backgroundColor: '#202c33', color: '#e9edef' }, header: { backgroundColor: '#202c33', color: '#e9edef' } }}
        >
            <Tabs value={activeTab} onChange={setActiveTab} variant="pills" color="green">
                <Tabs.List mb="md" justify="center">
                    <Tabs.Tab value="text" leftSection={<IoTextOutline />}>Text</Tabs.Tab>
                    <Tabs.Tab value="media" leftSection={<IoImageOutline />}>Media</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="text">
                    <Stack>
                        <TextInput
                            placeholder="Type your status..."
                            size="lg"
                            styles={{ input: { backgroundColor: bgColor, color: 'white', border: 'none', textAlign: 'center', height: '150px' } }}
                            value={textContent}
                            onChange={(e) => setTextContent(e.target.value)}
                        />
                        <ColorInput
                            value={bgColor}
                            onChange={setBgColor}
                            format="hex"
                            swatches={['#000000', '#8c1616', '#164c8c', '#53168c', '#8c1682', '#168c22']}
                        />
                    </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="media">
                    <Stack align="center">
                        <FileButton onChange={setFile} accept="image/*,video/*">
                            {(props) => <Button {...props} variant="light" color="green">Select Image or Video</Button>}
                        </FileButton>
                        {file && (
                            <Box>
                                <Text size="sm" c="dimmed">Selected: {file.name}</Text>
                                {/* Preview could go here */}
                            </Box>
                        )}
                        <TextInput
                            placeholder="Add a caption..."
                            style={{ width: '100%' }}
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                        />
                    </Stack>
                </Tabs.Panel>

                <Stack mt="md">
                    <Select
                        label="Privacy"
                        data={[
                            { value: 'everyone', label: 'Everyone' },
                            { value: 'contacts', label: 'My Contacts' },
                            // { value: 'selected', label: 'Only Shared With...' } // TODO: Implement user selector
                        ]}
                        value={privacy}
                        onChange={setPrivacy}
                        styles={{ input: { backgroundColor: '#111b21', color: 'white', border: '1px solid #2a3942' }, label: { color: '#8696a0' } }}
                    />
                    <Button fullWidth color="green" onClick={handleCreate} loading={loading} rightSection={<IoSend />}>
                        Share Status
                    </Button>
                </Stack>
            </Tabs>
        </Modal>
    );
}
