import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";

// ── Apply theme BEFORE React renders to prevent flash ─────────
(function applyThemeEarly() {
  try {
    const theme = localStorage.getItem('masroofy-theme') ?? 'system';
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = theme === 'dark' || (theme === 'system' && prefersDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch {
    // localStorage not available — ignore
  }
})();

// ── Apply language direction BEFORE render ────────────────────
(function applyLanguageEarly() {
  try {
    const lang = localStorage.getItem('masroofy-language') ?? 'ar';
    document.documentElement.dir  = lang === 'en' ? 'ltr' : 'rtl';
    document.documentElement.lang = lang;
  } catch {
    // ignore
  }
})();

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error('Root element with id "root" not found.');
}

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);

// Register service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}