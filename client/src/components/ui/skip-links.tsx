import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * SkipLinks - Accessibility skip navigation links
 */
export function SkipLinks() {
  return (
    <div className="sr-only focus-within:not-sr-only focus-within:absolute focus-within:z-[100] focus-within:left-4 focus-within:top-4">
      <nav aria-label="Skip navigation links">
        <ul className="flex flex-col gap-2">
          <li>
            <a
              href="#main-content"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              onClick={(e) => {
                e.preventDefault()
                const main = document.getElementById("main-content")
                if (main) {
                  main.focus()
                  main.scrollIntoView({ behavior: "smooth", block: "start" })
                }
              }}
            >
              Skip to main content
            </a>
          </li>
          <li>
            <a
              href="#navigation"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              onClick={(e) => {
                e.preventDefault()
                const nav = document.getElementById("navigation")
                if (nav) {
                  nav.focus()
                  nav.scrollIntoView({ behavior: "smooth", block: "start" })
                }
              }}
            >
              Skip to navigation
            </a>
          </li>
        </ul>
      </nav>
    </div>
  )
}

