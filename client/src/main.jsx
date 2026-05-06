import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
// Antd's <App> exposes message/notification/modal via context so the
// theme tokens and SSR/CSR boundaries match. Without it, the static
// message.* methods log a "antd: static function can not consume context"
// warning under React 19.
import { App as AntdApp } from "antd";
import { ThemeProvider } from "./theme/ThemeProvider";
import { AuthProvider } from "./store/auth/AuthProvider";
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <AntdApp>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </AntdApp>
    </ThemeProvider>
  </StrictMode>
);
