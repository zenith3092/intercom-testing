import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Provider } from "react-redux";
import { TagContextProvider } from "./contexts/tagContext";
import { IntercomContextProvider } from "./contexts/intercomContext";
import store from "./features/store";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/index.scss";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <Provider store={store}>
    <TagContextProvider>
      <IntercomContextProvider>
        <App />
      </IntercomContextProvider>
    </TagContextProvider>
  </Provider>
);
