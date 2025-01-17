import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import SuperApp from "./App.jsx";
import { IntercomObjectsProvider } from "./intercom-lib/intercomContext.jsx";

createRoot(document.getElementById("root")).render(
    <IntercomObjectsProvider>
        <SuperApp />
    </IntercomObjectsProvider>
);
