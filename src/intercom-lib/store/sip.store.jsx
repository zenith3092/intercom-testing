import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import {
    SessionType,
    ConnectionState,
    RegistererState,
    SessionState,
} from "../intercom-enum";

const useSipStore = create((set) => ({
    connectionInfo: {
        serverIp: "",
        serverWsPort: 0,
        serverWsEndpoint: "",
        transport: "",
        logLevel: "error",
        reconnectionAttempts: Infinity,
        reconnectionDelay: 3,
        state: ConnectionState.Disconnected,
    },
    setConnectionInfo: (param) => {
        if (typeof param === "function") {
            set((state) => {
                const connectionInfo = param(state.connectionInfo);
                return { connectionInfo };
            });
        } else {
            set({ connectionInfo: param });
        }
    },
    registerInfo: {
        autoRegister: false,
        userId: "",
        sipUsername: "",
        sipPassword: "",
        state: RegistererState.Unregistered,
    },
    setRegisterInfo: (param) => {
        if (typeof param === "function") {
            set((state) => {
                const registerInfo = param(state.registerInfo);
                return { registerInfo };
            });
        } else {
            set({ registerInfo: param });
        }
    },
    currentSessionInfo: {
        state: SessionState.Idle,
        type: SessionType.None,
        from: "",
        to: "",
    },
    setCurrentSessionInfo: (param) => {
        if (typeof param === "function") {
            set((state) => {
                const currentSessionInfo = param(state.currentSessionInfo);
                return { currentSessionInfo };
            });
        } else {
            set({ currentSessionInfo: param });
        }
    },
    mediaInfo: {
        constraints: {
            [SessionType.Incoming.toLowerCase()]: {
                audio: true,
                video: false,
            },
            [SessionType.Outgoing.toLowerCase()]: {
                audio: true,
                video: false,
            },
        },
        enableAudio: false,
        enableVideo: false,
    },
    setMediaInfo: (param) => {
        if (typeof param === "function") {
            set((state) => {
                const mediaInfo = param(state.mediaInfo);
                return { mediaInfo };
            });
        } else {
            set({ mediaInfo: param });
        }
    },
    delegate: {
        onServerConnect: () => {},
        onServerDisconnect: () => {},
        onRegister: () => {},
        onUnregister: () => {},
        onCallCreated: () => {},
        onCallConnected: () => {},
        onCallTerminated: () => {},
    },
    setDelegate: (param) => {
        if (typeof param === "function") {
            set((state) => {
                const delegate = param(state.delegate);
                return { delegate };
            });
        } else {
            set({ delegate: param });
        }
    },
}));

/**
 * @typedef {object} ConnectionInfo
 * @property {string} serverIp
 * @property {number} serverWsPort
 * @property {string} serverWsEndpoint
 * @property {string} transport
 * @property {'debug' | 'info' | 'warn' | 'error'} logLevel
 * @property {number} reconnectionAttempts
 * @property {number} reconnectionDelay
 * @property {string} state
 */

/**
 * @typedef {object} RegisterInfo
 * @property {boolean} autoRegister
 * @property {string} userId
 * @property {string} sipUsername
 * @property {string} sipPassword
 * @property {string} state
 */

/**
 * @typedef {object} CurrentSessionInfo
 * @property {string} state
 * @property {string} type
 * @property {string} from
 * @property {string} to
 */

/**
 * @typedef {object} MediaConstraints
 * @property {object} constraints.incoming
 * @property {boolean} constraints.incoming.audio
 * @property {boolean} constraints.incoming.video
 * @property {object} constraints.outgoing
 * @property {boolean} constraints.outgoing.audio
 * @property {boolean} constraints.outgoing.video
 *
 * @typedef {object} MediaInfo
 * @property {MediaConstraints} constraints
 * @property {boolean} enableAudio
 * @property {boolean} enableVideo
 */

/**
 * @typedef {object} SipDelegate
 * @property {() => void} onServerConnect
 * @property {() => void} onServerDisconnect
 * @property {() => void} onRegistered
 * @property {() => void} onUnregistered
 * @property {() => void} onCallCreated - execute when a session starts
 * @property {() => void} onCallConnected - execute when a session establishes
 * @property {() => void} onCallTerminated - execute when a session ends up
 */

/**
 * @typedef {object} SipState
 * @property {RegisterInfo} registerInfo
 * @property {(param: (prev: RegisterInfo) => RegisterInfo | RegisterInfo) => void} setRegisterInfo
 * @property {ConnectionInfo} connectionInfo
 * @property {(param: (prev: ConnectionInfo) => ConnectionInfo | ConnectionInfo) => void} setConnectionInfo
 * @property {CurrentSessionInfo} currentSessionInfo
 * @property {(param: (prev: CurrentSessionInfo) => CurrentSessionInfo | CurrentSessionInfo) => void} setCurrentSessionInfo
 * @property {MediaInfo} mediaInfo
 * @property {(param: (prev: MediaInfo) => MediaInfo | MediaInfo) => void} setMediaInfo
 * @property {SipDelegate} delegate
 * @property {(param: (prev: SipDelegate) => SipDelegate | SipDelegate) => void} setDelegate
 */

/**
 * Intercom store
 * @return {SipState}
 */
const useSipState = () => {
    return useSipStore(useShallow((state) => state));
};

export { useSipState };

export default useSipStore;
