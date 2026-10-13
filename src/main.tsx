import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import { config } from "@/lib/book";
import { legacyHashUrl } from "../scripts/routing.mjs";
import { BookPreferencesProvider } from "@/hooks/use-book-preferences";
import { TooltipProvider } from "@/components/ui/tooltip";
import App from "./App";
import "./styles/main.css";
import "katex/dist/katex.min.css";
import "@fontsource-variable/inter";
import "@fontsource-variable/vazirmatn";
import "@fontsource-variable/literata";

const Router = config.routing.mode === "hash" ? HashRouter : BrowserRouter;
if (config.routing.mode === "hash") {
  const upgraded = legacyHashUrl(window.location, import.meta.env.BASE_URL);
  if (upgraded) window.history.replaceState(window.history.state, "", upgraded);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Router
      basename={
        config.routing.mode === "browser" ? import.meta.env.BASE_URL : undefined
      }
    >
      <BookPreferencesProvider>
        <TooltipProvider>
          <App />
        </TooltipProvider>
      </BookPreferencesProvider>
    </Router>
  </StrictMode>,
);
