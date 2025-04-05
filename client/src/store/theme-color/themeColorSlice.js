import { createSlice } from "@reduxjs/toolkit";

export const themeColors = [
  {
    color: "primary",
    code: "#d14152",
    hover: "#93343f",
    sidebarHover: "#f6e1e3",
    sidebarActive: "#fef1f2",
  },
  {
    color: "ocean-blue",
    code: "#6a85ff",
    hover: "#4e6cf0",
    sidebarHover: "#d0d7f9",
    sidebarActive: "#a9b9ff8a",
  },
  {
    color: "sky-blue",
    code: "#1290e0",
    hover: "#0c74b5",
    sidebarHover: "#c8eaff",
    sidebarActive: "#8fcdf57d",
  },
  {
    color: "green",
    code: "#0b9d9f",
    hover: "#098688",
    sidebarHover: "#bcf4f5",
    sidebarActive: "#71d4d578",
  },
  {
    color: "teal",
    code: "#3eb88b",
    hover: "#2da378",
    sidebarHover: "#a6eed399",
    sidebarActive: "#8ae5c385",
  },
  {
    color: "rose",
    code: "#ee5e99",
    hover: "#d54380",
    sidebarHover: "#ffc1db",
    sidebarActive: "#f094b970",
  },
  {
    color: "orange",
    code: "#e16b16",
    hover: "#c85e12",
    sidebarHover: "#fad8c1",
    sidebarActive: "#fec59e7a",
  },
];

const initialState = {
  themeColor: themeColors[0],
};

function setColors(theme) {
  document.documentElement.style.setProperty("--primary", theme?.code);
  document.documentElement.style.setProperty("--primary-hover", theme?.hover);
  document.documentElement.style.setProperty(
    "--sidebar-hover",
    theme?.sidebarHover
  );
  document.documentElement.style.setProperty(
    "--sidebar-active-link-bg",
    theme?.sidebarActive
  );
  document.documentElement.style.setProperty(
    "--secondary-btn-text",
    theme?.code
  );
  document.documentElement.style.setProperty(
    "--secondary-btn-bg",
    theme?.sidebarActive
  );
  document.documentElement.style.setProperty(
    "--secondary-btn-bg-hover",
    theme?.sidebarHover
  );
  document.documentElement.style.setProperty("--upload-file-name", theme?.code);
}

export const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    checkThemeColor: (state, action) => {
      let theme = themeColors[action?.payload ?? 0];
      // let localTheme = localStorage.getItem("theme-color");

      // if (localTheme) {
      //   theme = themeColors.find((t) => t.color === localTheme);
      // }

      setColors(theme);
      state.themeColor = theme;
    },
    toggleThemeColor: (state, action) => {
      let theme = themeColors[action?.payload];
      // localStorage.setItem("theme-color", theme?.color);
      setColors(theme);
      state.themeColor = theme;
    },
  },
});

export const { checkThemeColor, toggleThemeColor } = themeSlice.actions;

export default themeSlice.reducer;
