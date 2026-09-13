import React, { useEffect, useState } from 'react';
import { Box, ActionIcon, Group, Text, Avatar, Paper, Stack } from '@mantine/core';
import { IoMic, IoMicOff, IoVideocam, IoVideocamOff, IoCall, IoRepeat, IoChatbubble, IoClose } from "react-icons/io5";
import { MdScreenShare, MdStopScreenShare } from "react-icons/md";
import { useCall, CallState } from '../context/CallContext';

const CallModal = () => {
    const {
        callAccepted,
        myVideo,
        userVideo,
        callEnded,
        stream,
        call,
        leaveCall,
        toggleVideo,
        toggleAudio,
        isVideoEnabled,
        isAudioEnabled,
        shareScreen,
        switchCallType,
        currentCallType,
        incomingSwitchRequest,
        isWaitingForSwitchResponse,
        respondToSwitchRequest,
        callState
    } = useCall();

    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [callStartTime, setCallStartTime] = useState(null);
    const [isSwapped, setIsSwapped] = useState(false); // State to toggle main/PIP views

    const handleSwapViews = () => setIsSwapped(!isSwapped);

    // Calculate call duration
    useEffect(() => {
        if (callAccepted && !callEnded) {
            const start = Date.now();
            setCallStartTime(start);
            const interval = setInterval(() => {
                setCallDuration(Math.floor((Date.now() - start) / 1000));
            }, 1000);
            return () => {
                clearInterval(interval);
                setCallDuration(0);
            };
        }
    }, [callAccepted, callEnded]);

    // Format call duration
    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // If call hasn't started or ended, don't show
    if (!stream || callEnded) return null;

    const getStatusText = () => {
        switch (callState) {
            case CallState.CHECKING: return 'Connecting...';
            case CallState.DIALING: return 'Dialing...';
            case CallState.RINGING: return 'Ringing...';
            case CallState.BUSY: return 'User is busy';
            case CallState.CONNECTED: return 'Connected';
            default: return 'Calling...';
        }
    };

    return (

        <Box
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 9999,
                backgroundColor: 'rgba(0,0,0,0.7)', // Dark backdrop
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(5px)'
            }}
        >
            {/* Main Window */}
            <Paper
                shadow="xl"
                radius="lg"
                style={{
                    width: '900px',
                    height: '600px',
                    maxWidth: '95vw',
                    maxHeight: '90vh',
                    backgroundColor: '#1c1c1c', // Window BG
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    border: '1px solid #333',
                    position: 'relative'
                }}
            >
                {/* Header / Title Bar */}
                <Box
                    p="xs"
                    style={{
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#1c1c1c',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        color: '#8696a0',
                        fontSize: '12px',
                        zIndex: 10
                    }}
                >
                    <IoCall size={12} style={{ marginRight: 6 }} />
                    <Text span size="xs">End-to-end encrypted</Text>
                </Box>

                <Box style={{ flex: 1, position: 'relative', backgroundColor: '#000', overflow: 'hidden' }}>
                    {/* ALWAYS render video elements to ensure refs are available for WebRTC tracks */}
                    {/* Main Video: Remote (or Local if swapped) */}
                    <video
                        playsInline
                        ref={isSwapped ? myVideo : userVideo}
                        autoPlay
                        muted={isSwapped} // Mute if it's our own video
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            backgroundColor: '#000',
                            // Show only if we have a stream AND call is accepted (for remote) OR it's swapped (local)
                            display: (callAccepted && !callEnded && currentCallType === 'video') || (isSwapped && stream) ? 'block' : 'none'
                        }}
                    />

                    {/* Placeholder for Remote User (when not connected or no video) */}
                    {(!callAccepted || currentCallType === 'audio') && !isSwapped && (
                        <Box style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#e9edef',
                            zIndex: 1
                        }}>
                            <Avatar src={null} size={120} radius="50%" mb="md" color="blue">{call.name?.[0]}</Avatar>
                            <Text size="xl" fw={600} c={callState === CallState.BUSY ? 'red' : 'white'}>
                                {callState === CallState.BUSY ? `User is busy` : `${getStatusText()} ${call.name || 'User'}`}
                            </Text>
                        </Box>
                    )}

                    {/* PiP: Local (or Remote if swapped) */}
                    {/* Always render PiP container, toggle content visibility */}
                    {(stream && currentCallType === 'video') && (
                        <Paper
                            shadow="lg"
                            radius="md"
                            onClick={handleSwapViews}
                            style={{
                                position: 'absolute',
                                top: '20px',
                                right: '20px',
                                width: '160px',
                                height: '213px',
                                overflow: 'hidden',
                                zIndex: 20,
                                border: '1px solid rgba(255,255,255,0.1)',
                                backgroundColor: '#202c33',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                // Create a mini-view for the secondary video
                            }}
                        >
                            <video
                                playsInline
                                muted={!isSwapped} // Mute always if it's local (which is default for PiP)
                                ref={isSwapped ? userVideo : myVideo}
                                autoPlay
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    transform: !isSwapped ? 'scaleX(-1)' : 'none', // Mirror local video
                                    display: 'block'
                                }}
                            />
                        </Paper>
                    )}
                </Box>

                {/* Footer / Controls Bar */}
                <Group
                    justify="center"
                    align="center"
                    gap="xl"
                    style={{
                        height: '80px',
                        backgroundColor: '#1c1c1c',
                        borderTop: '1px solid rgba(255,255,255,0.05)'
                    }}
                >
                    <ActionIcon
                        variant="subtle"
                        color={isAudioEnabled ? "gray" : "red"}
                        size="xl"
                        radius="xl"
                        onClick={toggleAudio}
                        style={{ backgroundColor: isAudioEnabled ? 'rgba(255,255,255,0.1)' : 'rgba(241, 92, 109, 0.2)' }}
                    >
                        {isAudioEnabled ? <IoMic size={24} color="#e9edef" /> : <IoMicOff size={24} color="#f15c6d" />}
                    </ActionIcon>

                    <ActionIcon
                        variant="subtle"
                        color={isVideoEnabled ? "gray" : "red"}
                        size="xl"
                        radius="xl"
                        onClick={toggleVideo}
                        style={{ backgroundColor: isVideoEnabled ? 'rgba(255,255,255,0.1)' : 'rgba(241, 92, 109, 0.2)' }}
                    >
                        {isVideoEnabled ? <IoVideocam size={24} color="#e9edef" /> : <IoVideocamOff size={24} color="#f15c6d" />}
                    </ActionIcon>

                    {currentCallType === 'video' && (
                        <ActionIcon
                            variant="subtle"
                            color={isScreenSharing ? "blue" : "gray"}
                            size="xl"
                            radius="xl"
                            onClick={async () => {
                                const success = await shareScreen();
                                if (success) setIsScreenSharing(true);
                            }}
                            style={{ backgroundColor: isScreenSharing ? 'rgba(0, 168, 132, 0.2)' : 'rgba(255,255,255,0.1)' }}
                        >
                            {isScreenSharing ? <MdStopScreenShare size={24} color="#00a884" /> : <MdScreenShare size={24} color="#e9edef" />}
                        </ActionIcon>
                    )}

                    <ActionIcon
                        variant="filled"
                        color="red"
                        size={50} // Larger end call button
                        radius="xl"
                        onClick={leaveCall}
                        style={{ boxShadow: '0 4px 12px rgba(241, 92, 109, 0.4)' }}
                    >
                        <IoCall size={24} color="white" style={{ transform: 'rotate(135deg)' }} />
                    </ActionIcon>
                </Group>

                {/* Switch Request Overlay inside Window */}
                {/* (Simplified for brevity - can be added back if needed but priority is main visual) */}

            </Paper>
        </Box>
    );
};

export default CallModal;
