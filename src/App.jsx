import React, { useState, useRef, useEffect } from "react";
import {
    SessionType,
    SessionState,
    ConnectionState,
} from "./intercom-lib/intercom-enum";
import useIntercom from "./intercom-lib/useIntercom";
import {
    checkCallerAvailability,
    checkQueueAvailability,
    forceToHangup,
} from "./intercom-plug/intercom-api";
import { Inviter, Invitation } from "sip.js";
import { useErrMsg } from "./useErrMsg";
import "./App.css";

const SIP_IP = import.meta.env.VITE_SIP_IP;
const SIP_WSS_PORT = import.meta.env.VITE_SIP_WSS_PORT;
const SIP_PASSWORD = import.meta.env.VITE_SIP_PASSWORD;

const App = () => {
    const {
        localVideoRef,
        remoteVideoRef,
        sessionRef,
        connectionInfo,
        registerInfo,
        currentSessionInfo,
        mediaInfo,
        handleConnect,
        handleDisconnect,
        handleCall,
        handleAnswer,
        handleHangup,
        handleEnableAudio,
        putConfiguration,
    } = useIntercom();

    const [username, setUsername] = useState("9010");
    const [password, setPassword] = useState(SIP_PASSWORD);
    const [callTarget, setCallTarget] = useState("101000001");
    const { errMsg, putErrMsg } = useErrMsg();

    /**
     * @type {React.MutableRefObject<HTMLVideoElement>}
     */
    const incomingVideoRef = useRef(null);
    /**
     * @type {React.MutableRefObject<HTMLVideoElement>}
     */
    const outgoingVideoRef = useRef(null);

    return (
        <div className="app-div">
            <input
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
            <input
                placeholder="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <div className="connect">
                <button
                    onClick={async () => {
                        await putConfiguration({
                            serverIp: SIP_IP,
                            serverWsPort: Number(SIP_WSS_PORT),
                            serverWsEndpoint: "/ws",
                            transport: "wss",
                            autoRegister: true,
                            userId: username,
                            sipUsername: username,
                            sipPassword: password,
                            logLevel: "error",
                            delegate: {
                                onRegistered: () => {},
                                onServerConnect: () => {},
                                onServerDisconnect: () => {},
                                onCallCreated: () => {
                                    if (sessionRef.current instanceof Inviter) {
                                        outgoingVideoRef.current
                                            .play()
                                            .then(() => {})
                                            .catch((e) => {
                                                console.log(e);
                                            });
                                    } else if (
                                        sessionRef.current instanceof Invitation
                                    ) {
                                        incomingVideoRef.current
                                            .play()
                                            .then(() => {})
                                            .catch((e) => {
                                                console.log(e);
                                            });
                                    }
                                },
                                onCallConnected: () => {
                                    incomingVideoRef.current.pause();
                                    outgoingVideoRef.current.pause();
                                },
                                onCallTerminated: () => {
                                    incomingVideoRef.current.pause();
                                    outgoingVideoRef.current.pause();
                                },
                            },
                        });

                        handleConnect();
                    }}
                >
                    Connect
                </button>
                <button onClick={handleDisconnect}>Disconnect</button>
            </div>
            <br />

            {errMsg && <h2 style={{ color: "red" }}>{errMsg}</h2>}

            <h3>Connection State: {connectionInfo.state}</h3>
            <h3>Register State: {registerInfo.state}</h3>
            <h3>Session State: {currentSessionInfo.state}</h3>
            <h3>
                Communicate With:{" "}
                {currentSessionInfo.type === SessionType.Incoming
                    ? currentSessionInfo.from
                    : currentSessionInfo.to}
            </h3>
            <br />

            <input
                placeholder="call target"
                value={callTarget}
                onChange={(e) => setCallTarget(e.target.value)}
            />
            <div className="action">
                {currentSessionInfo.type === SessionType.None &&
                    [SessionState.Terminated, SessionState.Idle].includes(
                        currentSessionInfo.state
                    ) && (
                        <button
                            onClick={async () => {
                                try {
                                    const targetType = "user"; // user or intercom
                                    if (targetType === "user") {
                                        const checkRes =
                                            await checkQueueAvailability(
                                                callTarget
                                            );
                                        if (!checkRes.data.indicator) {
                                            putErrMsg(checkRes.data.message);
                                            return;
                                        }
                                    } else {
                                        const checkRes =
                                            await checkCallerAvailability(
                                                callTarget
                                            );
                                        if (!checkRes.data.indicator) {
                                            putErrMsg(checkRes.data.message);
                                            return;
                                        }
                                    }
                                } catch (error) {
                                    console.log(error);
                                    putErrMsg(error.message);
                                }

                                try {
                                    const hangupRes = await forceToHangup(
                                        callTarget
                                    );
                                    if (!hangupRes.data.indicator) {
                                        putErrMsg(hangupRes.data.message);
                                        return;
                                    }
                                } catch (err) {
                                    putErrMsg(err.message);
                                    return;
                                }

                                handleCall(callTarget);
                            }}
                        >
                            Call
                        </button>
                    )}
                {([SessionState.Established].includes(
                    currentSessionInfo.state
                ) ||
                    (currentSessionInfo.state === SessionState.Initial &&
                        currentSessionInfo.type === SessionType.Outgoing)) && (
                    <>
                        {mediaInfo.enableAudio ? (
                            <button onClick={() => handleEnableAudio(false)}>
                                Mute
                            </button>
                        ) : (
                            <button onClick={() => handleEnableAudio(true)}>
                                Unmute
                            </button>
                        )}
                    </>
                )}
                {([
                    SessionState.Establishing,
                    SessionState.Established,
                ].includes(currentSessionInfo.state) ||
                    (currentSessionInfo.state === SessionState.Initial &&
                        currentSessionInfo.type === SessionType.Outgoing)) && (
                    <>
                        <button onClick={handleHangup}>Hangup</button>
                    </>
                )}
                {currentSessionInfo.type === SessionType.Incoming &&
                    [SessionState.Terminated, SessionState.Idle].includes(
                        currentSessionInfo.state
                    ) && (
                        <>
                            <button onClick={handleAnswer}>Answer</button>
                            <button onClick={handleHangup}>Reject</button>
                        </>
                    )}
            </div>

            <div>
                <video
                    ref={localVideoRef}
                    style={{
                        width: "0.1px",
                        height: "0.1px",
                    }}
                ></video>
            </div>
            <div>
                <video
                    ref={remoteVideoRef}
                    style={{
                        width: "0.1px",
                        height: "0.1px",
                    }}
                ></video>
            </div>
            <div>
                <video
                    ref={incomingVideoRef}
                    src="./alert.mp3"
                    // autoPlay
                    playsInline
                    loop
                    style={{
                        width: "0.1px",
                        height: "0.1px",
                    }}
                />
                <video
                    ref={outgoingVideoRef}
                    src="./waiting.mp3"
                    // autoPlay
                    playsInline
                    loop
                    style={{
                        width: "0.1px",
                        height: "0.1px",
                    }}
                />
            </div>
        </div>
    );
};

export default App;
