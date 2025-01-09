import axios from "axios";

const WEB_SERVER_URL = "http://127.0.0.1:5211";

async function getConnectionStatus() {
    return axios.get(WEB_SERVER_URL + "/api/sip/connection_status");
}

/**
 * @param {string} caller_id
 */
async function checkCallerAvailability(caller_id) {
    return axios.get(WEB_SERVER_URL + "/api/sip/check_caller_availability", {
        params: { caller_id },
    });
}

/**
 *
 * @param {string} caller_id
 */
async function forceToHangup(caller_id) {
    return axios.post(WEB_SERVER_URL + "/api/sip/hangup", {
        caller_id,
    });
}

export { getConnectionStatus, checkCallerAvailability, forceToHangup };
