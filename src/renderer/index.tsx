import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import MainLayout from './components/MainLayout.js';
import { useWorkspaceStore } from './store/workspaceStore.js';

const App = () => {
  const initialize = useWorkspaceStore(state => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return <MainLayout />;
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
