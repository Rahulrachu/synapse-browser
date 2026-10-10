import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles/synapse.css";
import "./styles/layout.css";
import { MainLayout } from "./layout/MainLayout";
import { Onboarding } from "./components/Onboarding";
import { useWorkspaceStore } from "./store/workspaceStore";

const App = () => {
  const initialize = useWorkspaceStore((state) => state.initialize);
  const [onboarding, setOnboarding] = useState(
    () => localStorage.getItem("synapse.onboardingComplete") !== "true",
  );
  useEffect(() => {
    initialize();
  }, [initialize]);
  useEffect(() => {
    if (window.electron) void window.electron.invoke("set-browser-view-visibility", !onboarding);
  }, [onboarding]);
  return onboarding ? <Onboarding onComplete={() => setOnboarding(false)} /> : <MainLayout />;
};
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
