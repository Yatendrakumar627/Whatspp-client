import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Modal, Text, Box, Alert, Loader, Center, Stack } from '@mantine/core';
import axios from 'axios';
import { IoCloseOutline, IoScanOutline } from "react-icons/io5";

const QRScanner = ({ opened, onClose, mode = 'link' }) => {
    const props = { mode };
    const [scanResult, setScanResult] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState(null);
    const scannerRef = useRef(null);

    useEffect(() => {
        let html5QrCode;

        const startScanner = async () => {
            if (!opened) return;

            setLoading(true);
            setError(null);

            try {
                // Determine camera
                const devices = await Html5Qrcode.getCameras();
                if (!devices || devices.length === 0) {
                    throw new Error("No camera found");
                }

                // Use back camera if available, else first
                // Usually devices are labeled, but we can't be sure of 'facingMode' support in pure ID listing
                // Html5Qrcode allows passing { facingMode: "environment" }

                const cameraId = devices[0].id; // Default to first

                html5QrCode = new Html5Qrcode("reader");
                scannerRef.current = html5QrCode;

                await html5QrCode.start(
                    { facingMode: "environment" }, // Prefer back camera
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0
                    },
                    onScanSuccess,
                    onScanFailure
                );
                setLoading(false);

            } catch (err) {
                console.error("Error starting scanner:", err);
                setError("Could not access camera. Please ensure permissions are granted.");
                setLoading(false);
            }
        };

        if (opened) {
            // Small timeout to allow Modal to mount DOM
            setTimeout(startScanner, 300);
        }

        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().then(() => {
                    scannerRef.current.clear();
                }).catch(err => console.error("Failed to stop scanner", err));
            }
        };
    }, [opened]);

    const onScanSuccess = async (decodedText, decodedResult) => {
        if (scanResult === decodedText) return; // Debounce
        setScanResult(decodedText);

        // Pause scanning visually or logically
        if (scannerRef.current) {
            scannerRef.current.pause();
        }

        try {
            await handleScan(decodedText);
        } catch (err) {
            setError(err.message || 'Failed to link device');
            // Resume if failed
            if (scannerRef.current) scannerRef.current.resume();
        }
    };

    const onScanFailure = (error) => {
        // Ignore frame failures
    };

    const linkDevice = async (qrId) => {
        try {
            setError(null);
            setSuccess(null);
            await axios.post('/auth/link-device', { qrId });
            setSuccess('Device linked successfully!');
            setTimeout(() => {
                onClose();
                setSuccess(null);
                setScanResult(null);
            }, 1500);
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    const handleLoginScan = (scannedData) => {
        try {
            // Expecting JSON: { token: "..." }
            let data;
            try {
                data = JSON.parse(scannedData);
            } catch (e) {
                // If not JSON, maybe raw token?
                data = { token: scannedData };
            }

            if (data.token) {
                setSuccess('Token detected! Logging in...');
                localStorage.setItem('token', data.token);
                setTimeout(() => {
                    window.location.href = '/';
                }, 1000);
            } else {
                setError('Invalid QR Code for login.');
                if (scannerRef.current) scannerRef.current.resume();
            }
        } catch (err) {
            setError('Failed to process login code.');
            if (scannerRef.current) scannerRef.current.resume();
        }
    };

    const handleScan = async (decodedText) => {
        // Determine mode based on prop or context?
        // Let's assume we pass a prop `mode` or infer.
        // But I can't change the signature easily in `replace`.
        // Let's use a prop `mode` that defaults to 'link'.
        // Oh wait, I can just use `props.mode`.
        if (props.mode === 'login') {
            handleLoginScan(decodedText);
        } else {
            await linkDevice(decodedText);
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title="Link a Device"
            centered
            size="md"
            styles={{
                header: { backgroundColor: '#111b21', color: '#e9edef' },
                body: { backgroundColor: '#111b21', color: '#e9edef', padding: 0 },
                title: { fontWeight: 500 },
                close: { color: '#8696a0', '&:hover': { backgroundColor: 'transparent' } }
            }}
        >
            <Box style={{ position: 'relative', height: 400, overflow: 'hidden', backgroundColor: 'black' }}>
                {!success && !error && (
                    <>
                        <div id="reader" style={{ width: '100%', height: '100%' }}></div>

                        {/* Custom Overlay */}
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            pointerEvents: 'none',
                            border: '50px solid rgba(0,0,0,0.5)',
                            boxSizing: 'border-box'
                        }}>
                            {/* Corner markers inside could be added here */}
                        </div>

                        {/* Scan Line Animation */}
                        <div style={{
                            position: 'absolute',
                            top: '50px', left: '50px', right: '50px', height: '2px',
                            backgroundColor: '#00a884',
                            boxShadow: '0 0 4px #00a884',
                            animation: 'scan-line 2s infinite linear'
                        }} />
                    </>
                )}

                {loading && (
                    <Center style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 }}>
                        <Loader color="teal" />
                    </Center>
                )}

                {/* Status Messages Overlay */}
                {(success || error) && (
                    <Center style={{ position: 'absolute', bottom: 20, left: 0, right: 0, zIndex: 20 }}>
                        {success && <Alert color="green" radius="xl" withCloseButton={false}>{success}</Alert>}
                        {error && <Alert color="red" radius="xl" withCloseButton={false}>{error}</Alert>}
                    </Center>
                )}

                <style>
                    {`
                        @keyframes scan-line {
                            0% { transform: translateY(0); opacity: 0.5; }
                            50% { opacity: 1; }
                            100% { transform: translateY(300px); opacity: 0.5; }
                        }
                        #reader video { object-fit: cover !important; }
                    `}
                </style>
            </Box>

            <Box p="md" bg="#111b21" style={{ borderTop: '1px solid #202c33', textAlign: 'center' }}>
                <Text size="sm" c="#8696a0">Point your camera at the QR code</Text>
            </Box>
        </Modal>
    );
};

export default QRScanner;
