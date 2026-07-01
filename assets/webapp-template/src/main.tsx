import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProvider } from './context/AppContext';
import { App } from './components/App';
import './index.css';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

createRoot(rootEl).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
);
