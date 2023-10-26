import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useTagContext } from "../contexts/tagContext";
import IntercomService from "../services/intercomService";

var INCOMINGSESSION;
var OUTGOINGSESSION;
var remoteStream;
var localStream;
var enableButtons = true;

const alertVideoUrl = "/alert.mp3";
const ringbackVideoUrl = "/waiting.mp3";
const destination = "1000";

const useIntercom = () => {
  const config = useSelector((state) => state.config.data);

  const { remoteVideo, localVideo } = useTagContext();

  const [connectionState, setConnectionState] = useState("Disconnected");
  const [callState, setCallState] = useState("Idle");
  const [btnTitle, setBtnTitle] = useState(" - ");
  const [intercomError, setIntercomError] = useState("");

  const sipUa = useRef(null);

  const placeCall = (desti = null) => {
    setIntercomError("");
    setCallState("Calling");
    let inviteOptions = {};
    inviteOptions.extraHeaders = [];

    if (desti) {
      OUTGOINGSESSION = sipUa.current.invite(desti, inviteOptions);
    } else {
      console.log("default call");
      OUTGOINGSESSION = sipUa.current.invite(destination, inviteOptions);
    }

    console.log("Calling session start");
    handleCall(OUTGOINGSESSION);
  };

  const incomingCall = (session) => {
    setCallState("Alerting");
    remoteVideo.current.setAttribute("src", alertVideoUrl);
    remoteVideo.current.setAttribute("loop", true);
    remoteVideo.current.play();
    INCOMINGSESSION = session;
    handleCall(session);
  };

  const hangupCall = () => {
    console.log("hangupCall called");
    console.log(OUTGOINGSESSION);
    if (INCOMINGSESSION) {
      INCOMINGSESSION.terminate();
      INCOMINGSESSION = null;
    } else if (OUTGOINGSESSION) {
      OUTGOINGSESSION.terminate();
      OUTGOINGSESSION = null;
    } else {
      setIntercomError("Hangup Error: session variable ");
    }
  };

  const handleCall = (session) => {
    console.log("Handle Call");
    console.log(session);
    session.on("terminated", (message, cause) => {
      console.log(message);
      console.log(cause);
      localVideo.current.src = "";
      localVideo.current.srcObject = null;
      remoteVideo.current.pause();
      remoteVideo.current.src = "";
      remoteVideo.current.srcObject = null;
      remoteVideo.current.removeAttribute("src");
      remoteVideo.current.removeAttribute("loop");
      setCallState("Idle");
    });

    session.on("accepted", function () {
      console.log("In Call");
      setCallState("InCall");
      callConnected();
    });

    session.on("cancel", () => {
      setCallState("Canceling");
    });

    session.on("rejected", (response, cause) => {
      INCOMINGSESSION = null;
      OUTGOINGSESSION = null;
      console.log("rejected");
    });

    session.on("userMediaRequest", (constraints) => {
      console.log(constraints);
    });

    session.on("userMedia", (stream) => {
      console.log(stream);
    });

    session.on("failed", (request) => {
      try {
        console.log(`status code: ${request.statusCode}`);
        console.log(`reason: ${request.reasonPhrase}`);
        console.log(`data: ${request.data}`);
      } catch (error) {
        console.log(error);
        alert("Please check authentication or microphone");
      }
    });

    session.on("SessionDescriptionHandler-created", () => {
      session.sessionDescriptionHandler.on("userMediaFailed", function () {});
    });

    session.on("trackAdded", () => {
      if (session.sessionDescriptionHandler) {
        if (session.sessionDescriptionHandler.peerConnection) {
          var pc = session.sessionDescriptionHandler.peerConnection;

          try {
            const remoteAudioTracks = pc
              .getReceivers()
              .map((receiver) => receiver.track)
              .filter((track) => track.kind === "audio");
            if (remoteAudioTracks.length > 0) {
              console.log("Remote audio tracks:", remoteAudioTracks);
            } else {
              console.log("No remote audio tracks found");
            }
          } catch (e) {
            console.log(e);
          }

          try {
            const localAudioTracks = pc
              .getSenders()
              .map((sender) => sender.track)
              .filter((track) => track.kind === "audio");
            if (localAudioTracks.length > 0) {
              console.log("Local audio tracks:", localAudioTracks);
            } else {
              console.log("No local audio tracks found");
            }
          } catch (e) {
            console.log(e);
          }

          remoteStream = new MediaStream();
          pc.getReceivers().forEach((receiver) => {
            remoteStream.addTrack(receiver.track);
          });

          // Gets local tracks
          localStream = new MediaStream();
          setTimeout(() => {
            pc.getSenders().forEach((sender) => {
              if (sender.track) {
                localStream.addTrack(sender.track);
              }
            });
            localVideo.current.srcObject = localStream;
            localVideo.current.play().catch(function (error) {
              console.log(error);
            });
          }, 500);
        }
      }
    });
  };

  const answerCall = () => {
    if (INCOMINGSESSION) {
      try {
        setIntercomError("");
        INCOMINGSESSION.accept();
      } catch (e) {
        setIntercomError(`Answer Error: ${e}`);
        console.log(e);
      }
    }
  };

  const callConnected = () => {
    console.log("callConnected");

    if (remoteStream) {
      try {
        remoteVideo.current.srcObject = remoteStream;
        remoteVideo.current.play().catch(function (error) {
          console.log(error);
        });
        // eslint-disable-next-line
      } catch (e) {
        console.log(e);
      }
    }
  };

  const avoidDoubleTap = () => {
    enableButtons = false;
    setTimeout(() => {
      enableButtons = true;
    }, 1000);
  };

  const handleBtn = (desti = null) => {
    if (enableButtons) {
      if (callState === "Idle") {
        avoidDoubleTap();
        remoteVideo.current.src = ringbackVideoUrl;
        placeCall(desti);
        return true;
      } else if (callState === "Alerting") {
        avoidDoubleTap();
        answerCall();
        return true;
      } else if (["InCall", "Calling"].includes(callState)) {
        avoidDoubleTap();
        hangupCall();
        return true;
      }
    } else {
      alert("Please click more slowly.");
      return false;
    }
  };

  useEffect(() => {
    if (
      config &&
      typeof config === "object" &&
      "userName" in config &&
      "password" in config &&
      config.userName &&
      config.password
    ) {
      const userAgent = new IntercomService(
        config.serverIp,
        config.serverPort,
        config.userName,
        config.password
      );

      userAgent.connectionErrorHandler = () => {
        setIntercomError("Network Connection Error");
      };

      userAgent.connectingHandler = () => {
        setConnectionState("Connecting...");
      };

      userAgent.connectedHandler = () => {
        setConnectionState("Connected");
        setIntercomError("");
      };

      userAgent.disConnectingHandler = () => {
        setConnectionState("Disconnecting...");
      };

      userAgent.disConnectedHandler = () => {
        setConnectionState("Disconnected");
      };

      userAgent.inviteHandler = (session) => {
        incomingCall(session);
      };

      userAgent.start();

      sipUa.current = userAgent.userAgent;
    } else if (sipUa.current) {
      sipUa.current.stop();
    }
  }, [config]);

  useEffect(() => {
    if (callState === "Idle") {
      setBtnTitle("Call");
    } else if (callState === "Alerting") {
      setBtnTitle("Answer");
    } else if (callState === "InCall") {
      setBtnTitle("Hang up");
    } else if (callState === "Calling") {
      setBtnTitle("Cancel");
    }
  }, [callState]);

  return {
    btnTitle,
    callState,
    intercomError,
    connectionState,
    handleBtn,
    hangupCall,
  };
};

export default useIntercom;
