import { UA } from "sip.js"; // 0.14.4

export default class IntercomService {
  connectionErrorHandler = function () {};
  connectingHandler = function () {};
  connectedHandler = function () {};
  disConnectingHandler = function () {};
  disConnectedHandler = function () {};
  inviteHandler = function (session) {};

  constructor(
    serverIp,
    serverPort,
    userName,
    password,
    mediaOptions = {
      audio: true,
      video: false,
    },
    restartState = true,
    autoConnect = true
  ) {
    this.serverIp = serverIp;
    this.serverPort = serverPort;
    this.userName = userName;
    this.password = password;
    this.mediaOptions = mediaOptions;
    this.restartState = restartState;
    this.autoConnect = autoConnect;
    this.config();
  }

  config() {
    this.configuration = {
      uri: `${this.userName}@${this.serverIp}`,
      transportOptions: {
        wsServers: [`wss://${this.serverIp}:${this.serverPort}/ws`],
        traceSip: true,
      },
      sessionDescriptionHandlerFactoryOptions: {
        peerConnectionOptions: {
          iceCheckingTimeout: 500,
          rtcConfiguration: {
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
          },
        },
        constraints: this.mediaOptions,
      },
      authorizationUser: this.userName,
      password: this.password,
      hackWssInTransport: true,
      autostart: false,
    };
    this.userAgent = new UA(this.configuration);
  }

  start() {
    this.userAgent.once("transportCreated", (transport) => {
      transport.on("transportError", () => {
        console.log("Network connection error");
        this.connectionErrorHandler();
      });

      transport.on("connecting", () => {
        console.log("Connecting...");
        this.connectingHandler();
      });

      transport.on("connected", () => {
        console.log("Transport connected, props");
        this.connectedHandler();
        console.log(this.connectedHandler);
      });

      transport.on("disconnecting", () => {
        this.disConnectingHandler();
      });

      transport.on("disconnected", () => {
        this.disConnectedHandler();
        if (this.restartState && this.userName && this.password) {
          setTimeout(() => {
            try {
              transport.connect();
            } catch (err) {
              console.log(err);
            }
          }, 5000);
        }
      });
    });

    this.userAgent.on("invite", (session) => {
      var remoteSdp = session.request.body;
      console.log("Remote SDP:", remoteSdp);
      this.inviteHandler(session);
    });

    this.userAgent.start();
  }
}
