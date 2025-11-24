// frontend/src/store/ThemeSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  // Persist theme across reloads
  darkMode: localStorage.getItem("global_darkmode") === "true",
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    toggleDarkMode(state) {
      state.darkMode = !state.darkMode;
      localStorage.setItem("global_darkmode", state.darkMode);
    },
    setDarkMode(state, action) {
      state.darkMode = !!action.payload;
      localStorage.setItem("global_darkmode", state.darkMode);
    },
  },
});

export const { toggleDarkMode, setDarkMode } = themeSlice.actions;
export default themeSlice.reducer;
