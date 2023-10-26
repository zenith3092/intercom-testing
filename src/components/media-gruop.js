import React from "react";
import { useTagContext } from "../contexts/tagContext";

const MediaGruop = () => {
  const { localVideo, remoteVideo } = useTagContext();
  return (
    <>
      <video
        width="0.01%"
        id="localVideo"
        autoPlay
        playsInline
        loop
        muted="muted"
        ref={(tag) => {
          if (tag) {
            localVideo.current = tag;
          }
        }}
        style={{ display: "none" }}
      ></video>
      <video
        ref={(tag) => {
          if (tag) {
            remoteVideo.current = tag;
          }
        }}
        width="0.01%"
        id="remoteVideo"
        autoPlay
        playsInline
        loop
        style={{ display: "none" }}
      ></video>
    </>
  );
};

export default MediaGruop;
