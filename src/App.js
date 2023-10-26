import React, { useEffect, useState } from "react";
import { detect } from "detect-browser";
import IntercomForm from "./components/intercom-form";
import IntercomWidget from "./components/intercom-widget";
import MediaGruop from "./components/media-gruop";

const mediaOptions = {
  audio: true,
  video: false,
};

function App() {
  const [browser, setBrowser] = useState(null);
  const [mediaTested, setMediaTested] = useState(false);
  const [mediaSupported, setMediaSupported] = useState(false);

  const testMedia = () => {
    if (navigator.mediaDevices) {
      navigator.mediaDevices
        .getUserMedia(mediaOptions)
        .then(() => {
          setMediaTested(true);
          setMediaSupported(true);
        })
        .catch((e) => {
          console.error(e);
          setMediaTested(true);
          setMediaSupported(false);
        });
    } else {
      var browser = detect();
      console.warn(browser);
      setBrowser(browser.name);
      setMediaTested(true);
      setMediaSupported(false);
    }
  };

  useEffect(() => {
    testMedia();
  }, []);

  return (
    <div className="page">
      <IntercomForm />
      <IntercomWidget
        browser={browser}
        mediaTested={mediaTested}
        mediaSupported={mediaSupported}
      />
      <MediaGruop />
    </div>
  );
}

export default App;
