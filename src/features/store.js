import { configureStore } from "@reduxjs/toolkit";
import configSlice from "./slices/configSlice";

const store = configureStore({
  reducer: {
    config: configSlice,
  },
});

export default store;
