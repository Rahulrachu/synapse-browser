import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';

const App = () => {
  return (
    <div>
      <h1>Synapse Browser</h1>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
