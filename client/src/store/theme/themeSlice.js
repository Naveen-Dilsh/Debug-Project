import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  themeMode: "light",
};

export const themeSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    checkThemeMode: (state, action) => {
      let mode = "light";
      let localTheme = localStorage.getItem("selected-theme");

      if (localTheme) {
        mode = localTheme;
      }
      // else {
      //   let windowTheme = window.matchMedia(
      //     "(prefers-color-scheme: dark)"
      //   )?.matches;
      //   mode = windowTheme ? "dark" : "light";
      // }

      document.querySelector("body").setAttribute("data-theme", mode);
      state.themeMode = mode;
    },
    toggleThemeMode: (state) => {
      let mode = state.themeMode;
      mode == "light" ? (mode = "dark") : (mode = "light");

      localStorage.setItem("selected-theme", mode);
      document.querySelector("body").setAttribute("data-theme", mode);
      state.themeMode = mode;
    },
  },
});

export const { checkThemeMode, toggleThemeMode } = themeSlice.actions;

export default themeSlice.reducer;
