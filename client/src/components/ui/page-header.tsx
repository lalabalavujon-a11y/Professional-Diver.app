import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { LucideIcon } from "lucide-react"

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  actions?: React.ReactNode
  icon?: LucideIcon
  badge?: React.ReactNode
}

/**
 * PageHeader - Standardized page header component for consistent layout across dashboards
 */
export function PageHeader({
  title,
  description,
  actions,
  icon: Icon,
  badge,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
      {...props}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                {title}
              </h1>
              {badge && <div className="flex-shrink-0">{badge}</div>}
            </div>
            {description && (
              <p className="mt-1 text-sm sm:text-base text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 sm:flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  )
}

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  trend?: {
    value: number
    label: string
    isPositive?: boolean
  }
  variant?: "default" | "primary" | "success" | "warning" | "info"
}

/**
 * StatCard - Standardized stat card for dashboard metrics
 */
export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  variant = "default",
  className,
  ...props
}: StatCardProps) {
  const variantClasses = {
    default: "bg-card border-border",
    primary: "bg-primary/5 border-primary/20",
    success: "bg-success-50 border-success-200",
    warning: "bg-warning-50 border-warning-200",
    info: "bg-info-50 border-info-200",
  }

  const iconClasses = {
    default: "text-muted-foreground",
    primary: "text-primary",
    success: "text-success-600",
    warning: "text-warning-600",
    info: "text-info-600",
  }

  return (
    <div
      className={cn(
        "rounded-lg border p-4 sm:p-6 transition-shadow hover:shadow-md",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl sm:text-3xl font-bold text-foreground">
              {value}
            </p>
            {trend && (
              <span
                className={cn(
                  "text-xs font-medium",
                  trend.isPositive !== false
                    ? "text-success-600"
                    : "text-destructive"
                )}
              >
                {trend.isPositive !== false ? "+" : ""}
                {trend.value}% {trend.label}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              iconClasses[variant]
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  )
}

export interface PageSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  actions?: React.ReactNode
  card?: boolean
}

/**
 * PageSection - Standardized section wrapper for consistent spacing and layout
 */
export function PageSection({
  title,
  description,
  actions,
  card = true,
  children,
  className,
  ...props
}: PageSectionProps) {
  if (card) {
    return (
      <section
        className={cn(
          "rounded-lg border bg-card text-card-foreground shadow-sm",
          className
        )}
        {...props}
      >
        {(title || description || actions) && (
          <div className="border-b border-border px-4 sm:px-6 py-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {title && (
                  <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {description}
                  </p>
                )}
              </div>
              {actions && <div className="flex-shrink-0">{actions}</div>}
            </div>
          </div>
        )}
        <div className="p-4 sm:p-6">{children}</div>
      </section>
    )
  }

  return (
    <section className={cn("space-y-4", className)} {...props}>
      {(title || description || actions) && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title && (
              <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && <div className="flex-shrink-0">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  )
}

