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

// Unlock scrolling after React renders
const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
  
  // Aggressively keep scroll at top and unlock after content renders
  const unlockScroll = () => {
    // Force scroll to top multiple times
    window.scrollTo(0, 0);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // Unlock body scroll
    document.body.style.overflow = '';
    document.body.style.overflowX = 'hidden';
    
    // Continue forcing scroll to top for a bit after unlock
    let scrollCheckCount = 0;
    const scrollCheck = setInterval(() => {
      if (window.scrollY > 0 || document.documentElement.scrollTop > 0 || document.body.scrollTop > 0) {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }
      scrollCheckCount++;
      if (scrollCheckCount > 20) { // Check for 1 second (20 * 50ms)
        clearInterval(scrollCheck);
      }
    }, 50);
  };
  
  // Unlock after initial render
  setTimeout(unlockScroll, 200);
  
  // Also unlock on window load as backup
  window.addEventListener('load', unlockScroll, { once: true });
}
