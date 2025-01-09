import React, { useCallback } from "react";
import { useSipState } from "./store/sip.store";
import { useIntercomObjectsContext } from "./intercomContext";
import { UserAgentState, SessionType } from "./intercom-enum";

import { UserAgent, URI, Inviter, Invitation, Registerer } from "sip.js";

/**
 * @typedef {import("./intercomContext").OutgoingRegisterRequest} OutgoingRegisterRequest
 *
 * @typedef {import("./intercomContext").OutgoingRequestDelegate} OutgoingRequestDelegate
 *
 * @typedef {import("./intercomContext").OutgoingRequestOptions} OutgoingRequestOptions
 *
 * @typedef {import("./intercomContext").Configuration} Configuration
 *
 * @typedef {import("./store/sip.store").ConnectionInfo} ConnectionInfo
 *
 * @typedef {import("./store/sip.store").RegisterInfo} RegisterInfo
 *
 * @typedef {import("./store/sip.store").CurrentSessionInfo} CurrentSessionInfo
 *
 * @typedef {import("./store/sip.store").MediaInfo} MediaInfo
 *
 */

/**
 * @typedef {object} SessionDescriptionHandlerOptions
 * @property {object} constraints

 * @typedef {object} SessionOptions
 * @property {boolean} anonymous
 * @property {boolean} earlyMedia - If true, the first answer to the local offer is immediately utilized for media. Requires that the INVITE request MUST NOT fork. Has no effect if `inviteWithoutSdp` is true.
 * @property {Array<string>} extraHeaders - Array of extra headers added to the INVITE.
 * @property {boolean} inviteWithoutSdp - If true, send INVITE without SDP. Default is false.
 * @property {Array<((sessionDescription: RTCSessionDescriptionInit) => Promise<RTCSessionDescriptionInit>)>} sessionDescriptionHandlerModifiers - Modifiers to pass to SessionDescriptionHandler during the initial INVITE transaction.
 * @property {SessionDescriptionHandlerOptions} sessionDescriptionHandlerOptions - Options to pass to SessionDescriptionHandler during the initial INVITE transaction.
 * @property {Array<((sessionDescription: RTCSessionDescriptionInit) => Promise<RTCSessionDescriptionInit>)>} sessionDescriptionHandlerModifiersReInvite - Modifiers to pass to SessionDescriptionHandler during re-INVITE transactions.
 * @property {SessionDescriptionHandlerOptions} sessionDescriptionHandlerOptionsReInvite - Options to pass to SessionDescriptionHandler during re-INVITE transactions.
 */

/**
 * @typedef {object} InviterInviteOptions
 * @property {OutgoingRequestDelegate} requestDelegate
 * @property {OutgoingRequestOptions} requestOptions
 * @property {Array<((sessionDescription: RTCSessionDescriptionInit) => Promise<RTCSessionDescriptionInit>)>} sessionDescriptionHandlerModifiers - Modifiers to pass to SessionDescriptionHandler during the initial INVITE transaction.
 * @property {SessionDescriptionHandlerOptions} sessionDescriptionHandlerOptions - Options to pass to SessionDescriptionHandler during the initial INVITE transaction.
 * @property {boolean} withoutSdp - If true, send INVITE without SDP. Default is false.
 */

/**
 * @typedef {object} InvitationAcceptOptions
 * @property {Array<string>} extraHeaders
 * @property {Array<((sessionDescription: RTCSessionDescriptionInit) => Promise<RTCSessionDescriptionInit>)>} sessionDescriptionHandlerModifiers
 * @property {SessionDescriptionHandlerOptions} sessionDescriptionHandlerOptions
 */

/**
 * @typedef {object} UseIntercom
 * @property {ConnectionInfo} connectionInfo
 * @property {RegisterInfo} registerInfo
 * @property {CurrentSessionInfo} currentSessionInfo
 * @property {MediaInfo} mediaInfo
 * @property {React.MutableRefObject<UserAgent>} sipUaRef
 * @property {React.MutableRefObject<Inviter | Invitation>} sessionRef
 * @property {React.MutableRefObject<Registerer>} registererRef
 * @property {React.MutableRefObject<RequestRef>} requestRef
 * @property {React.MutableRefObject<HTMLVideoElement>} localVideoRef
 * @property {React.MutableRefObject<HTMLVideoElement>} remoteVideoRef
 * @property {(username: string) => URI} generateURI
 * @property {(configuration: Configuration) => void} putConfiguration
 * @property {(ignore: boolean) => Promise<void>} handleConnect
 * @property {(ignore: boolean) => Promise<void>} handleDisconnect
 * @property {(attempt?: number) => void} handleAttemptReconnection
 * @property {() => Promise<OutgoingRegisterRequest>} handleRegister
 * @property {() => Promise<OutgoingRegisterRequest>} handleUnregister
 * @property {(destination: string, inviterOptions: SessionOptions, inviterInviteOptions: InviterInviteOptions) => Promise<void>} handleCall
 * @property {(invitationAcceptOptions: InvitationAcceptOptions) => Promise<void>} handleAnswer
 * @property {() => Promise<void>} handleHangup
 * @property {(enable: boolean) => void} handleEnableAudio
 */
