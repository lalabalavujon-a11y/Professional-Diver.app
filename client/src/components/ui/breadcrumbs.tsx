import * as React from "react"
import { Link, useLocation } from "wouter"
import { cn } from "@/lib/utils"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ChevronRight, Home } from "lucide-react"

export interface BreadcrumbNavItem {
  label: string
  href?: string
}

export interface BreadcrumbsProps {
  items?: BreadcrumbNavItem[]
  showHome?: boolean
  className?: string
}

/**
 * Enhanced Breadcrumbs component with automatic route detection
 */
export function Breadcrumbs({ items, showHome = true, className }: BreadcrumbsProps) {
  const [location] = useLocation()

  // Auto-generate breadcrumbs from route if not provided
  const breadcrumbItems = React.useMemo(() => {
    if (items) return items

    const pathParts = location.split("/").filter(Boolean)
    const generated: BreadcrumbNavItem[] = []

    if (showHome) {
      generated.push({ label: "Home", href: "/" })
    }

    let currentPath = ""
    pathParts.forEach((part, index) => {
      currentPath += `/${part}`
      const isLast = index === pathParts.length - 1
      
      // Format label (replace hyphens with spaces, capitalize)
      const label = part
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")

      generated.push({
        label,
        href: isLast ? undefined : currentPath,
      })
    })

    return generated
  }, [location, items, showHome])

  return (
    <Breadcrumb className={cn("mb-4", className)}>
      <BreadcrumbList>
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1

          return (
            <React.Fragment key={index}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : item.href ? (
                  <BreadcrumbLink asChild>
                    <Link href={item.href}>
                      {index === 0 && showHome ? (
                        <Home className="h-4 w-4" />
                      ) : (
                        item.label
                      )}
                    </Link>
                  </BreadcrumbLink>
                ) : (
                  <span>{item.label}</span>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

