import React from 'react';
import { createRoot } from 'react-dom/client';  // Correct import
import App from './App.js';
import "./global.css";
const root = document.getElementById('root');
if (root) {
  const rootElement = createRoot(root);
  rootElement.render(<App />);
} else {
  console.error('Root element not found');
}