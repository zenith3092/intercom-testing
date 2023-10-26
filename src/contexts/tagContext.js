import React, { createContext, useContext } from "react";
import useTag from "../hooks/useTag";

const TagContext = createContext();

export const useTagContext = () => useContext(TagContext);

export const TagContextProvider = ({ children }) => {
  const tagContextValue = useTag();
  return (
    <TagContext.Provider value={tagContextValue}>
      {children}
    </TagContext.Provider>
  );
};
