import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import { isTokenValid } from "./utils/auth";

// A present-but-expired/malformed token shouldn't render the dashboard shell
// (its API calls would just fail silently in the background) — treat it as
// logged-out, and clean it up while we're at it.
function getValidToken() {
  const stored = localStorage.getItem("token");
  if (stored && isTokenValid(stored)) return stored;
  if (stored) localStorage.removeItem("token");
  return null;
}

function App() {
  const [token, setToken] = useState(getValidToken());

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const toggleDark = () => setDarkMode((v) => !v);

  return (
    <Routes>
      <Route
        path="/"
        element={token ? <Navigate to="/dashboard" replace /> : <LoginPage setToken={setToken} />}
      />
      <Route
        path="/login"
        element={token ? <Navigate to="/dashboard" replace /> : <LoginPage setToken={setToken} />}
      />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
      <Route path="/payment-success" element={<PaymentSuccessPage />} />
      <Route
        path="/dashboard"
        element={
          token ? (
            <DashboardPage
              setToken={setToken}
              toggleDark={toggleDark}
              darkMode={darkMode}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

export default App;
