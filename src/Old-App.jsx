import { useState, useRef, useEffect } from "react";
import {
    UserAgent,
    Registerer,
    Inviter,
    Invitation,
    SessionState,
    UserAgentState,
    RegistererState,
    Messager,
} from "sip.js";

import "./App.css";

import { useSipState } from "./intercom/store/sip.store";

function App() {
    const [username, setUsername] = useState("101000004");
    const [password, setPassword] = useState("123456");
    const [callTarget, setCallTarget] = useState("101000001");
    const [sessionState, setSessionState] = useState(SessionState.Terminated);
    const [sessionType, setSessionType] = useState(""); // INCOMING or OUTGOING
    const [connectionState, setConnectionState] = useState("DISCONNECTED"); // CONNECTED, DISCONNECTED
    const [registerState, setRegisterState] = useState(
        RegistererState.Unregistered
    ); // REGISTERED, UNREGISTERED
    const [callingPerson, setCallingPerson] = useState("");
    const [muted, setMuted] = useState(false);

    const uaRef = useRef(null);
    /**
     * @type {React.MutableRefObject<Inviter | Invitation>}
     */

    const currentSessionRef = useRef(null);
    const callingSessionRef = useRef({});
    const registererRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const localVideoRef = useRef(null);

    const sipServerHost = "10.0.0.120";
    const sipServerPort = "8089";

    const constraints = {
        audio: true,
        video: true,
    };

    function sessionListenerCallback(state) {
        switch (state) {
            case SessionState.Initial:
                setSessionState(SessionState.Initial);
                break;
            case SessionState.Establishing:
                setSessionState(SessionState.Establishing);
                break;
            case SessionState.Established:
                setSessionState(SessionState.Established);

                setupLocalMedia();
                setupRemoteMedia();
                break;
            case SessionState.Terminating:
                setSessionState(SessionState.Terminating);
                break;
            case SessionState.Terminated:
                setSessionState(SessionState.Terminated);
                setSessionType("");
                setCallingPerson("");
                cleanupMedia();
                currentSessionRef.current = null;
                break;
            default:
                throw new Error("Unknown session state");
        }
    }

    function initSession(session) {
        let _type = "";
        if (session instanceof Inviter) {
            setSessionType("OUTGOING");
            setCallingPerson(session.request.to.uri.normal.user);
            console.log(session.remoteIdentity.uri.user);
            console.log(session.localIdentity.uri.user);
        } else {
            setSessionType("INCOMING");
            setCallingPerson(session.request.from.uri.normal.user);
        }

        session.stateChange.addListener((state) =>
            sessionListenerCallback(state)
        );

        currentSessionRef.current = session;
    }

    function setupLocalMedia() {
        if (!currentSessionRef.current) {
            throw new Error("Session does not exist.");
        }

        const mediaElement = localVideoRef.current;
        if (mediaElement) {
            const sdh = currentSessionRef.current.sessionDescriptionHandler;
            if (!sdh) {
                return;
            }

            const localMediaStream = sdh.localMediaStream;

            if (!localMediaStream) {
                return;
            }

            mediaElement.srcObject = localMediaStream;
            mediaElement.volume = 0;
            mediaElement.play().catch((error) => {
                console.error(error);
            });
        }
    }

    function setupRemoteMedia() {
        if (!currentSessionRef.current) {
            throw new Error("Session does not exist.");
        }

        const mediaElement = remoteVideoRef.current;

        if (mediaElement) {
            const sdh = currentSessionRef.current.sessionDescriptionHandler;
            if (!sdh) {
                return;
            }
            const remoteMediaStream = sdh.remoteMediaStream;
            if (!remoteMediaStream) {
                return;
            }
            mediaElement.autoplay = true;
            mediaElement.srcObject = remoteMediaStream;
            mediaElement.volume = 1;
            mediaElement.play().catch((error) => {
                console.error(error);
            });
            mediaElement.onaddtrack = () => {
                mediaElement.load();
                console.log("onaddtrack");
                mediaElement.play().catch((error) => {
                    console.error(error);
                });
            };
        }
    }

    function cleanupMedia() {
        const sdh = currentSessionRef.current.sessionDescriptionHandler;
        const localMediaStream = sdh.localMediaStream;

        if (localMediaStream) {
            localMediaStream.getTracks().forEach((track) => {
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
    }

    async function handleConnect() {
        const uri = UserAgent.makeURI(`sip:${username}@${sipServerHost}`);
        const newUa = new UserAgent({
            authorizationUsername: username,
            authorizationPassword: password,
            transportOptions: {
                server: `wss://${sipServerHost}:${sipServerPort}/ws`,
            },
            uri,
            logLevel: "error",
            contactParams: {
                transport: "wss",
            },
            hackWssInTransport: true,
        });

        console.log(newUa.id);

        newUa.delegate = {
            onInvite: (invitation) => {
                invitation.delegate = {};
                initSession(invitation);
            },
            onConnect: () => {
                setConnectionState("CONNECTED");
                handleRegister()
                    .then(() => {
                        console.log("Register success");
                    })
                    .catch((error) => {
                        console.log(error);
                    });
            },
            onDisconnect: () => {
                setConnectionState("DISCONNECTED");
                if (
                    registererRef.current &&
                    registererRef.current.state === RegistererState.Registered
                ) {
                    registererRef.current.unregister().catch((error) => {
                        console.log(error);
                    });
                }
            },
        };

        uaRef.current = newUa;

        return uaRef.current.start();
    }

    async function handleDisconnect() {
        return uaRef.current.stop().then((r) => {
            uaRef.current = null;
            return r;
        });
    }

    async function handleRegister() {
        if (!uaRef.current) {
            throw new Error("User agent does not exist.");
        }
        const registerer = new Registerer(uaRef.current);

        registerer.stateChange.addListener((state) => {
            switch (state) {
                case RegistererState.Initial:
                    setRegisterState(RegistererState.Initial);
                    break;
                case RegistererState.Registered:
                    setRegisterState(RegistererState.Registered);
                    break;
                case RegistererState.Unregistered:
                    setRegisterState(RegistererState.Unregistered);
                    break;
                case RegistererState.Terminated:
                    setRegisterState(RegistererState.Terminated);
                    break;
                default:
                    break;
            }
        });

        registererRef.current = registerer;

        return registerer.register();
    }

    function handleCall() {
        const targetUri = UserAgent.makeURI(
            `sip:${callTarget}@${sipServerHost}`
        );

        const inviter = new Inviter(uaRef.current, targetUri);

        initSession(inviter);

        return currentSessionRef.current.invite({
            sessionDescriptionHandlerOptions: {
                constraints,
            },
        });
    }

    function handleAnswer() {
        currentSessionRef.current.accept({
            sessionDescriptionHandlerOptions: {
                constraints,
            },
        });
    }

    function handleReject() {
        currentSessionRef.current.reject();
    }

    function handleHangup() {
        switch (currentSessionRef.current.state) {
            case SessionState.Initial:
            case SessionState.Establishing:
                setMuted(false);
                if (currentSessionRef.current instanceof Inviter) {
                    currentSessionRef.current.cancel();
                } else {
                    currentSessionRef.current.reject();
                }
                break;
            case SessionState.Established:
                currentSessionRef.current.bye();
                break;
            default:
                break;
        }
    }

    function handleMute() {
        const pc =
            currentSessionRef.current.sessionDescriptionHandler._peerConnection;
        pc.getSenders().forEach((sender) => {
            if (sender.track) {
                sender.track.enabled = !sender.track.enabled;
            }
        });
        setMuted(!muted);
    }

    function handleUnmute() {
        const pc =
            currentSessionRef.current.sessionDescriptionHandler._peerConnection;
        pc.getSenders().forEach((sender) => {
            if (sender.track) {
                sender.track.enabled = true;
            }
        });
        setMuted(false);
    }

    useEffect(() => {
        if (sessionState === SessionState.Established) {
        }
    }, [sessionState]);

    return (
        <div className="app-div">
            <input
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
            <input
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <div className="connect">
                <button onClick={handleConnect}>Connect</button>
                <button onClick={handleDisconnect}>Disconnect</button>
            </div>
            <br />

            <h3>Call State: {connectionState}</h3>
            <h3>Register State: {registerState}</h3>
            <h3>Session State: {sessionState}</h3>
            <h3>Communicate With: {callingPerson}</h3>
            <br />

            <input
                placeholder="call target"
                value={callTarget}
                onChange={(e) => setCallTarget(e.target.value)}
            />
            <div className="action">
                {sessionType === "" &&
                    sessionState === SessionState.Terminated && (
                        <button onClick={handleCall}>Call</button>
                    )}
                {([
                    SessionState.Establishing,
                    SessionState.Established,
                ].includes(sessionState) ||
                    (sessionState === SessionState.Initial &&
                        sessionType === "OUTGOING")) && (
                    <>
                        {muted ? (
                            <button onClick={handleUnmute}>Unmute</button>
                        ) : (
                            <button onClick={handleMute}>Mute</button>
                        )}
                        <button onClick={handleHangup}>Hangup</button>
                    </>
                )}
                {sessionType === "INCOMING" &&
                    sessionState === SessionState.Terminated && (
                        <>
                            <button onClick={handleAnswer}>Answer</button>
                            <button onClick={handleReject}>Reject</button>
                        </>
                    )}
            </div>

            <div>
                <h3>Local Audio</h3>
                <video ref={localVideoRef}></video>
            </div>
            <div>
                <h3>Remote Audio</h3>
                <video ref={remoteVideoRef}></video>
            </div>
        </div>
    );
}

export default App;
