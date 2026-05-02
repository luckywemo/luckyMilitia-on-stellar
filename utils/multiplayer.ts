// Helper to dispatch logs to DebugConsole
export const mpLog = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    console.log(`[MP] ${message}`); // Keep console log for devtools
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('MULTIPLAYER_LOG', {
            detail: { message, type }
        }));
    }
};

/**
 * Standardized PeerJS Configuration for Lucky Militia
 * Optimized for cross-device support (Cloud Signaling + Robust ICE)
 */

// Determine if we are running locally
const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const iceConfig = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
    ],
    iceTransportPolicy: 'all' as RTCIceTransportPolicy,
    iceCandidatePoolSize: 10,
};

export const PEER_CONFIG = isLocalhost ? {
    host: window.location.hostname,
    port: 9000,
    path: '/peerjs',
    secure: false,
    debug: 2,
    config: iceConfig
} : {
    host: '0.peerjs.com',
    port: 443,
    path: '/',
    secure: true,
    debug: 2,
    config: iceConfig
};

/**
 * Generates a sanitized room code for PeerJS IDs
 */
export const getPeerId = (type: 'SCTR' | 'GAME', roomCode: string) => {
    return `LM-${type}-${roomCode}`;
};

/**
 * Common status messages for ICE states
 */
export const getStatusFromIceState = (state: RTCIceConnectionState): string => {
    switch (state) {
        case 'checking': return 'ESTABLISHING_UPLINK...';
        case 'connected':
        case 'completed': return 'SIGNAL_ACQUIRED';
        case 'failed': return 'LINK_FAILED (NAT_BLOCK)';
        case 'disconnected': return 'SIGNAL_LOST';
        case 'closed': return 'UPLINK_CLOSED';
        default: return state.toUpperCase();
    }
};
