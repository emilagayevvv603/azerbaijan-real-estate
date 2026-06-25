import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { setupGlobalFetchInterceptor } from './utils/api.ts';

// Initialize the global fetch interceptor to support dual-backend failover on external deploys (like Netlify)
setupGlobalFetchInterceptor();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
