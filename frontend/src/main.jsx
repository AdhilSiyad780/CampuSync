import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { Provider, useSelector } from "react-redux";
import { store } from "./store/store";
import App from "./App";
import "./index.css"; // make sure global styles are imported
import {GoogleOAuthProvider}  from '@react-oauth/google'

function ThemeSyncWrapper() {
  const darkMode = useSelector((state) => state.theme.darkMode);

  useEffect(() => {
    // Tailwind dark mode: add/remove .dark on <html>
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return <App />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
    <Provider store={store}>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID} >
            <ThemeSyncWrapper />

      </GoogleOAuthProvider>
    </Provider>
);