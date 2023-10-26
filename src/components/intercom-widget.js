import React, { useState, useEffect } from "react";
import { useIntercomContext } from "../contexts/intercomContext";
import { Form, Button } from "react-bootstrap";

const IntercomWidget = ({ browser, mediaTested, mediaSupported }) => {
  const { btnTitle, callState, intercomError, connectionState, handleBtn } =
    useIntercomContext();

  const [target, setTarget] = useState("");

  return (
    <div className="intercom-widget">
      {mediaTested ? (
        <div className="media-test">
          {mediaSupported ? (
            <div className="media-support">
              {connectionState === "Connected" && (
                <div>
                  {callState !== "Canceling" && (
                    <>
                      <Form.Label>Target</Form.Label>
                      <Form.Control
                        value={target}
                        onChange={(event) => setTarget(event.target.value)}
                      />
                      <Button
                        onClick={() => {
                          if (!target && callState === "Idle") {
                            alert("Please enter the target");
                            return;
                          }
                          handleBtn(target);
                        }}
                      >
                        {btnTitle}
                      </Button>
                    </>
                  )}
                </div>
              )}

              <div>
                <p>Connection State: {connectionState}</p>
                <p>Call State: {callState}</p>
                <p>Error: {intercomError}</p>
              </div>
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
};

export default IntercomWidget;
