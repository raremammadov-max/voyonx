import "mapbox-gl/dist/mapbox-gl.css";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import "./index.css";

(window as any).MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
