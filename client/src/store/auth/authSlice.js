import { createSlice } from "@reduxjs/toolkit";

import { decodeToken } from "react-jwt";

const initialState = {
  isLogged: false,
  authToken: "",
  userDetails: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    checkLogged: (state) => {
      let token = localStorage.getItem(process.env.REACT_APP_JWT_TOKEN);
      state.isLogged = token ? true : false;
      state.authToken = token ? token : "";
      state.userDetails = token ? decodeToken(token) : {};
    },
  },
});

// Action creators are generated for each case reducer function
export const { checkLogged } = authSlice.actions;

export default authSlice.reducer;
