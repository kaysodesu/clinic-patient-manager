import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { installDemoMode } from './demoMode';
import { AuthGate } from './auth/AuthGate';
import DemoShell from './demo/DemoShell';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

const root = createRoot(document.getElementById('root')!);

if (DEMO_MODE) {
  // Static demo link: no server or accounts, data stays in this browser
  installDemoMode();
  root.render(<StrictMode><DemoShell><App /></DemoShell></StrictMode>);
} else {
  // Staff sign in first; the gate then loads the shared clinic records and shows the app
  root.render(<StrictMode><AuthGate><App /></AuthGate></StrictMode>);
}
