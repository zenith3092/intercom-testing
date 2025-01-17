import React, {
    createContext,
    useContext,
    useRef,
    useEffect,
    useCallback,
} from "react";
import { UserAgent, Registerer, Inviter, Invitation, Session } from "sip.js";
import {
    SessionType,
    ConnectionState,
    RegistererState,
    SessionState,
} from "./intercom-enum";

import { useSipState } from "./store/sip.store";
import { SessionDescriptionHandler } from "sip.js/lib/platform/web";

/**
 * @typedef {import("./store/sip.store").SipDelegate} SipDelegate
 * @typedef {import("./store/sip.store").MediaConstraints} MediaConstraints
 */

/**
 * @typedef {object} Configuration
 * @property {string} configuration.serverIp
 * @property {number} configuration.serverWsPort
 * @property {string} configuration.serverWsEndpoint
 * @property {string} configuration.transport
 * @property {string} configuration.reconnectionAttempts
 * @property {string} configuration.reconnectionDelay
 * @property {boolean} configuration.autoRegister
 * @property {string} configuration.userId
 * @property {string} configuration.sipUsername
 * @property {string} configuration.sipPassword
 * @property {'debug' | 'info' | 'warn' | 'error'} configuration.logLevel
 * @property {MediaConstraints} configuration.constraints
 * @property {SipDelegate} configuration.delegate
 */

/**
 * @typedef {object} OutgoingRequestDelegate
 * @property {(response) => void} onAccept
 * @property {(response) => void} onProgress
 * @property {(response) => void} onRedirect
 * @property {(response) => void} onReject
 * @property {(response) => void} onTrying
 *
 * @typedef {object} OutgoingRequestOptions
 * @property {Array<string>} extraHeaders
 * @property {object} body
 * @property {string} body.contentDisposition
 * @property {string} body.contentType
 * @property {string} body.content
 *
 * @typedef {object} OutgoingRegisterRequest
 * @property {OutgoingRequestDelegate} delegate
 * @property {() => void} dispose
 * @property {(reason: string, options: OutgoingRequestOptions) => void} cancel
 */

/**
 * @typedef {object} RequestRef
 * @property {boolean} connection
 * @property {boolean} register
 * @property {boolean} attemptingReconnection
 */

/**
 * @typedef {object} IntercomObjects
 * @property {React.MutableRefObject<UserAgent>} sipUaRef
 * @property {React.MutableRefObject<Inviter|Invitation>} sessionRef
 * @property {React.MutableRefObject<Registerer>} registererRef
 * @property {React.MutableRefObject<RequestRef>} requestRef
 * @property {React.MutableRefObject<HTMLVideoElement>} localVideoRef
 * @property {React.MutableRefObject<HTMLVideoElement>} remoteVideoRef
 * @property {(session: Session) => void} initSession
 * @property {(configuration: Configuration) => Promise<void>} putConfiguration
 * @property {(attempt?: number) => void} handleAttemptReconnection
 * @property {() => Promise<OutgoingRegisterRequest>} handleRegister
 * @property {() => Promise<OutgoingRegisterRequest>} handleUnregister
 * @property {() => Promise<void>} handleHangup
 */

