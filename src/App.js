import React, { useState, useRef, useEffect } from "react";
import { UA } from "sip.js"; // 0.14.4
import { detect } from "detect-browser";
import Config from "./config.json";

let jwtAuth;
let metaData = { param1: "value1", obj1: { objparam1: "objvalue1" } };

let alertVideoUrl;
let ringbackVideoUrl;
let remoteStream;
let localStream;

var incomingSession;
var outgoingSession;

function App() {
  const sipUser = Config.sipUser;
  const sipDomain = Config.sipDomain;
  const sipServer = Config.sipServer;
  const sipPassword = Config.sipPassword;
  const destination = Config.destination;

  const video = false;
  const [error, setError] = useState(null);
  const [connectionState, setConnectionState] = useState(null);
  const [mediaTested, setMediaTested] = useState(null);
  const [mediaSupported, setMediaSupported] = useState(null);
  const [usingHttps, setUsingHttps] = useState(null);
  const [browser, setBrowser] = useState(null);
  const [os, setOs] = useState(null);
  const [callState, setCallState] = useState("Idle");
  const [receivedMeta, setReceivedMeta] = useState(null);
  const [enableButtons, setEnableButtons] = useState(true);
  const [btnTitle, setBtnTitle] = useState(null);
  const [callDirection, setCallDirection] = useState(null);

  const sipUa = useRef(null);
  const remoteVideo = useRef(null);
  const localVideo = useRef(null);
  const currentSession = useRef(null);

  const testMidea = () => {
    var usingHttps = false;
    if (window.location.protocol === "https:") {
      usingHttps = true;
    }

    if (navigator.mediaDevices) {
      navigator.mediaDevices
        .getUserMedia({ audio: true, video: video })
        .then(function () {
          setMediaTested(true);
          setMediaSupported(true);
          setUsingHttps(usingHttps);
        })
        .catch(function () {
          setMediaTested(true);
          setMediaSupported(false);
          setUsingHttps(usingHttps);
        });
    } else {
      var browser = detect();
      console.warn(browser);
      setMediaTested(true);
      setMediaSupported(false);
      setUsingHttps(usingHttps);
      setBrowser(browser.name);
      setOs(browser.os);
    }
  };

  const sipConnectionStateChanged = (newState) => {
    setConnectionState(newState);
  };

  const register = () => {
    let registerOptions = {};
    registerOptions.extraHeaders = [];
    if (jwtAuth) {
      registerOptions.extraHeaders.push("X-JWTAuth:" + jwtAuth);
    }

    sipUa.current.register(registerOptions);
  };

  const placeCall = () => {
    setError("");
    setCallState("Calling");
    let inviteOptions = {};
    inviteOptions.extraHeaders = [];
    if (metaData) {
      let encodedMeta = encodeURIComponent(JSON.stringify(metaData));
      inviteOptions.extraHeaders.push("X-MetaData:" + encodedMeta);
    }

    if (jwtAuth) {
      inviteOptions.extraHeaders.push("X-JWTAuth:" + jwtAuth);
    }

    outgoingSession = sipUa.current.invite(destination, inviteOptions);
    setCallDirection("outgoing");
    handleCall(outgoingSession);
  };

  const incomingCall = (session) => {
    setCallState("Alerting");
    if (alertVideoUrl) {
      remoteVideo.current.setAttribute("src", alertVideoUrl);
    } else {
      remoteVideo.current.setAttribute("src", "./alert.mp4");
    }

    remoteVideo.current.setAttribute("loop", true);
    remoteVideo.current.play();
    incomingSession = session;
    handleCall(session);

    let req = session.request;

    var encodedMeta = req.getHeader("X-MetaData");
    if (encodedMeta) {
      try {
        setReceivedMeta(JSON.parse(decodeURIComponent(encodedMeta)));
      } catch (e) {
        console.warn("Could not parse meta data header");
      }
    }
  };

  const hangupCall = () => {
    console.log("hangupCall called");
    console.log(outgoingSession);
    if (incomingSession) {
      incomingSession.terminate();
      // eslint-disable-next-line
      incomingSession = null;
      setCallDirection(null);
    } else if (outgoingSession) {
      outgoingSession.terminate();
      // eslint-disable-next-line
      outgoingSession = null;
      setCallDirection(null);
    } else {
      setError("Variable error");
    }
  };

  const handleCall = (session) => {
    console.log(session);
    session.on("terminated", (message, cause) => {
      console.log(message);
      console.log(cause);
      // localVideo , remoteVideo => Ref
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
      setCallState("InCall");
      callConnected();
    });

    session.on("cancel", () => {
      setCallState("Canceling");
    });

    session.on("rejected", (response, cause) => {
      setError(`Call failed: ${cause}`);
      incomingSession = null;
      outgoingSession = null;
      setCallDirection(null);
      console.log("rejected");
    });

    session.on("userMediaRequest", (constraints) => {
      console.log(constraints);
    });

    session.on("userMedia", (stream) => {
      console.log(stream);
    });

    session.on("failed", (request) => {
      var cause = request.cause; //sometimes this is request.reason_phrase
      console.log(`status code: ${request.statusCode}`);
      console.log(`reason: ${request.reasonPhrase}`);
      console.log(`data: ${request.data}`);
    });

    session.on("SessionDescriptionHandler-created", () => {
      session.sessionDescriptionHandler.on("userMediaFailed", function () {});
    });

    session.on("trackAdded", () => {
      // We need to check the peer connection to determine which track was added
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
              // do something with remote audio tracks
            } else {
              console.log("==========================================");
              console.log("==========================================");
              console.log("==========================================");
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
              // do something with local audio tracks
            } else {
              console.log("==========================================");
              console.log("==========================================");
              console.log("==========================================");
              console.log("No local audio tracks found");
            }
          } catch (e) {
            console.log(e);
          }

          // Gets remote tracks
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
    if (incomingSession) {
      try {
        setError("");
        incomingSession.accept();
        // eslint-disable-next-line
      } catch (e) {}
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
    setEnableButtons(false);
    setTimeout(() => {
      setEnableButtons(true);
    }, 1000);
  };

  const handleBtn = () => {
    if (callState === "Idle") {
      avoidDoubleTap();
      if (ringbackVideoUrl) {
        remoteVideo.current.src = ringbackVideoUrl;
      } else {
        remoteVideo.current.src = "./ringback.mp4";
      }
      remoteVideo.current.loop = true;
      remoteVideo.current.play();
      placeCall();
    } else if (callState === "Alerting") {
      avoidDoubleTap();
      answerCall();
    } else {
      avoidDoubleTap();
      hangupCall();
    }
  };

  useEffect(() => {
    // if (openFlag) {
    console.log("componentDidUpdate prevProps");
    testMidea();
    var options = {
      uri: `${sipUser}@${sipDomain}`,
      transportOptions: {
        wsServers: [sipServer],
        traceSip: true,
      },
      sessionDescriptionHandlerFactoryOptions: {
        peerConnectionOptions: {
          iceCheckingTimeout: 500,
          rtcConfiguration: {
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
          },
        },

        constraints: {
          audio: true,
          video: video,
        },
      },
      authorizationUser: sipUser,
      password: sipPassword,
      autostart: false,
      hackWssInTransport: true,
      //   register: false,
    };
    sipConnectionStateChanged("Disconnected");

    sipUa.current = new UA(options);

    sipUa.current.once("transportCreated", (transport) => {
      transport.on("transportError", () => {
        setError("Network connection error");
      });

      transport.on("connecting", () => {
        sipConnectionStateChanged("Connecting...");
        console.log("Connecting...");
      });

      transport.on("connected", () => {
        console.log("Transport connected, props");
        sipConnectionStateChanged("Connected");
        setError("");
      });

      transport.on("disconnecting", () => {
        sipConnectionStateChanged("Disonnecting...");
      });

      transport.on("disconnected", () => {
        sipConnectionStateChanged("Disonnected");
      });
    });

    sipUa.current.on("invite", (session) => {
      var remoteSdp = session.request.body;
      console.log("Remote SDP:", remoteSdp);
      incomingCall(session);
      setCallDirection("incoming");
    });
    sipUa.current.start();
  }, []);

  useEffect(() => {
    if (callState === "Idle") {
      setBtnTitle("Call");
      // setSipStatus("Call");
    } else if (callState === "Alerting") {
      setBtnTitle("Answer");
      // setSipStatus("Answer");
    } else {
      setBtnTitle("Hang up");
      // setSipStatus("Hang up");
    }
  }, [callState]);

  const callStateDescription = {
    Calling: "Calling...",
    InCall: "Call Connected",
    Canceling: "Canceling call",
  };

  const printSession = () => {
    if (incomingSession) {
      console.log(incomingSession);
      console.log("incoming");
    } else if (outgoingSession) {
      console.log(outgoingSession);
      console.log("outgoing");
    } else {
      console.log("none");
    }
  };

  return (
    <div className="sip-block">
      <video
        width="0.1%"
        id="localVideo"
        autoPlay
        playsInline
        muted="muted"
        ref={(tag) => (localVideo.current = tag)}
      ></video>
      <video
        ref={(tag) => (remoteVideo.current = tag)}
        width="0.1%"
        id="remoteVideo"
        autoPlay
        playsInline
      ></video>
      {mediaTested ? (
        <div className="media-test">
          {mediaSupported ? (
            <div className="media-support">
              {connectionState === "Connected" && (
                <div>
                  {callState !== "Canceling" && enableButtons && (
                    <button
                      onClick={handleBtn}
                      // style={{ visibility: "hidden" }}
                      status={btnTitle}
                    >
                      {btnTitle}
                    </button>
                  )}
                </div>
              )}

              <div>
                <p>callState: {callStateDescription[callState]}</p>
                <p>callState: {callState}</p>
                <p>error: {error}</p>
                <p>connectionState: {connectionState}</p>
                <p>call direction: {callDirection}</p>
                <button onClick={printSession}>Check Current Session</button>
              </div>

              {receivedMeta && <p>{JSON.stringify(receivedMeta)}</p>}
            </div>
          ) : (
            <div className="non-media-support">
              {browser === "crios" ? (
                <p>
                  You are using Chrome on iPhone. It does not support WebRTC.
                  Please test again using Safari.
                </p>
              ) : (
                <div>
                  <p>
                    You have not permitted use of camera and microphone, or your
                    device is not WebRTC capable.
                  </p>
                  <p>Please verify your settings.</p>
                  <button
                    onClick={() => {
                      window.location.reload();
                    }}
                  >
                    Try to reload page
                  </button>
                  <div>
                    {usingHttps &&
                      "Warning: Page is not loaded via HTTPS. It may cause permission problems accessing camera and microphone!"}
                    {browser}
                    {os}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="non-media-test">
          <p>Requesting camera and microphone permissions...</p>
          <p>Please allow the application to use microphone and camera.</p>
        </div>
      )}
    </div>
  );
}

export default App;
