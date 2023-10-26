import { useRef } from "react";

const useTag = () => {
  const remoteVideo = useRef(null);
  const localVideo = useRef(null);
  return {
    remoteVideo,
    localVideo,
  };
};

export default useTag;
