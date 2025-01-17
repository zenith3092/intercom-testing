import { useState } from "react";

export function useErrMsg() {
    const [errMsg, setErrMsg] = useState("");

    function putErrMsg(msg) {
        setErrMsg(msg);
        setTimeout(() => {
            setErrMsg("");
        }, 3000);
    }

    return { errMsg, putErrMsg };
}