function useIntercomObjects() {
    const {
        registerInfo,
        setRegisterInfo,
        setCurrentSessionInfo,
        connectionInfo,
        setConnectionInfo,
        setMediaInfo,
        delegate,
        setDelegate,
    } = useSipState();

    /**
     * @type {React.MutableRefObject<UserAgent>}
     */
    const sipUaRef = useRef(null);

    /**
     * @type {React.MutableRefObject<Inviter|Invitation>}
     */
    const sessionRef = useRef(null);

    /**
     * @type {React.MutableRefObject<RequestRef>}
     */
    const requestRef = useRef({
        connection: false,
        register: false,
        attemptingReconnection: false,
    });

    /**
     * @type {React.MutableRefObject<Registerer>}
     */
    const registererRef = useRef(null);

    /**
     * @type {React.MutableRefObject<HTMLVideoElement>}
     */
    const localVideoRef = useRef(null);

    /**
     * @type {React.MutableRefObject<HTMLVideoElement>}
     */
    const remoteVideoRef = useRef(null);

    const configurationRef = useRef(null);

    // Tools

    const generateURI = useCallback(
        (username = "") => {
            return UserAgent.makeURI(
                `sip:${username || registerInfo.sipUsername}@${
                    connectionInfo.serverIp
                }`
            );
        },
        [registerInfo, connectionInfo]
    );

    // Setters

    /**
     * Put the configuration into the store
     * @param {Configuration} configuration
     */
    async function putConfiguration(configuration = {}) {
        return new Promise((resolve) => {
            configurationRef.current = resolve;

            const newConnectionInfo = {};
            const newRegisterInfo = {};
            const newMediaInfo = {};
            const newDelegate = {};

            if (configuration.serverIp !== undefined) {
                newConnectionInfo.serverIp = configuration.serverIp;
            }
            if (configuration.serverWsPort !== undefined) {
                newConnectionInfo.serverWsPort = configuration.serverWsPort;
            }
            if (configuration.serverWsEndpoint !== undefined) {
                newConnectionInfo.serverWsEndpoint =
                    configuration.serverWsEndpoint;
            }
            if (configuration.transport !== undefined) {
                newConnectionInfo.transport = configuration.transport;
            }
            if (configuration.reconnectionAttempts !== undefined) {
                newConnectionInfo.reconnectionAttempts =
                    configuration.reconnectionAttempts;
            }
            if (configuration.reconnectionDelay !== undefined) {
                newConnectionInfo.reconnectionDelay =
                    configuration.reconnectionDelay;
            }
            if (configuration.logLevel !== undefined) {
                newConnectionInfo.logLevel = configuration.logLevel;
            }

            if (configuration.autoRegister !== undefined) {
                newRegisterInfo.autoRegister = configuration.autoRegister;
            }
            if (configuration.userId !== undefined) {
                newRegisterInfo.userId = configuration.userId;
            }
            if (configuration.sipUsername !== undefined) {
                newRegisterInfo.sipUsername = configuration.sipUsername;
            }
            if (configuration.sipPassword !== undefined) {
                newRegisterInfo.sipPassword = configuration.sipPassword;
            }

            if (configuration.constraints !== undefined) {
                if (configuration.constraints.incoming !== undefined) {
                    if (
                        configuration.constraints.incoming.audio !== undefined
                    ) {
                        newMediaInfo.constraints = {
                            ...newMediaInfo.constraints,
                            incoming: {
                                audio: configuration.constraints.incoming.audio,
                            },
                        };
                    }
                    if (
                        configuration.constraints.incoming.video !== undefined
                    ) {
                        newMediaInfo.constraints = {
                            ...newMediaInfo.constraints,
                            incoming: {
                                video: configuration.constraints.incoming.video,
                            },
                        };
                    }
                }

                if (configuration.constraints.outgoing !== undefined) {
                    if (
                        configuration.constraints.outgoing.audio !== undefined
                    ) {
                        newMediaInfo.constraints = {
                            ...newMediaInfo.constraints,
                            outgoing: {
                                audio: configuration.constraints.outgoing.audio,
                            },
                        };
                    }
                    if (
                        configuration.constraints.outgoing.video !== undefined
                    ) {
                        newMediaInfo.constraints = {
                            ...newMediaInfo.constraints,
                            outgoing: {
                                video: configuration.constraints.outgoing.video,
                            },
                        };
                    }
                }
            }

            if (configuration.delegate !== undefined) {
                if (configuration.delegate.onServerConnect !== undefined) {
                    newDelegate.onServerConnect =
                        configuration.delegate.onServerConnect;
                }
                if (configuration.delegate.onServerDisconnect !== undefined) {
                    newDelegate.onServerDisconnect =
                        configuration.delegate.onServerDisconnect;
                }
                if (configuration.delegate.onRegistered !== undefined) {
                    newDelegate.onRegistered =
                        configuration.delegate.onRegistered;
                }
                if (configuration.delegate.onUnregistered !== undefined) {
                    newDelegate.onUnregistered =
                        configuration.delegate.onUnregistered;
                }
                if (configuration.delegate.onCallCreated !== undefined) {
                    newDelegate.onCallCreated =
                        configuration.delegate.onCallCreated;
                }
                if (configuration.delegate.onCallTerminated !== undefined) {
                    newDelegate.onCallTerminated =
                        configuration.delegate.onCallTerminated;
                }
                if (configuration.delegate.onCallConnected !== undefined) {
                    newDelegate.onCallConnected =
                        configuration.delegate.onCallConnected;
                }
            }

            setConnectionInfo((prev) => {
                return {
                    ...prev,
                    ...newConnectionInfo,
                };
            });

            setRegisterInfo((prev) => {
                return {
                    ...prev,
                    ...newRegisterInfo,
                };
            });

            setMediaInfo((prev) => {
                return {
                    ...prev,
                    ...newMediaInfo,
                };
            });

            setDelegate((prev) => {
                return {
                    ...prev,
                    ...newDelegate,
                };
            });
        });
    }

    // Internal functions

    const initCheck = useCallback(() => {
        return (
            connectionInfo.serverIp !== "" &&
            connectionInfo.serverWsPort !== 0 &&
            connectionInfo.serverWsEndpoint !== "" &&
            connectionInfo.transport !== "" &&
            registerInfo.userId !== "" &&
            registerInfo.sipUsername !== "" &&
            registerInfo.sipPassword !== ""
        );
    }, [connectionInfo, registerInfo]);

    const initSession = useCallback(
        /**
         * @param {Session} session
         */
        (session) => {
            sessionRef.current = session;

            if (delegate && delegate.onCallCreated) {
                delegate.onCallCreated();
            }

            let stateType = SessionType.None;
            let currentSessionState = SessionState.Idle;
            let fromTarget = "";
            let toTarget = "";

            if (session instanceof Inviter) {
                stateType = SessionType.Outgoing;
                fromTarget = session.request.from.uri.user;
                toTarget = session.request.to.uri.user;
            } else if (session instanceof Invitation) {
                stateType = SessionType.Incoming;
                fromTarget = session.request.from.uri.user;
                toTarget = session.request.to.uri.user;
            } else {
                return;
            }

            setCurrentSessionInfo((prev) => {
                return {
                    ...prev,
                    state: currentSessionState,
                    type: stateType,
                    from: fromTarget,
                    to: toTarget,
                };
            });

            sessionRef.current.stateChange.addListener((state) => {
                if (session !== sessionRef.current) {
                    return;
                }

                console.log(
                    `[${registerInfo.userId} (${registerInfo.sipUsername})] Session state changed to ${state}`
                );

                switch (state) {
                    case SessionState.Initial:
                        console.log("SessionState.Initial");
                        setCurrentSessionInfo((prev) => {
                            return {
                                ...prev,
                                state: SessionState.Initial,
                            };
                        });
                        break;
                    case SessionState.Establishing:
                        console.log("SessionState.Establishing");
                        setCurrentSessionInfo((prev) => {
                            return {
                                ...prev,
                                state: SessionState.Establishing,
                            };
                        });
                        break;
                    case SessionState.Established:
                        setCurrentSessionInfo((prev) => {
                            return {
                                ...prev,
                                state: SessionState.Established,
                            };
                        });
                        if (session instanceof Invitation) {
                        }
                        setupLocalMedia();
                        setupRemoteMedia();
                        if (delegate && delegate.onCallConnected) {
                            delegate.onCallConnected();
                        }
                        break;
                    case SessionState.Terminating:
                        setCurrentSessionInfo((prev) => {
                            return {
                                ...prev,
                                state: SessionState.Terminating,
                            };
                        });
                        break;
                    case SessionState.Terminated:
                        setCurrentSessionInfo((prev) => {
                            return {
                                ...prev,
                                type: SessionType.None,
                                state: SessionState.Terminated,
                                from: "",
                                to: "",
                            };
                        });
                        cleanupMedia();
                        currentSessionState = SessionState.Terminated;
                        sessionRef.current = null;

                        if (delegate && delegate.onCallTerminated) {
                            delegate.onCallTerminated();
                        }

                        setTimeout(() => {
                            setCurrentSessionInfo((prev) => {
                                return {
                                    ...prev,
                                    state: SessionState.Idle,
                                };
                            });
                        });
                        break;
                    default:
                        throw new Error("Unknown session state.");
                }
            });
        },
        [delegate, registerInfo, setCurrentSessionInfo]
    );

    const sameCheck = useCallback(() => {
        if (!sipUaRef.current) {
            return false;
        }

        return (
            sipUaRef.current.configuration.authorizationUsername ===
                registerInfo.sipUsername &&
            sipUaRef.current.configuration.authorizationPassword ===
                registerInfo.sipPassword &&
            sipUaRef.current.configuration.transportOptions.server ===
                `${connectionInfo.transport}://${connectionInfo.serverIp}:${connectionInfo.serverWsPort}${connectionInfo.serverWsEndpoint}` &&
            sipUaRef.current.configuration.contactParams.transport ===
                connectionInfo.transport
        );
    }, [sipUaRef, registerInfo, connectionInfo]);

    const setupLocalMedia = useCallback(() => {
        if (!sessionRef.current) {
            throw new Error("Session does not exist.");
        }

        const mediaElement = localVideoRef.current;

        if (mediaElement) {
            const sdh = sessionRef.current.sessionDescriptionHandler;
            if (!sdh) {
                throw new Error("No sessionDescriptionHandler ");
            } else if (!(sdh instanceof SessionDescriptionHandler)) {
                throw new Error(
                    "Session description handler not instance of web SessionDescriptionHandler"
                );
            }

            const localStream = sdh.localMediaStream;
            if (!localStream) {
                throw new Error("Local media stream undefined.");
            }

            mediaElement.srcObject = localStream;
            mediaElement.volume = 0;
            mediaElement
                .play()
                .then(() => {
                    setMediaInfo((prev) => {
                        return {
                            ...prev,
                            enableAudio: true,
                        };
                    });
                })
                .catch((reason) => {
                    console.log(
                        `[${registerInfo.userId} (${registerInfo.sipUsername})] Failed to play local media: `,
                        reason
                    );
                });
        }
    }, [sessionRef, localVideoRef, registerInfo]);

    const setupRemoteMedia = useCallback(() => {
        if (!sessionRef.current) {
            throw new Error("Session does not exist.");
        }

        const mediaElement = remoteVideoRef.current;

        if (mediaElement) {
            const sdh = sessionRef.current.sessionDescriptionHandler;

            if (!sdh) {
                throw new Error("No sessionDescriptionHandler ");
            } else if (!(sdh instanceof SessionDescriptionHandler)) {
                throw new Error(
                    "Session description handler not instance of web SessionDescriptionHandler"
                );
            }

            const remoteStream = sdh.remoteMediaStream;
            if (!remoteStream) {
                throw new Error("Remote media stream undefined.");
            }

            mediaElement.srcObject = remoteStream;
            mediaElement.volume = 1;
            mediaElement.play().catch((reason) => {
                console.log(
                    `[${registerInfo.userId} (${registerInfo.sipUsername})] Failed to play remote media: `,
                    reason
                );
            });
            mediaElement.onaddtrack = () => {
                mediaElement.load();
                mediaElement
                    .play()
                    .then(() => {
                        setMediaInfo((prev) => {
                            return {
                                ...prev,
                                enableAudio: true,
                            };
                        });
                    })
                    .catch((reason) => {
                        console.log(
                            `[${registerInfo.userId} (${registerInfo.sipUsername})] Failed to play remote media: `,
                            reason
                        );
                    });
            };
        }
    }, [sessionRef, remoteVideoRef, registerInfo]);

    const cleanupMedia = useCallback(() => {
        const sdh = sessionRef.current.sessionDescriptionHandler;

        if (!sdh) {
            return;
        } else if (!(sdh instanceof SessionDescriptionHandler)) {
            return;
        }

        const localMedia = sdh.localMediaStream;
        if (localMedia) {
            localMedia.getTracks().forEach((track) => {
                track.stop();
            });
        }

        if (localVideoRef.current) {
            localVideoRef.current.pause();
            localVideoRef.current.srcObject = null;
        }

        if (remoteVideoRef.current) {
            remoteVideoRef.current.pause();
            remoteVideoRef.current.srcObject = null;
        }

        setMediaInfo((prev) => {
            return {
                ...prev,
                enableAudio: false,
            };
        });
    }, [sessionRef, localVideoRef, remoteVideoRef]);

    // Handlers

    const handleAttemptReconnection = useCallback(
        (attempt = 1) => {
            const { reconnectionAttempts, reconnectionDelay } = connectionInfo;

            if (!requestRef.current.connection) {
                console.log(
                    `[${registerInfo.userId} (${registerInfo.sipUsername})] Reconnection not currently desired`
                );
                return;
            }

            if (requestRef.current.attemptingReconnection) {
                console.log(
                    `[${registerInfo.userId} (${registerInfo.sipUsername})] Reconnection already in progress`
                );
                return;
            }

            if (attempt > reconnectionAttempts) {
                console.log(
                    `[${registerInfo.userId} (${registerInfo.sipUsername})] Reconnection maximum attempts reached`
                );
                return;
            }

            requestRef.current.attemptingReconnection = true;

            setTimeout(
                () => {
                    if (!requestRef.current.connection) {
                        console.log(
                            `[${registerInfo.userId} (${registerInfo.sipUsername})] Reconnection attempt ${attempt} of ${reconnectionAttempts} - aborted`
                        );
                        requestRef.current.attemptingReconnection = false;
                        return;
                    }

                    sipUaRef.current
                        .reconnect()
                        .then(() => {
                            console.log(
                                `[${registerInfo.userId} (${registerInfo.sipUsername})] Reconnection attempt ${attempt} of ${reconnectionAttempts} - succeeded`
                            );
                            requestRef.current.attemptingReconnection = false;
                            setConnectionInfo((prev) => {
                                return {
                                    ...prev,
                                    state: ConnectionState.Connected,
                                };
                            });
                        })
                        .catch((error) => {
                            console.error(
                                `[${registerInfo.userId} (${registerInfo.sipUsername})] Reconnection attempt ${attempt} of ${reconnectionAttempts} - failed`,
                                error.toString()
                            );
                            requestRef.current.attemptingReconnection = false;
                            handleAttemptReconnection(++attempt);
                        });
                },
                attempt === 1 ? 0 : reconnectionDelay * 1000
            );
        },
        [connectionInfo, registerInfo, sipUaRef, requestRef]
    );

    const handleRegister = useCallback(async () => {
        console.log(
            `[${registerInfo.userId} (${registerInfo.sipUsername})] Registering...`
        );

        if (!sipUaRef.current) {
            return Promise.reject("UserAgent is not initialized");
        }

        requestRef.current.register = true;

        if (!registererRef.current) {
            const registerer = new Registerer(sipUaRef.current);

            registerer.stateChange.addListener((state) => {
                switch (state) {
                    case RegistererState.Initial:
                        setRegisterInfo((prev) => {
                            return {
                                ...prev,
                                state: RegistererState.Initial,
                            };
                        });
                        break;
                    case RegistererState.Registered:
                        setRegisterInfo((prev) => {
                            return {
                                ...prev,
                                state: RegistererState.Registered,
                            };
                        });
                        if (delegate && delegate.onRegistered) {
                            delegate.onRegistered();
                        }
                        break;
                    case RegistererState.Unregistered:
                        setRegisterInfo((prev) => {
                            return {
                                ...prev,
                                state: RegistererState.Unregistered,
                            };
                        });
                        if (delegate && delegate.onUnregistered) {
                            delegate.onUnregistered();
                        }
                        break;
                    case RegistererState.Terminated:
                        setRegisterInfo((prev) => {
                            return {
                                ...prev,
                                state: RegistererState.Terminated,
                            };
                        });
                        break;
                    default:
                        break;
                }
            });

            registererRef.current = registerer;
        }

        return registererRef.current.register();
    }, [sipUaRef, registererRef, registerInfo, setRegisterInfo]);

    const handleUnregister = useCallback(async () => {
        if (!registererRef.current) {
            return Promise.reject("Registerer is not initialized");
        }

        return registererRef.current.unregister();
    }, [registererRef]);

    const handleHangup = useCallback(async () => {
        if (!sessionRef.current) {
            return Promise.reject("Session does not exist.");
        }

        switch (sessionRef.current.state) {
            case SessionState.Initial:
                if (sessionRef.current instanceof Inviter) {
                    return sessionRef.current.cancel().then(() => {
                        console.log(
                            `[${registerInfo.userId} (${registerInfo.sipUsername})] Inviter never sent INVITE (canceled)`
                        );
                    });
                } else if (sessionRef.current instanceof Invitation) {
                    console.log("Invitation rejected1");
                    return sessionRef.current.reject().then(() => {
                        console.log(
                            `[${registerInfo.userId} (${registerInfo.sipUsername})] Invitation rejected (sent 480)`
                        );
                    });
                } else {
                    return Promise.reject("Unknown session type");
                }
            case SessionState.Establishing:
                setMediaInfo((prev) => {
                    return {
                        ...prev,
                        enableAudio: false,
                        enableVideo: false,
                    };
                });
                if (sessionRef.current instanceof Inviter) {
                    return sessionRef.current.cancel().then(() => {
                        console.log(
                            `[${registerInfo.userId} (${registerInfo.sipUsername})] Inviter canceled (sent CANCEL)`
                        );
                    });
                } else if (sessionRef.current instanceof Invitation) {
                    console.log("Invitation rejected2");
                    return sessionRef.current.reject().then(() => {
                        console.log(
                            `[${registerInfo.userId} (${registerInfo.sipUsername})] Invitation rejected (sent 480)`
                        );
                    });
                } else {
                    return Promise.reject("Unknown session type");
                }
            case SessionState.Established:
                return sessionRef.current.bye().then(() => {
                    console.log(
                        `[${registerInfo.userId} (${registerInfo.sipUsername})] Session ended (sent BYE)`
                    );
                });
            case SessionState.Terminating:
            case SessionState.Terminated:
                return Promise.resolve();
            default:
                return Promise.reject("Unknown state");
        }
    }, [sessionRef, registerInfo]);

    useEffect(() => {
        if (!initCheck()) {
            return;
        }

        if (!sameCheck()) {
            if (sipUaRef.current) {
                sipUaRef.current.stop();
                sipUaRef.current = null;
            }
        }

        if (!sipUaRef.current) {
            const userAgent = new UserAgent({
                authorizationUsername: registerInfo.sipUsername,
                authorizationPassword: registerInfo.sipPassword,
                transportOptions: {
                    server: `${connectionInfo.transport}://${connectionInfo.serverIp}:${connectionInfo.serverWsPort}${connectionInfo.serverWsEndpoint}`,
                },
                uri: generateURI(registerInfo.sipUsername),
                logLevel: connectionInfo.logLevel,
                contactParams: {
                    transport: connectionInfo.transport,
                },
            });

            sipUaRef.current = userAgent;
        }

        sipUaRef.current.delegate = {
            onConnect: () => {
                setConnectionInfo((prev) => {
                    return {
                        ...prev,
                        state: ConnectionState.Connected,
                    };
                });

                console.log(
                    `[${registerInfo.userId} (${registerInfo.sipUsername})] Connected`
                );

                if (delegate && delegate.onServerConnect) {
                    delegate.onServerConnect();
                }

                if (requestRef.current.register || registerInfo.autoRegister) {
                    function handleError(error) {
                        console.error(
                            `[${registerInfo.userId} (${registerInfo.sipUsername})] Register failed:`,
                            error.toString()
                        );
                    }

                    if (!registererRef.current) {
                        handleRegister()
                            .then(() => {
                                console.log(
                                    `[${registerInfo.userId} (${registerInfo.sipUsername})] Registered`
                                );
                            })
                            .catch(handleError);
                    } else {
                        registererRef.current.register().catch(handleError);
                    }
                }
            },
            onDisconnect: (msg) => {
                setConnectionInfo((prev) => {
                    return {
                        ...prev,
                        state: ConnectionState.Disconnected,
                    };
                });
                console.log(
                    `[${registerInfo.userId} (${registerInfo.sipUsername})] Disconnected`
                );

                if (delegate && delegate.onServerDisconnect) {
                    delegate.onServerDisconnect(msg);
                }

                if (sessionRef.current) {
                    console.log(
                        `[${registerInfo.userId} (${registerInfo.sipUsername})] Hanging up...`
                    );

                    handleHangup().catch((error) => {
                        console.error(
                            `[${registerInfo.userId} (${registerInfo.sipUsername})] Error occurred hanging up call after connection with server was lost:`,
                            error.toString()
                        );
                    });
                }

                if (registererRef.current) {
                    registererRef.current = null;
                }

                if (msg) {
                    handleAttemptReconnection();
                }
            },
            onInvite: (invitation) => {
                console.log(
                    `[${registerInfo.userId} (${registerInfo.sipUsername})] Received INVITE`
                );

                if (sessionRef.current) {
                    console.warn(
                        `[${registerInfo.userId} (${registerInfo.sipUsername})] Already in a session, rejecting INVITE...`
                    );

                    invitation
                        .reject()
                        .then(() => {
                            console.log(
                                `[${registerInfo.userId} (${registerInfo.sipUsername})] Rejected INVITE`
                            );
                        })
                        .catch((error) => {
                            console.error(
                                `[${registerInfo.userId} (${registerInfo.sipUsername})] Failed to reject INVITE: `,
                                error.toString()
                            );
                        });

                    return;
                }

                initSession(invitation);
            },
        };

        function handleOnline() {
            console.log(
                `[${registerInfo.userId} (${registerInfo.sipUsername})] Online`
            );
            handleAttemptReconnection();
        }
        function handleOffline() {
            console.log(
                `[${registerInfo.userId} (${registerInfo.sipUsername})] Offline`
            );
            setConnectionInfo((prev) => {
                return {
                    ...prev,
                    state: ConnectionState.Disconnected,
                };
            });
        }

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        if (configurationRef.current) {
            configurationRef.current();
            configurationRef.current = null;
        }

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, [connectionInfo, delegate, registerInfo, configurationRef]);

    useEffect(() => {
        async function handleBeforeUnload(e) {
            e.preventDefault();
            if (sipUaRef.current) {
                await sipUaRef.current.stop();
            }
        }

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [sipUaRef]);

    return {
        sipUaRef,
        sessionRef,
        requestRef,
        registererRef,
        localVideoRef,
        remoteVideoRef,
        initSession,
        putConfiguration,
        handleAttemptReconnection,
        handleRegister,
        handleUnregister,
        handleHangup,
    };
}

const IntercomObjectsContext = createContext();

/**
 * @returns {IntercomObjects}
 */
export function useIntercomObjectsContext() {
    return useContext(IntercomObjectsContext);
}

/**
 * @param {object} props
 * @param {React.JSX.Element} props.children
 */
export function IntercomObjectsProvider({ children }) {
    return (
        <IntercomObjectsContext.Provider value={useIntercomObjects()}>
            {children}
        </IntercomObjectsContext.Provider>
    );
}
