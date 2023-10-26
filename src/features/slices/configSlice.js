import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  loading: false,
  data: { serverIp: "", serverPort: "", userName: "", password: "" },
  error: "",
};

const configSlice = createSlice({
  name: "config",
  initialState,
  reducers: {
    updateConfig: (state, action) => {
      state.data = action.payload;
    },
  },
});

export const { updateConfig } = configSlice.actions;

export default configSlice.reducer;
