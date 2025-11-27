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
  <React.StrictMode>
    <Provider store={store}>
      <GoogleOAuthProvider clientId='850618894030-doc6p0ik890tec8rabi7dq6s3tp5forv.apps.googleusercontent.com' >
            <ThemeSyncWrapper />

      </GoogleOAuthProvider>
    </Provider>
  </React.StrictMode>
);