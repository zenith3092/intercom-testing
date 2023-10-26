import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Form, Button } from "react-bootstrap";
import { updateConfig } from "../features/slices/configSlice";

const IntercomForm = () => {
  const dispatch = useDispatch();

  const [serverIp, setServerIp] = useState("");
  const [serverPort, setServerPort] = useState("");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="intercom-form">
      <div className="intercom-form-group">
        <Form.Label>Server IP</Form.Label>
        <Form.Control
          value={serverIp}
          onChange={(event) => setServerIp(event.target.value)}
        />
      </div>
      <div className="intercom-form-group">
        <Form.Label>Server Port</Form.Label>
        <Form.Control
          value={serverPort}
          onChange={(event) => setServerPort(event.target.value)}
        />
      </div>
      <div className="intercom-form-group">
        <Form.Label>User Name</Form.Label>
        <Form.Control
          value={userName}
          onChange={(event) => setUserName(event.target.value)}
        />
      </div>
      <div className="intercom-form-group">
        <Form.Label>Password</Form.Label>
        <Form.Control
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      <div className="intercom-form-group">
        <Button
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
          }}
        >
          Submit
        </Button>
      </div>
    </div>
  );
};

export default IntercomForm;
