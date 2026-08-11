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

  return (
    <MainLayout>
      <div className="h-full w-full flex items-center justify-center bg-white dark:bg-neutral-900 text-gray-500">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Welcome to Synapse</h1>
          <p className="text-lg">Your AI-first developer workspace is ready.</p>
        </div>
      </div>
    </MainLayout>
  );
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
