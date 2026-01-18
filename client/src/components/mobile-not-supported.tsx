import * as React from "react"
import { Smartphone, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "wouter"

interface MobileNotSupportedProps {
  pageName?: string
}

/**
 * MobileNotSupported - Component shown when users access desktop-only pages on mobile
 * Displays a clear message that the page is not optimized for mobile and provides navigation options
 */
export function MobileNotSupported({ pageName = "This page" }: MobileNotSupportedProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <Smartphone className="h-10 w-10 text-muted-foreground" />
      </div>
      <h1 className="mb-3 text-2xl font-bold text-foreground">
        Not Optimized for Mobile
      </h1>
      <p className="mb-2 max-w-md text-base text-muted-foreground">
        {pageName} is currently designed for desktop and tablet use. We're working on a mobile-optimized version.
      </p>
      <p className="mb-8 max-w-md text-sm text-muted-foreground">
        Please access this page on a desktop or tablet device for the best experience.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/">
          <Button variant="default" className="w-full sm:w-auto">
            <Monitor className="mr-2 h-4 w-4" />
            Go to Home
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="outline" className="w-full sm:w-auto">
            View Dashboard
          </Button>
        </Link>
      </div>
    </div>
  )
}
