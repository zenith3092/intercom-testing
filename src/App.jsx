import React, { useState, useRef, useEffect } from "react";
import { SessionType, SessionState } from "./intercom-lib/intercom-enum";
import useIntercom from "./intercom-lib/useIntercom";
import {
    checkCallerAvailability,
    forceToHangup,
} from "./intercom-plug/intercom-api";
import { Inviter, Invitation } from "sip.js";
import "./App.css";
import axios from "axios";

// 處理群播功能

const App = () => {
    const {
        sipUaRef,
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

    const [userId, setUserId] = useState("admin");
    const [username, setUsername] = useState("101000004");
    const [password, setPassword] = useState("123456");
    const [callTarget, setCallTarget] = useState("101000001");

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
                placeholder="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
            />
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
                <button
                    onClick={async () => {
                        await putConfiguration({
                            serverIp: "10.0.0.120",
                            serverWsPort: 8089,
                            serverWsEndpoint: "/ws",
                            transport: "wss",
                            autoRegister: true,
                            userId: username,
                            sipUsername: username,
                            sipPassword: password,
                            delegate: {
                                onServerConnect: () => {
                                    // 須傳送連線訊息
                                },
                                onServerDisconnect: () => {
                                    // 須傳送斷線訊息
                                },
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

            <h3>Call State: {connectionInfo.state}</h3>
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
                                    const checkRes =
                                        await checkCallerAvailability(
                                            callTarget
                                        );
                                    if (!checkRes.data.indicator) {
                                        alert(checkRes.data.message);
                                    }
                                } catch (error) {
                                    alert(error);
                                }

                                try {
                                    const hangupRes = await forceToHangup(
                                        callTarget
                                    );
                                    if (!hangupRes.data.indicator) {
                                        alert(hangupRes.data.message);
                                    }
                                } catch (err) {
                                    alert(err);
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