const useIntercom = () => {
    const {
        registerInfo,
        connectionInfo,
        currentSessionInfo,
        mediaInfo,
        setMediaInfo,
    } = useSipState();

    const {
        sipUaRef,
        sessionRef,
        requestRef,
        registererRef,
        localVideoRef,
        remoteVideoRef,
        handleRegister,
        handleUnregister,
        handleAttemptReconnection,
        handleHangup,
        initSession,
        putConfiguration,
    } = useIntercomObjectsContext();

    // Tools

    /**
     * Generate the URI
     *
     * @param {string} username
     * @returns {URI}
     */
    function generateURI(username) {
        return UserAgent.makeURI(`sip:${username}@${connectionInfo.serverIp}`);
    }

    const handleConnect = useCallback(
        /**
         * Connect to the server
         * @param {boolean} ignore
         */
        async (ignore = false) => {
            if (!sipUaRef.current) {
                if (ignore) {
                    return Promise.resolve();
                }
                return Promise.reject("UserAgent is not initialized");
            }

            requestRef.current.connection = true;

            if (sipUaRef.current.state === UserAgentState.Started) {
                return sipUaRef.current.reconnect();
            }
            return sipUaRef.current.start();
        },
        [sipUaRef, requestRef]
    );

    const handleDisconnect = useCallback(
        /**
         * Disconnect from the server
         *
         * @param {boolean} ignore
         */
        async ({ ignore = false }) => {
            if (!sipUaRef.current) {
                if (ignore) {
                    return Promise.resolve();
                }
                return Promise.reject("UserAgent is not initialized");
            }

            requestRef.current.connection = false;
            return sipUaRef.current.stop().catch((error) => {
                console.log("Failed to disconnect from the server.", error);
            });
        },
        [sipUaRef, requestRef]
    );

    const handleCall = useCallback(
        /**
         * Make a call
         * @param {string} destination
         * @param {SessionOptions} inviterOptions
         * @param {InviterInviteOptions} inviterInviteOptions
         */
        async (destination, inviterOptions = {}, inviterInviteOptions = {}) => {
            console.log(
                `[${registerInfo.userId} (${registerInfo.sipUsername})] Starting calling to ${destination}`
            );

            if (sessionRef.current) {
                return Promise.reject("Session already exists.");
            }

            const target = generateURI(destination);
            if (!target) {
                return Promise.reject(
                    `Failed to create a valid URI from "${destination}"`
                );
            }

            if (!inviterOptions.sessionDescriptionHandlerOptions) {
                inviterOptions.sessionDescriptionHandlerOptions = {};
            }

            if (!inviterOptions.sessionDescriptionHandlerOptions.constraints) {
                inviterOptions.sessionDescriptionHandlerOptions.constraints =
                    mediaInfo.constraints[SessionType.Outgoing.toLowerCase()];
            }

            const inviter = new Inviter(
                sipUaRef.current,
                target,
                inviterOptions
            );

            initSession(inviter);

            return inviter.invite(inviterInviteOptions).then(() => {
                console.log(
                    `[${registerInfo.userId} (${registerInfo.sipUsername})] sent INVITE`
                );
            });
        },
        [registerInfo, sessionRef, mediaInfo, sipUaRef]
    );

    const handleAnswer = useCallback(
        /**
         * Answer a call
         *
         * @param {InvitationAcceptOptions} invitationAcceptOptions
         */
        async (invitationAcceptOptions = {}) => {
            console.log(
                `[${registerInfo.userId} (${registerInfo.sipUsername})] Accepting Invitation...`
            );

            if (!sessionRef.current) {
                return Promise.reject("Session does not exist.");
            }

            if (!(sessionRef.current instanceof Invitation)) {
                return Promise.reject("Session not instance of Invitation.");
            }

            if (!invitationAcceptOptions.sessionDescriptionHandlerOptions) {
                invitationAcceptOptions.sessionDescriptionHandlerOptions = {};
            }

            if (
                !invitationAcceptOptions.sessionDescriptionHandlerOptions
                    .constraints
            ) {
                invitationAcceptOptions.sessionDescriptionHandlerOptions.constraints =
                    mediaInfo.constraints[SessionType.Incoming.toLowerCase()];
            }

            return sessionRef.current.accept(invitationAcceptOptions);
        },
        [registerInfo, sessionRef, mediaInfo]
    );

    const handleEnableAudio = useCallback(
        (enable) => {
            if (!sessionRef.current) {
                throw new Error("Session does not exist.");
            }

            /**
             * @type {RTCPeerConnection}
             */
            const pc =
                sessionRef.current.sessionDescriptionHandler._peerConnection;

            pc.getSenders().forEach((sender) => {
                if (sender.track) {
                    sender.track.enabled = enable;
                }
            });

            setMediaInfo((prev) => {
                return {
                    ...prev,
                    enableAudio: enable,
                };
            });
        },
        [sessionRef]
    );

    return {
        connectionInfo,
        registerInfo,
        currentSessionInfo,
        mediaInfo,
        sipUaRef,
        sessionRef,
        requestRef,
        registererRef,
        localVideoRef,
        remoteVideoRef,
        generateURI,
        putConfiguration,
        handleConnect,
        handleDisconnect,
        handleAttemptReconnection,
        handleRegister,
        handleUnregister,
        handleCall,
        handleAnswer,
        handleHangup,
        handleEnableAudio,
    };
};

export default useIntercom;
