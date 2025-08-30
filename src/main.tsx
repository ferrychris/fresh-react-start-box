import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Import test runner and console test script in development mode
if (import.meta.env.DEV) {
  import('./test-runner');
  import('./test-post-console');
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    // Disable StrictMode in development to prevent duplicate custom element registration
    // TinyMCE's custom element 'mce-autosize-textarea' gets registered twice in StrictMode
    import.meta.env.DEV ? (
      <App />
    ) : (
      <StrictMode>
        <App />
      </StrictMode>
    )
  );
} else {
  console.error('Root element not found');
}