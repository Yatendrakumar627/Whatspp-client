import React, { createContext, useState, useRef, useEffect, useContext } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import axios from 'axios';
import { notifications } from '@mantine/notifications';

const CallContext = createContext();

export const useCall = () => useContext(CallContext);

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
    ]
};

export const CallState = {
    IDLE: 'IDLE',
    CHECKING: 'CHECKING', // Checking availability
    DIALING: 'DIALING',   // Socket sent, waiting for delivery
    RINGING: 'RINGING',   // Remote device acknowledged
    BUSY: 'BUSY',         // Remote user in another call
    CONNECTED: 'CONNECTED',
    ENDED: 'ENDED'
};

export const CallProvider = ({ children }) => {
    const { socket } = useSocket();
    const { user } = useAuth();

    // Core Call Data
    const [call, setCall] = useState({}); // { isReceivingCall, from, name, signal, callType }
    const [callState, setCallState] = useState(CallState.IDLE);
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);

    // Media
    const [stream, setStream] = useState(null);
    const [videoTrack, setVideoTrack] = useState(null);
    const [audioTrack, setAudioTrack] = useState(null);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);

    // UI/Meta
    const [name, setName] = useState('');
    const [currentCallType, setCurrentCallType] = useState('video');
    const [remoteUserId, setRemoteUserId] = useState(null);
    const [incomingSwitchRequest, setIncomingSwitchRequest] = useState(null);
    const [isWaitingForSwitchResponse, setIsWaitingForSwitchResponse] = useState(false);
    const [callHistory, setCallHistory] = useState([]);

    const myVideo = useRef();
    const userVideo = useRef();
    const connectionRef = useRef();
    const startTime = useRef(null);
    const pendingCandidates = useRef([]);

    // Audio Refs
    const ringtoneRef = useRef(new Audio('/sounds/ringtone.mp3'));
    const ringbackRef = useRef(new Audio('/sounds/ringback.mp3'));

    // Configure Audio
    useEffect(() => {
        ringtoneRef.current.loop = true;
        ringbackRef.current.loop = true;
    }, []);

    const playRingtone = () => {
        try { ringtoneRef.current.play().catch(e => console.warn("Audio play failed", e)); } catch (e) { }
    };
    const stopRingtone = () => {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
    };

    const playRingback = () => {
        try { ringbackRef.current.play().catch(e => console.warn("Audio play failed", e)); } catch (e) { }
    };
    const stopRingback = () => {
        ringbackRef.current.pause();
        ringbackRef.current.currentTime = 0;
    };

    const stopAllSounds = () => {
        stopRingtone();
        stopRingback();
    };

    const saveCallLog = async (logData) => {
        console.log("Saving call log with data:", logData);
        if (!logData.caller || !logData.receiver) {
            console.warn("Skipping call log: Missing caller or receiver", logData);
            return;
        }
        try {
            await axios.post('/calls/log', logData, {
                headers: { 'user-id': user?._id }
            });
            fetchCallHistory(); // Refresh history
        } catch (error) {
            console.error("Failed to save call log:", error.response?.data || error);
        }
    };

    // --- SOCKET EVENT HANDLERS ---
    useEffect(() => {
        if (!socket) return;

        socket.on('call_user', ({ from, name: callerName, signal, callType }) => {
            // Check if already in a call
            if (callState !== CallState.IDLE && callState !== CallState.ENDED) {
                // Busy logic: Backend usually handles this, but if race condition:
                socket.emit('call_busy', { to: from });
                return;
            }

            console.log("Receiving call from", from, "Type:", callType);
            setCall({ isReceivingCall: true, from, name: callerName, signal, callType });
            setRemoteUserId(from);
            setCurrentCallType(callType);
            setCallState(CallState.RINGING); // It is ringing for US

            // Ack delivery so caller hears ringback
            socket.emit('call_delivered', { to: from });

            playRingtone();
        });

        // Caller side: Receives ack that call was delivered
        socket.on('call_ringing', () => {
            // Only play ringback if we are in waiting state (Dialing)
            if (callState === CallState.DIALING || callState === CallState.CHECKING) {
                setCallState(CallState.RINGING);
                playRingback(); // Start playing sound NOW, not before
            }
        });

        socket.on('call_busy', ({ userToCall }) => {
            console.log("User is busy");
            setCallState(CallState.BUSY);
            stopAllSounds();
            setCallEnded(true);
            if (connectionRef.current) {
                connectionRef.current.close();
                connectionRef.current = null;
            }
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                setStream(null);
            }
            setVideoTrack(null);
            setAudioTrack(null);
            setRemoteUserId(null);
            setTimeout(() => {
                setCallState(CallState.IDLE);
                setCallEnded(false);
            }, 3000);
        });

        socket.on('call_error', ({ code, message }) => {
            console.error("Call Error:", message);
            setCallState(CallState.ENDED);
            stopAllSounds();
            if (code === 'OFFLINE') {
                notifications.show({ title: 'Call failed', message: 'The person you are trying to reach is offline.', color: 'red' });
            } else {
                notifications.show({ title: 'Call failed', message: message || 'Unable to reach the person at the moment.', color: 'red' });
            }
            leaveCall();
        });

        // Availability check response
        socket.on('call_available', ({ userToCall }) => {
            if (callState === CallState.CHECKING) {
                // Proceed to dial
                performDialing(userToCall, currentCallType);
            }
        });

        socket.on('call_accepted', (signal) => {
            setCallAccepted(true);
            setCallState(CallState.CONNECTED);
            startTime.current = Date.now();
            stopRingback();

            if (connectionRef.current) {
                connectionRef.current.setRemoteDescription(new RTCSessionDescription(signal))
                    .then(() => {
                        pendingCandidates.current.forEach(candidate => {
                            connectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                        });
                        pendingCandidates.current = [];
                    })
                    .catch(e => console.error("Error setting remote desc (answer):", e));
            }
        });

        socket.on('ice_candidate', ({ candidate }) => {
            if (connectionRef.current) {
                if (connectionRef.current.remoteDescription) {
                    connectionRef.current.addIceCandidate(new RTCIceCandidate(candidate))
                        .catch(e => console.error("Error adding ice candidate:", e));
                } else {
                    pendingCandidates.current.push(candidate);
                }
            }
        });

        socket.on('call_declined', () => {
            console.log("Call declined by user");
            // Treat as ended
            setCallState(CallState.ENDED);
            stopRingback();
            leaveCall();
        });

        socket.on('end_call', () => {
            leaveCall(true);
        });

        socket.on('call_type_switched', ({ newCallType }) => {
            console.log("Remote user switched call type to:", newCallType);
            setCurrentCallType(newCallType);
        });

        socket.on('switch_mode_request', ({ from, name, newCallType }) => {
            console.log("Incoming switch request from", name, "to", newCallType);
            setIncomingSwitchRequest({ from, name, newCallType });
        });

        socket.on('switch_mode_response', ({ accepted, newCallType }) => {
            setIsWaitingForSwitchResponse(false);
            if (accepted) {
                performLocalTypeSwitch(newCallType);
            } else {
                console.log("Peer declined video switch");
            }
        });

        return () => {
            socket.off('call_user');
            socket.off('call_accepted');
            socket.off('call_declined');
            socket.off('ice_candidate');
            socket.off('end_call');
            socket.off('call_type_switched');
            socket.off('switch_mode_request');
            socket.off('switch_mode_response');
            socket.off('call_ringing');
            socket.off('call_busy');
            socket.off('call_available');
            socket.off('call_error');
        };
    }, [socket, callState]); // Depend on callState if needed, careful of loops


    const isGettingStream = useRef(false);

    const startStream = async (callType = 'video') => {
        if (stream) return stream;
        if (isGettingStream.current) return null; // Prevent concurrent requests

        isGettingStream.current = true;
        try {
            const constraints = callType === 'video'
                ? { video: true, audio: true }
                : { video: false, audio: true };
            const currentStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(currentStream);

            const vTrack = currentStream.getVideoTracks()[0];
            const aTrack = currentStream.getAudioTracks()[0];
            setVideoTrack(vTrack);
            setAudioTrack(aTrack);

            if (myVideo.current) {
                myVideo.current.srcObject = currentStream;
            }
            isGettingStream.current = false;
            return currentStream;
        } catch (error) {
            console.error("Error accessing media devices:", error);
            isGettingStream.current = false;
            const message = error?.name === 'NotAllowedError'
                ? 'Permission was denied. Please allow access to your camera and microphone in browser settings.'
                : error?.name === 'NotFoundError'
                    ? 'No camera or microphone detected on this device.'
                    : 'Could not access camera/microphone. Please allow permissions and try again.';
            notifications.show({ title: 'Permission needed', message, color: 'red' });
            return null;
        }
    };

    const fetchCallHistory = async () => {
        try {
            const { data } = await axios.get('/calls/history', {
                headers: { 'user-id': user?._id }
            });
            setCallHistory(data);
        } catch (e) { console.error(e); }
    };

    // --- INITIATE CALL FLOW ---
    // 1. Check availability
    const callUser = async (id, callType = 'video') => {
        // Reset state
        setCallAccepted(false);
        setCallEnded(false);
        setCallState(CallState.CHECKING);
        setCurrentCallType(callType);
        setRemoteUserId(id);

        socket.emit('check_availability', { userToCall: id, from: user._id });
    };

    // 2. Actually Dial (called after availability check passed)
    const performDialing = async (id, callType) => {
        // We move to DIALING state but DO NOT play ringback yet
        setCallState(CallState.DIALING);

        const currentStream = await startStream(callType);
        if (!currentStream) {
            setCallState(CallState.IDLE);
            return;
        }

        console.log(`Starting ${callType} call with user:`, id);

        const peer = new RTCPeerConnection(ICE_SERVERS);
        connectionRef.current = peer;

        currentStream.getTracks().forEach(track => peer.addTrack(track, currentStream));

        peer.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('ice_candidate', { to: id, candidate: event.candidate });
            }
        };

        peer.ontrack = (event) => {
            console.log("Received remote track");
            if (userVideo.current) {
                userVideo.current.srcObject = event.streams[0];
            }
        };

        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);

        socket.emit('call_user', {
            userToCall: id,
            signalData: offer,
            from: user._id,
            name: user.username,
            callType: callType
        });

        // Wait for 'call_ringing' to play sound
    };

    const answerCall = async () => {
        const currentStream = await startStream(call.callType || 'video');
        setCurrentCallType(call.callType || 'video');
        setCallAccepted(true);
        setCallState(CallState.CONNECTED);
        startTime.current = Date.now(); // Start timer
        stopRingtone(); // Stop ringtone

        const peer = new RTCPeerConnection(ICE_SERVERS);
        connectionRef.current = peer;

        currentStream.getTracks().forEach(track => peer.addTrack(track, currentStream));

        peer.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('ice_candidate', { to: call.from, candidate: event.candidate });
            }
        };

        peer.ontrack = (event) => {
            if (userVideo.current) {
                userVideo.current.srcObject = event.streams[0];
            }
        };

        peer.setRemoteDescription(new RTCSessionDescription(call.signal))
            .then(async () => {
                pendingCandidates.current.forEach(candidate => {
                    connectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                });
                pendingCandidates.current = [];

                const answer = await peer.createAnswer();
                await peer.setLocalDescription(answer);

                socket.emit('answer_call', { signal: answer, to: call.from });
            });
    };

    const declineCall = () => {
        stopAllSounds();
        if (call.from) {
            socket.emit('call_declined', { to: call.from });
            saveCallLog({
                caller: call.from,
                receiver: user._id,
                type: call.callType || 'video',
                status: 'declined',
                duration: 0
            });
        }
        setCall({});
        setCallState(CallState.IDLE);
        setCallAccepted(false);
    };

    const leaveCall = (skipSave = false) => {
        stopAllSounds();

        if (!skipSave && callAccepted && remoteUserId && user?._id) {
            const isReceiver = call.isReceivingCall;
            const partnerId = remoteUserId;
            const duration = startTime.current ? Math.round((Date.now() - startTime.current) / 1000) : 0;

            saveCallLog({
                caller: isReceiver ? partnerId : user._id,
                receiver: isReceiver ? user._id : partnerId,
                type: currentCallType,
                status: 'accepted',
                duration: duration
            });
        }

        if (!callEnded && remoteUserId && socket) {
            socket.emit('end_call', { to: remoteUserId });
        }

        setCallEnded(true);
        if (connectionRef.current) {
            connectionRef.current.close();
            connectionRef.current = null;
        }
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }

        setVideoTrack(null);
        setAudioTrack(null);
        setCurrentCallType('video');
        setRemoteUserId(null);
        setIncomingSwitchRequest(null);
        setIsWaitingForSwitchResponse(false);
        setCall({});
        setCallState(CallState.IDLE);
        setCallAccepted(false);
        setTimeout(() => setCallEnded(false), 500);
    };

    // ... (Keep existing toggle/switch logic same, just using state)
    const toggleAudio = () => {
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            setIsAudioEnabled(audioTrack.enabled);
        }
    };

    const toggleVideo = async () => {
        if (!stream) return;
        if (isVideoEnabled) {
            if (videoTrack) {
                videoTrack.stop();
                setVideoTrack(null);
                if (connectionRef.current) {
                    const senders = connectionRef.current.getSenders();
                    const videoSender = senders.find(s => s.track && s.track.kind === 'video');
                    if (videoSender) connectionRef.current.removeTrack(videoSender);
                }
            }
            setIsVideoEnabled(false);
        } else {
            try {
                const videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                const newVideoTrack = videoStream.getVideoTracks()[0];
                stream.addTrack(newVideoTrack);
                setVideoTrack(newVideoTrack);
                if (connectionRef.current) {
                    const senders = connectionRef.current.getSenders();
                    const videoSender = senders.find(s => s.track && s.track.kind === 'video');
                    if (videoSender) await videoSender.replaceTrack(newVideoTrack);
                    else connectionRef.current.addTrack(newVideoTrack, stream);
                }
                setIsVideoEnabled(true);
            } catch (error) { console.error("Error accessing camera:", error); }
        }
    };

    const shareScreen = async () => {
        try {
            if (videoTrack && isVideoEnabled) {
                videoTrack.stop();
                setVideoTrack(null);
                setIsVideoEnabled(false);
            }
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ cursor: true });
            const screenTrack = screenStream.getVideoTracks()[0];
            if (connectionRef.current) {
                const senders = connectionRef.current.getSenders();
                const sender = senders.find(s => s.track && s.track.kind === 'video');
                if (sender) await sender.replaceTrack(screenTrack);
            }
            if (myVideo.current) myVideo.current.srcObject = screenStream;
            screenTrack.onended = async () => {
                if (stream) {
                    try {
                        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                        const newVideoTrack = videoStream.getVideoTracks()[0];
                        stream.addTrack(newVideoTrack);
                        setVideoTrack(newVideoTrack);
                        setIsVideoEnabled(true);
                        if (connectionRef.current) {
                            const senders = connectionRef.current.getSenders();
                            const sender = senders.find(s => s.track && s.track.kind === 'video');
                            if (sender) await sender.replaceTrack(newVideoTrack);
                        }
                        if (myVideo.current) myVideo.current.srcObject = stream;
                    } catch (e) { }
                }
            };
            return true;
        } catch (e) { return false; }
    };

    const performLocalTypeSwitch = async (newCallType) => {
        if (!stream || !connectionRef.current) return;
        if (newCallType === 'audio') {
            if (videoTrack) {
                videoTrack.stop();
                setVideoTrack(null);
                setIsVideoEnabled(false);
                const senders = connectionRef.current.getSenders();
                const videoSender = senders.find(s => s.track && s.track.kind === 'video');
                if (videoSender) connectionRef.current.removeTrack(videoSender);
            }
        } else {
            try {
                const videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                const newVideoTrack = videoStream.getVideoTracks()[0];
                stream.addTrack(newVideoTrack);
                setVideoTrack(newVideoTrack);
                setIsVideoEnabled(true);
                const senders = connectionRef.current.getSenders();
                const videoSender = senders.find(s => s.track && s.track.kind === 'video');
                if (videoSender) await videoSender.replaceTrack(newVideoTrack);
                else connectionRef.current.addTrack(newVideoTrack, stream);
            } catch (error) { return; }
        }
        setCurrentCallType(newCallType);
        if (remoteUserId) socket.emit('call_type_switched', { to: remoteUserId, newCallType });
    };

    const switchCallType = async () => {
        const newCallType = currentCallType === 'video' ? 'audio' : 'video';
        if (newCallType === 'video') {
            if (remoteUserId) {
                setIsWaitingForSwitchResponse(true);
                socket.emit('switch_mode_request', {
                    to: remoteUserId,
                    from: user._id,
                    name: user.username,
                    newCallType: 'video'
                });
            }
        } else {
            await performLocalTypeSwitch('audio');
        }
    };

    const respondToSwitchRequest = async (accepted) => {
        if (!incomingSwitchRequest) return;
        const { from, newCallType } = incomingSwitchRequest;
        socket.emit('switch_mode_response', { to: from, accepted, newCallType });
        if (accepted) await performLocalTypeSwitch(newCallType);
        setIncomingSwitchRequest(null);
    };

    return (
        <CallContext.Provider value={{
            call,
            callState, // Export this!
            callAccepted,
            myVideo,
            userVideo,
            stream,
            name,
            setName,
            callEnded,
            callUser,
            answerCall,
            leaveCall,
            toggleVideo,
            toggleAudio,
            isVideoEnabled,
            isAudioEnabled,
            startStream,
            shareScreen,
            callHistory,
            fetchCallHistory,
            declineCall,
            switchCallType,
            currentCallType,
            incomingSwitchRequest,
            isWaitingForSwitchResponse,
            respondToSwitchRequest
        }}>
            {children}
        </CallContext.Provider>
    );
};
