import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import { StrictMode } from "react";
import { AuthProvider } from "./lib/AuthProvider";

hydrateRoot(
  document,
  <StrictMode>
    <AuthProvider>
      <HydratedRouter />
    </AuthProvider>
  </StrictMode>
);
