import React, { useState } from 'react';
import { Modal, Tabs, Box, Text, Center, Stack } from '@mantine/core';
import { QRCodeSVG } from 'qrcode.react';
import { IoScanOutline, IoQrCodeOutline } from "react-icons/io5";
import { useAuth } from '../context/AuthContext';
import QRScanner from './QRScanner'; // We'll modify or wrap this logic
import { Html5Qrcode } from 'html5-qrcode'; // Import for manual scanner usage if needed, or reuse QRScanner

// We need to slightly adjust how QRScanner works, 
// or mostly reuse its logic but inside a tab panel.
// Since QRScanner is currently a Modal itself, we should extract the "Scanner" part 
// or just render the scanner UI here.
// For simplicity and speed, let's extract the scanner logic into an inline component or reuse.

// Actually, rewriting scanner logic here is cleaner for the Tab layout 
// than trying to embed a Modal inside a Modal's tab (which is bad UX).

import { useEffect, useRef } from 'react';
import axios from 'axios';
import { Alert, Loader } from '@mantine/core';

const ScannerTab = ({ active }) => {
    const [scanResult, setScanResult] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [loading, setLoading] = useState(false);
    const scannerRef = useRef(null);

    useEffect(() => {
        let html5QrCode;

        const startScanner = async () => {
            if (!active) return;
            // Cleanup existing if any
            if (scannerRef.current) {
                try {
                    await scannerRef.current.stop();
                    scannerRef.current.clear();
                } catch (e) { }
            }

            setLoading(true);
            setError(null);

            try {
                const devices = await Html5Qrcode.getCameras();
                if (!devices || devices.length === 0) throw new Error("No camera found");

                html5QrCode = new Html5Qrcode("reader-tab");
                scannerRef.current = html5QrCode;

                await html5QrCode.start(
                    { facingMode: "environment" },
                    { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
                    onScanSuccess,
                    () => { }
                );
                setLoading(false);
            } catch (err) {
                console.error(err);
                if (err.name === 'NotAllowedError') {
                    setError("Camera access denied. Please allow permissions.");
                } else if (err.name === 'NotFoundError') {
                    setError("No camera found.");
                } else if (err.name === 'NotReadableError') {
                    setError("Camera is in use by another app.");
                } else if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
                    setError("Camera requires HTTPS.");
                } else {
                    setError("Camera error: " + (err.message || 'Unknown'));
                }
                setLoading(false);
            }
        };

        if (active) {
            setTimeout(startScanner, 300);
        } else {
            if (scannerRef.current) {
                scannerRef.current.stop().catch(console.error);
            }
        }

        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().catch(console.error);
            }
        };
    }, [active]);

    const onScanSuccess = async (decodedText) => {
        if (scanResult === decodedText) return;
        setScanResult(decodedText);
        if (scannerRef.current) scannerRef.current.pause();

        try {
            await axios.post('/auth/link-device', { qrId: decodedText });
            setSuccess('Device linked successfully!');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to link');
            if (scannerRef.current) scannerRef.current.resume();
        }
    };

    return (
        <Box style={{ position: 'relative', height: 350, backgroundColor: 'black', overflow: 'hidden', borderRadius: 8 }}>
            {!success && !error && (
                <>
                    <div id="reader-tab" style={{ width: '100%', height: '100%' }}></div>
                    <div style={{
                        position: 'absolute', top: '50px', left: '50px', right: '50px', height: '2px',
                        backgroundColor: '#00a884', boxShadow: '0 0 4px #00a884',
                        animation: 'scan-line 2s infinite linear'
                    }} />
                </>
            )}
            {loading && <Center h="100%" c="white"><Loader color="teal" /></Center>}
            {(success || error) && (
                <Center h="100%" c="white">
                    <Stack align="center">
                        <Text c={success ? 'green' : 'red'}>{success || error}</Text>
                    </Stack>
                </Center>
            )}
            <style>{`@keyframes scan-line { 0% { transform: translateY(0); opacity: 0.5; } 50% { opacity: 1; } 100% { transform: translateY(250px); opacity: 0.5; } }`}</style>
        </Box>
    );
};

const MyCodeTab = () => {
    const { token, user } = useAuth();
    // We encode the token directly (dangerous, but per request "scan to login")
    // Or we encode a JSON: { type: 'session_transfer', token: ... }
    const qrData = JSON.stringify({ token });

    return (
        <Center h={350} bg="white" style={{ flexDirection: 'column', gap: 20 }}>
            <Box p="lg" style={{ border: '1px solid #e9edef', borderRadius: 16 }}>
                <QRCodeSVG value={qrData} size={200} />
            </Box>
            <Stack gap={4} align="center">
                <Text fw={500} size="lg">{user?.username}</Text>
                <Text c="dimmed" size="sm">Scan this code to log in on another device</Text>
            </Stack>
        </Center>
    );
};

const DeviceLinkModal = ({ opened, onClose }) => {
    const [activeTab, setActiveTab] = useState('scan');

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title="Linked Devices"
            centered
            size="md"
            styles={{
                header: { backgroundColor: '#111b21', color: '#e9edef' },
                body: { backgroundColor: '#111b21', color: '#e9edef', padding: 16 },
                close: { color: '#8696a0', '&:hover': { backgroundColor: 'transparent' } }
            }}
        >
            <Tabs value={activeTab} onChange={setActiveTab} variant="pills" radius="xl" color="teal">
                <Tabs.List grow mb="md" style={{ backgroundColor: '#202c33', padding: 4, borderRadius: 24 }}>
                    <Tabs.Tab value="scan" leftSection={<IoScanOutline />}>Scan Code</Tabs.Tab>
                    <Tabs.Tab value="my_code" leftSection={<IoQrCodeOutline />}>My Code</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="scan">
                    <ScannerTab active={activeTab === 'scan'} />
                    <Text size="xs" c="dimmed" ta="center" mt="sm">Point at a QR code to link a device</Text>
                </Tabs.Panel>

                <Tabs.Panel value="my_code">
                    <MyCodeTab />
                </Tabs.Panel>
            </Tabs>
        </Modal>
    );
};

export default DeviceLinkModal;
