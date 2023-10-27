import React, { useState } from "react";
import { useIntercomContext } from "../contexts/intercomContext";
import { Form, Button, Card, Alert } from "react-bootstrap";

const IntercomWidget = ({ browser, mediaTested, mediaSupported }) => {
  const { btnTitle, callState, intercomError, connectionState, handleBtn } =
    useIntercomContext();

  const [target, setTarget] = useState("");

  const handleCall = () => {
    if (!target && callState === "Idle") {
      alert("Please enter the target");
      return;
    }
    handleBtn(target);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleCall();
    }
  };

  return (
    <>
      <div className="intercom-widget">
        {mediaTested ? (
          <div className="media-test">
            {mediaSupported ? (
              <div className="media-support">
                <Alert variant="secondary">{`Connection State : ${connectionState}`}</Alert>
                <Alert variant="secondary">{`Call State : ${callState}`}</Alert>
                {intercomError && (
                  <Alert variant="danger">{`Error : ${intercomError}`}</Alert>
                )}
                {connectionState === "Connected" &&
                  callState !== "Canceling" && (
                    <Card>
                      <Card.Header>Control</Card.Header>
                      <Card.Body>
                        <Form>
                          <Form.Group>
                            <Form.Label>Target</Form.Label>
                            <Form.Group className="widget-form-inner">
                              <Form.Control
                                value={target}
                                onChange={(event) =>
                                  setTarget(event.target.value)
                                }
                                onKeyDown={(event) => handleKeyDown(event)}
                              />
                              <Button onClick={handleCall}>{btnTitle}</Button>
                            </Form.Group>
                          </Form.Group>
                        </Form>
                      </Card.Body>
                    </Card>
                  )}
              </div>
            ) : (
              <Card border="danger" text="danger">
                <Card.Header>Media Error</Card.Header>
                {browser === "crios" ? (
                  <Card.Text>
                    You are using Chrome on iPhone. It does not support WebRTC.
                    Please test again using Safari.
                  </Card.Text>
                ) : (
                  <>
                    <Card.Text>
                      You have not permitted use of camera and microphone, or
                      your device is not WebRTC capable.
                    </Card.Text>
                    <Card.Text>Please verify your settings.</Card.Text>
                    <Button
                      onClick={() => {
                        window.location.reload();
                      }}
                    >
                      Try to reload page
                    </Button>
                  </>
                )}
              </Card>
            )}
          </div>
        ) : (
          <Card border="danger" text="danger">
            <Card.Header>Permission Error</Card.Header>
            <Card.Body>
              <Card.Text>Requesting microphone permission ...</Card.Text>
              <Card.Text>
                Please allow the application to use microphone
              </Card.Text>
            </Card.Body>
          </Card>
        )}
      </div>
    </>
  );
};

export default IntercomWidget;
