import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Force scroll to top on initial load and disable scroll restoration
if (typeof window !== 'undefined') {
  // Disable browser scroll restoration
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
  }
  
  // Force scroll to top immediately
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  
  // Also scroll to top after a brief delay to catch any late renders
  setTimeout(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, 0);
  
  // And on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });
  }
}

createRoot(document.getElementById("root")!).render(<App />);
