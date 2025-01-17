import axios from "axios";

const WEB_SERVER_URL = import.meta.env.VITE_WEB_SERVER_URL;

/**
 * @param {string} caller_id
 */
async function checkCallerAvailability(caller_id) {
    return axios.get(WEB_SERVER_URL + "/api/sip/check_caller_availability", {
        params: { caller_id },
    });
}

/**
 * @param {string} queue
 */
async function checkQueueAvailability(queue) {
    return axios.get(WEB_SERVER_URL + "/api/sip/check_queue_availability", {
        params: { queue },
    });
}

/**
 * @param {string} caller_id
 */
async function forceToHangup(caller_id) {
    return axios.post(WEB_SERVER_URL + "/api/sip/hangup", {
        caller_id,
    });
}

export { checkCallerAvailability, forceToHangup, checkQueueAvailability };
