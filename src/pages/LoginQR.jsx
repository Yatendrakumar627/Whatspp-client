import React, { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Center, Paper, Text, Stack, Loader, Title, Flex, Box, List, ThemeIcon, Checkbox } from '@mantine/core';
import { IoEllipsisVertical, IoSettingsOutline } from "react-icons/io5";

const LoginQR = () => {
    const [qrId, setQrId] = useState(null);
    const [status, setStatus] = useState('Generating QR...');
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        const newQrId = crypto.randomUUID();
        setQrId(newQrId);
        setStatus('Waiting for scan...');

        const newSocket = io('http://localhost:5200');

        newSocket.on('connect', () => {
            console.log('Connected to socket for QR login');
            newSocket.emit('join_qr_room', { qrId: newQrId });
        });

        newSocket.on('device_linked', ({ token, user }) => {
            console.log('Device linked!', user);
            setStatus('Logged in! Redirecting...');
            localStorage.setItem('token', token);
            window.location.href = '/';
        });

        return () => {
            newSocket.disconnect();
        };
    }, []);

    return (
        <Box style={{ position: 'relative', height: '100vh', background: '#d1d7db', overflow: 'hidden' }}>
            {/* Green Header Strip */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '220px', background: '#00a884', zIndex: 0 }}>
                <Flex align="center" style={{ maxWidth: 1000, margin: '0 auto', height: '100%', paddingLeft: 20 }}>
                    <Flex align="center" gap="sm">
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <svg viewBox="0 0 33 33" width="33" height="33" className="" fill="currentColor"><path d="M16.6 0C7.5 0 0 7.5 0 16.7c0 2.9.8 5.7 2.2 8.2L.6 33l8.3-2.2c2.4 1.3 5.1 2 7.7 2 9.2 0 16.7-7.5 16.7-16.7S25.7 0 16.6 0zm0 28.3c-2.4 0-4.7-.6-6.8-1.9l-.5-.3-5 1.3 1.3-4.9-.3-.5C4.1 19.9 3.5 17.6 3.5 16.7c0-7.2 5.9-13.1 13.1-13.1s13.1 5.9 13.1 13.1-5.9 11.6-13.1 11.6z"></path><path d="M21.9 20.3c-.3-.1-1.7-.9-1.9-1-.2-.1-.4-.2-.5.1-.2.3-.7.9-.9 1.1-.1.2-.4.2-.7.1-1.4-.6-2.5-1.5-3.6-3.4-.1-.3 0-.4.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2.1-.3 0-.5-.1-.2-.5-1.2-.6-1.6-.2-.4-.4-.3-.6-.3h-.5c-.2 0-.5.1-.8.4-.3.3-1.1 1.1-1.1 2.7s1.1 3.2 1.3 3.4c.1.2 2.2 3.4 5.4 4.7 2.2.9 3 .9 3.6.8.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.1-1.4-.2-.1-.4-.2-.7-.4z"></path></svg>
                            <span style={{ textTransform: 'uppercase', letterSpacing: 1 }}>WhatsApp Web</span>
                        </div>
                    </Flex>
                </Flex>
            </div>

            {/* Main Card */}
            <Center style={{ position: 'relative', zIndex: 1, paddingTop: 40, paddingBottom: 40, height: '100%', alignItems: 'flex-start', overflowY: 'auto' }}>
                <Paper
                    radius="md"
                    shadow="xl"
                    bg="white"
                    style={{
                        width: '90%',
                        maxWidth: '1000px',
                        minHeight: '70vh',
                        display: 'flex',
                        overflow: 'hidden',
                        flexDirection: 'column'
                    }}
                >
                    <Flex direction={{ base: 'column-reverse', md: 'row' }} style={{ width: '100%', height: '100%' }}>
                        {/* Left Side: Instructions */}
                        <Box p={{ base: 'lg', md: 50 }} style={{ flex: 1.5 }}>
                            <Title order={2} fw={300} mb="xl" style={{ color: '#41525d' }}>Use WhatsApp on your computer</Title>

                            <List spacing="lg" size="lg" center>
                                <List.Item style={{ color: '#3b4a54', fontSize: 18 }}>Open WhatsApp on your phone</List.Item>
                                <List.Item style={{ color: '#3b4a54', fontSize: 18 }}>
                                    Tap <span style={{ fontWeight: 600 }}>Menu</span> <IoEllipsisVertical style={{ verticalAlign: 'middle' }} /> on Android, or <span style={{ fontWeight: 600 }}>Settings</span> <IoSettingsOutline style={{ verticalAlign: 'middle' }} /> on iPhone
                                </List.Item>
                                <List.Item style={{ color: '#3b4a54', fontSize: 18 }}>Tap <span style={{ fontWeight: 600 }}>Linked devices</span> and then <span style={{ fontWeight: 600 }}>Link a device</span></List.Item>
                                <List.Item style={{ color: '#3b4a54', fontSize: 18 }}>Point your phone to this screen to capture the code</List.Item>
                            </List>

                            <Box mt={40}>
                                <Text c="#00a884" fw={500} style={{ cursor: 'pointer', fontSize: 16 }}>Need help to get started?</Text>
                            </Box>
                        </Box>

                        {/* Right Side: QR Code */}
                        <Box style={{ flex: 1, borderLeft: '1px solid #e9edef' }} p={{ base: 'lg', md: 50 }}>
                            <Stack align="center" justify="center" h="100%">
                                <div style={{ position: 'relative' }} data-testid="qr-code-container" data-qr-id={qrId}>
                                    {qrId ? (
                                        <div style={{ border: '1px solid #e9edef', padding: 10, borderRadius: 0 }}>
                                            <QRCodeSVG value={qrId} size={264} fgColor="#111b21" />
                                        </div>
                                    ) : (
                                        <Loader color="gray" size="xl" />
                                    )}

                                    {/* Logo Overlay (Simulated) */}
                                    <div style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        background: 'white',
                                        padding: 5,
                                        borderRadius: '50%'
                                    }}>
                                        <svg viewBox="0 0 33 33" width="30" height="30" fill="#00a884"><path d="M16.6 0C7.5 0 0 7.5 0 16.7c0 2.9.8 5.7 2.2 8.2L.6 33l8.3-2.2c2.4 1.3 5.1 2 7.7 2 9.2 0 16.7-7.5 16.7-16.7S25.7 0 16.6 0zm0 28.3c-2.4 0-4.7-.6-6.8-1.9l-.5-.3-5 1.3 1.3-4.9-.3-.5C4.1 19.9 3.5 17.6 3.5 16.7c0-7.2 5.9-13.1 13.1-13.1s13.1 5.9 13.1 13.1-5.9 11.6-13.1 11.6z"></path><path d="M21.9 20.3c-.3-.1-1.7-.9-1.9-1-.2-.1-.4-.2-.5.1-.2.3-.7.9-.9 1.1-.1.2-.4.2-.7.1-1.4-.6-2.5-1.5-3.6-3.4-.1-.3 0-.4.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2.1-.3 0-.5-.1-.2-.5-1.2-.6-1.6-.2-.4-.4-.3-.6-.3h-.5c-.2 0-.5.1-.8.4-.3.3-1.1 1.1-1.1 2.7s1.1 3.2 1.3 3.4c.1.2 2.2 3.4 5.4 4.7 2.2.9 3 .9 3.6.8.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.1-1.4-.2-.1-.4-.2-.7-.4z" fill="white"></path></svg>
                                    </div>
                                </div>

                                <Box mt="xl">
                                    <Checkbox label="Keep me signed in" color="teal" defaultChecked />
                                </Box>

                                <Text c={status.includes('Logged') ? 'green' : 'dimmed'} size="sm" mt="md">{status}</Text>
                            </Stack>
                        </Box>
                    </Flex>
                </Paper>
            </Center>

            {/* Footer Text */}
            <Box style={{ position: 'absolute', bottom: 30, width: '100%', textAlign: 'center', zIndex: 0 }}>
                <Text c="#8696a0" size="sm">from Meta</Text>
            </Box>
        </Box>
    );
};

export default LoginQR;
