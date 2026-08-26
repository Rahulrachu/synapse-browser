import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import MainLayout from './components/MainLayout.js';
import Onboarding from './components/Onboarding.js';
import { useWorkspaceStore } from './store/workspaceStore.js';

const App = () => {
  const initialize = useWorkspaceStore(state => state.initialize);
  const [onboarding, setOnboarding] = React.useState(() => localStorage.getItem('synapse.onboardingComplete') !== 'true');

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (window.electron) void window.electron.invoke('set-browser-view-visibility', !onboarding);
  }, [onboarding]);

  return onboarding ? <Onboarding onComplete={() => setOnboarding(false)} /> : <MainLayout />;
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
