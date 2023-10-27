import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Form, Button, Offcanvas } from "react-bootstrap";
import { updateConfig } from "../features/slices/configSlice";

const IntercomForm = () => {
  const dispatch = useDispatch();

  const [serverIp, setServerIp] = useState("");
  const [serverPort, setServerPort] = useState("");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [settingShow, setSettingShow] = useState(false);

  return (
    <>
      <div className="page-title">
        <h1>Intercom Testing</h1>
        <Button variant="secondary" onClick={() => setSettingShow(true)}>
          <img src="./settings.png"></img>
        </Button>
      </div>
      <Offcanvas
        show={settingShow}
        onHide={() => setSettingShow(false)}
        placement="top"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title as="h1">Setting</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body
          style={{
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div className="intercom-form">
            <div className="intercom-form-group">
              <Form.Label>Server IP</Form.Label>
              <Form.Control
                size="sm"
                value={serverIp}
                onChange={(event) => setServerIp(event.target.value)}
              />
            </div>
            <div className="intercom-form-group">
              <Form.Label>Server Port</Form.Label>
              <Form.Control
                size="sm"
                value={serverPort}
                onChange={(event) => setServerPort(event.target.value)}
              />
            </div>
            <div className="intercom-form-group">
              <Form.Label>User Name</Form.Label>
              <Form.Control
                size="sm"
                value={userName}
                onChange={(event) => setUserName(event.target.value)}
              />
            </div>
            <div className="intercom-form-group">
              <Form.Label>Password</Form.Label>
              <Form.Control
                size="sm"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <div className="intercom-form-btn">
                <Button
                  size="sm"
                  variant="dark"
                  onClick={() => {
                    if (!serverIp) {
                      alert("Please enter the Server IP");
                      return;
                    }
                    if (!serverPort) {
                      alert("Please enter the Server Port");
                      return;
                    }
                    if (!userName) {
                      alert("Please enter the User Name");
                      return;
                    }
                    if (!password) {
                      alert("Please enter the Password");
                      return;
                    }

                    dispatch(
                      updateConfig({
                        serverIp: serverIp,
                        serverPort: serverPort,
                        userName: userName,
                        password: password,
                      })
                    );
                    setSettingShow(false);
                  }}
                >
                  Submit
                </Button>
              </div>
            </div>
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default IntercomForm;
