import { Smartphone, Download, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";

export default function InstallApp() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isAndroid = /Android/.test(navigator.userAgent);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">Install Diver Well Training</h1>
        <p className="text-muted-foreground text-lg">
          Add our app to your home screen for quick access and a native app experience
        </p>
      </div>

      {/* Benefits */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Quick Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Launch directly from your home screen, just like a native app
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Offline Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Access previously viewed content even without internet connection
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Always Updated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Automatically updates when you open it - no app store needed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* iOS Instructions */}
      {isIOS && (
        <Card className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-6 w-6" />
              iPhone & iPad Instructions
            </CardTitle>
            <CardDescription>
              Follow these steps to install on your iOS device
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium">Open in Safari</p>
                  <p className="text-sm text-muted-foreground">
                    Make sure you're using Safari browser (not Chrome or Firefox)
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium">Tap the Share Button</p>
                  <p className="text-sm text-muted-foreground">
                    Look for the square icon with an arrow pointing up at the bottom of Safari
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium">Select "Add to Home Screen"</p>
                  <p className="text-sm text-muted-foreground">
                    Scroll down in the share menu and tap "Add to Home Screen"
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <p className="font-medium">Tap "Add"</p>
                  <p className="text-sm text-muted-foreground">
                    Customize the name if desired, then tap "Add" to finish
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                ⚠️ Important: You must use Safari browser to install on iOS devices
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Android Instructions */}
      {isAndroid && (
        <Card className="mb-6 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-6 w-6" />
              Android Instructions
            </CardTitle>
            <CardDescription>
              Follow these steps to install on your Android device
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium">Open in Chrome</p>
                  <p className="text-sm text-muted-foreground">
                    Use Chrome browser for the best experience (recommended)
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium">Look for Install Prompt</p>
                  <p className="text-sm text-muted-foreground">
                    Chrome may show a banner saying "Add Diver Well to Home screen" - tap "Install"
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium">Or Use Menu</p>
                  <p className="text-sm text-muted-foreground">
                    Tap the three-dot menu (⋮) → "Add to Home screen" or "Install app"
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <p className="font-medium">Confirm Installation</p>
                  <p className="text-sm text-muted-foreground">
                    Review the app name and tap "Add" or "Install" to finish
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Desktop Instructions */}
      {!isIOS && !isAndroid && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Desktop Installation</CardTitle>
            <CardDescription>
              Install the app on your desktop computer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-medium mb-2">Chrome/Edge (Windows/Mac/Linux):</p>
              <p className="text-sm text-muted-foreground">
                Look for the install icon in the address bar and click "Install"
              </p>
            </div>
            <div>
              <p className="font-medium mb-2">Safari (Mac):</p>
              <p className="text-sm text-muted-foreground">
                Click File → Add to Dock
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Troubleshooting */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium mb-1">Install option not showing?</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Make sure you're using the correct browser (Safari for iOS, Chrome for Android)</li>
              <li>Try refreshing the page</li>
              <li>Clear your browser cache</li>
              <li>Make sure you're on the main page</li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-1">App not working after installation?</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Make sure you have an active internet connection</li>
              <li>Try uninstalling and reinstalling</li>
              <li>Clear browser cache</li>
              <li>Check if your browser is up to date</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* System Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>System Requirements</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">iOS:</span>
            <span>iOS 11.3 or later (Safari required)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Android:</span>
            <span>Android 5.0 or later (Chrome recommended)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Storage:</span>
            <span>~5-10 MB</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Internet:</span>
            <span>Required for initial setup</span>
          </div>
        </CardContent>
      </Card>

      {/* Back Button */}
      <div className="mt-8 text-center">
        <Link href="/">
          <Button variant="outline">
            <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
            Go Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}






