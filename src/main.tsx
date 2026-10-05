import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { migrateStorageIfNeeded } from './utils/storage';

// Clear any stale demo seed data (sample PRs / achievements) before first render
migrateStorageIfNeeded();

createRoot(document.getElementById('root')!).render(<App />);
