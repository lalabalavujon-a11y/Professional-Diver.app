import { useState, useEffect } from "react";
import { X, Download, Smartphone, Monitor } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode or saved to home screen)
    const checkIfInstalled = () => {
      // Check for standalone display mode (PWA installed)
      if (window.matchMedia("(display-mode: standalone)").matches) {
        setIsInstalled(true);
        return true;
      }
      
      // Check for iOS home screen installation
      const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (iOS) {
        // Check if running in standalone mode (iOS home screen)
        if ((window.navigator as any).standalone === true || 
            window.matchMedia("(display-mode: standalone)").matches) {
          setIsInstalled(true);
          return true;
        }
        // Check if user has previously installed (stored in localStorage)
        if (localStorage.getItem("pwa-installed") === "true") {
          setIsInstalled(true);
          return true;
        }
      }
      
      // Check for Android installation
      const android = /Android/.test(navigator.userAgent);
      if (android) {
        // Check if running in standalone mode
        if (window.matchMedia("(display-mode: standalone)").matches) {
          setIsInstalled(true);
          return true;
        }
        // Check if user has previously installed
        if (localStorage.getItem("pwa-installed") === "true") {
          setIsInstalled(true);
          return true;
        }
      }
      
      return false;
    };

    if (checkIfInstalled()) {
      return;
    }

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // Detect Android
    const android = /Android/.test(navigator.userAgent);
    setIsAndroid(android);

    // Listen for the beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after a delay if user hasn't dismissed it before
      const dismissed = localStorage.getItem("pwa-install-dismissed");
      if (!dismissed) {
        setTimeout(() => setShowInstallPrompt(true), 3000);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Listen for app installed event
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      localStorage.setItem("pwa-installed", "true");
      setShowInstallPrompt(false);
    });

    // Periodically check if app was installed (for iOS manual installs)
    const checkInterval = setInterval(() => {
      if (checkIfInstalled()) {
        clearInterval(checkInterval);
      }
    }, 1000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      clearInterval(checkInterval);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Android/Chrome - use native prompt
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === "accepted") {
        setIsInstalled(true);
        localStorage.setItem("pwa-installed", "true");
        setShowInstallPrompt(false);
      }
      
      setDeferredPrompt(null);
    } else {
      // iOS or manual instructions
      setShowInstallPrompt(true);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem("pwa-install-dismissed", "true");
    // Reset after 7 days
    setTimeout(() => {
      localStorage.removeItem("pwa-install-dismissed");
    }, 7 * 24 * 60 * 60 * 1000);
  };

  // Don't show if already installed
  if (isInstalled) {
    return null;
  }

  return (
    <>
      {/* Floating Install Button */}
      {!showInstallPrompt && (isIOS || isAndroid || deferredPrompt) && (
        <Button
          onClick={handleInstallClick}
          className="fixed bottom-4 right-4 z-50 shadow-lg rounded-full h-14 w-14 p-0"
          size="lg"
          variant="default"
        >
          <Download className="h-6 w-6" />
        </Button>
      )}

      {/* Installation Instructions Dialog */}
      <Dialog open={showInstallPrompt} onOpenChange={setShowInstallPrompt}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Install Diver Well Training App
            </DialogTitle>
            <DialogDescription>
              Add Diver Well Training to your home screen for quick access and a native app experience.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* iOS Instructions */}
            {isIOS && (
              <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  iPhone & iPad Instructions
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Tap the <strong>Share button</strong> (square with arrow) at the bottom of Safari</li>
                  <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                  <li>Customize the name if desired, then tap <strong>"Add"</strong></li>
                  <li>The app icon will appear on your home screen!</li>
                </ol>
                <p className="mt-3 text-xs text-muted-foreground">
                  ⚠️ <strong>Important:</strong> You must use Safari browser (not Chrome) to install on iOS.
                </p>
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      localStorage.setItem("pwa-installed", "true");
                      setIsInstalled(true);
                      setShowInstallPrompt(false);
                    }}
                    className="w-full"
                  >
                    I've Added It to Home Screen
                  </Button>
                </div>
              </div>
            )}

            {/* Android Instructions */}
            {isAndroid && !deferredPrompt && (
              <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-950">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Android Instructions
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Tap the <strong>three-dot menu</strong> (⋮) in the top-right corner</li>
                  <li>Select <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong></li>
                  <li>Tap <strong>"Add"</strong> or <strong>"Install"</strong> to confirm</li>
                  <li>The app icon will appear on your home screen!</li>
                </ol>
                <p className="mt-3 text-xs text-muted-foreground">
                  💡 <strong>Tip:</strong> Chrome browser is recommended for the best experience.
                </p>
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      localStorage.setItem("pwa-installed", "true");
                      setIsInstalled(true);
                      setShowInstallPrompt(false);
                    }}
                    className="w-full"
                  >
                    I've Added It to Home Screen
                  </Button>
                </div>
              </div>
            )}

            {/* Desktop Instructions */}
            {!isIOS && !isAndroid && (
              <div className="border rounded-lg p-4 bg-purple-50 dark:bg-purple-950">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Desktop Instructions
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <strong>Chrome/Edge:</strong>
                    <p className="mt-1">Look for the install icon in the address bar and click "Install"</p>
                  </div>
                  <div>
                    <strong>Safari (Mac):</strong>
                    <p className="mt-1">Click File → Add to Dock</p>
                  </div>
                </div>
              </div>
            )}

            {/* Benefits */}
            <div className="border rounded-lg p-4 bg-muted">
              <h3 className="font-semibold mb-2">Benefits of Installing:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Quick access from your home screen</li>
                <li>Full-screen app experience</li>
                <li>Faster loading with offline support</li>
                <li>Works like a native app</li>
                <li>Always up-to-date automatically</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleDismiss}>
                Maybe Later
              </Button>
              {deferredPrompt && (
                <Button onClick={handleInstallClick}>
                  Install Now
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

