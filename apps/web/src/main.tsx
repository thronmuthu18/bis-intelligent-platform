import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppRouter } from '@/router';
import '@/styles/globals.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error(
    'Root element #root not found. Check index.html.',
  );
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>,
);
