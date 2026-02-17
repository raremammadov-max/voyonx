import "mapbox-gl/dist/mapbox-gl.css";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import "./index.css";

// Для Mapbox (если где-то в коде ты читаешь window.MAPBOX_TOKEN)
(window as any).MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Root element #root not found");
}

createRoot(rootEl).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
