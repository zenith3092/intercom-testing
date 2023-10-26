import React, { useContext, createContext } from "react";
import useIntercom from "../hooks/useIntercom";

const IntercomContext = createContext();

export const useIntercomContext = () => useContext(IntercomContext);

export const IntercomContextProvider = ({ children }) => {
  const intercomContextValue = useIntercom();
  return (
    <IntercomContext.Provider value={intercomContextValue}>
      {children}
    </IntercomContext.Provider>
  );
};
