import {
    RegistererState as RS,
    SessionState as SS,
    UserAgentState as UAS,
} from "sip.js";

class enumBase {
    /**
     * Check if the enum includes the value
     *
     * @param {any} value
     * @returns {boolean}
     */
    static includes(value) {
        return this.values().includes(value);
    }

    /**
     * Get all keys of the enum
     *
     * @returns {string[]} keys
     */
    static keys() {
        return Object.getOwnPropertyNames(this).filter(
            (key) => ["length", "name", "prototype"].indexOf(key) === -1
        );
    }

    /**
     * Get all values of the enum
     *
     * @returns {any[]} values
     */
    static values() {
        return this.keys().map((key) => this[key]);
    }
}

class SessionType extends enumBase {
    static get Incoming() {
        return "Incoming";
    }

    static get Outgoing() {
        return "Outgoing";
    }

    static get None() {
        return "";
    }
}

class ConnectionState extends enumBase {
    static get Connected() {
        return "Connected";
    }
    static get Disconnected() {
        return "Disconnected";
    }
    static get Connecting() {
        return "Connecting";
    }
    static get Disconnecting() {
        return "Disconnecting";
    }
}

class RegistererState extends enumBase {
    static get Registered() {
        return RS.Registered;
    }
    static get Unregistered() {
        return RS.Unregistered;
    }
    static get Initial() {
        return RS.Initial;
    }
    static get Terminated() {
        return RS.Terminated;
    }
}

class SessionState extends enumBase {
    static get Initial() {
        return SS.Initial;
    }
    static get Establishing() {
        return SS.Establishing;
    }
    static get Established() {
        return SS.Established;
    }
    static get Terminating() {
        return SS.Terminating;
    }
    static get Terminated() {
        return SS.Terminated;
    }
    static get Idle() {
        return "Idle";
    }
}

class UserAgentState extends enumBase {
    static get Started() {
        return UAS.Started;
    }
    static get Stopped() {
        return UAS.Stopped;
    }
}

export {
    SessionType,
    SessionState,
    ConnectionState,
    RegistererState,
    UserAgentState,
};
