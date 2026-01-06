import * as React from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2 } from "lucide-react"

/**
 * LoadingSpinner - Simple spinner component for loading states
 */
interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg"
  text?: string
}

export function LoadingSpinner({ 
  className, 
  size = "md", 
  text,
  ...props 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2",
        className
      )}
      role="status"
      aria-label="Loading"
      {...props}
    >
      <Loader2 
        className={cn(
          "animate-spin text-primary",
          sizeClasses[size]
        )}
        aria-hidden="true"
      />
      {text && (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {text}
        </p>
      )}
      <span className="sr-only">Loading...</span>
    </div>
  )
}

/**
 * SkeletonCard - Card skeleton loader
 */
interface SkeletonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number
  showAvatar?: boolean
}

export function SkeletonCard({ 
  className, 
  lines = 3, 
  showAvatar = false,
  ...props 
}: SkeletonCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-6 space-y-4",
        className
      )}
      {...props}
    >
      {showAvatar && (
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      )}
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn(
              "h-4",
              i === lines - 1 ? "w-3/4" : "w-full"
            )}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * SkeletonTable - Table skeleton loader
 */
interface SkeletonTableProps extends React.HTMLAttributes<HTMLDivElement> {
  rows?: number
  columns?: number
}

export function SkeletonTable({ 
  className, 
  rows = 5, 
  columns = 4,
  ...props 
}: SkeletonTableProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card overflow-hidden",
        className
      )}
      {...props}
    >
      {/* Header */}
      <div className="border-b bg-muted/50 p-4 grid gap-4" 
           style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4" />
        ))}
      </div>
      
      {/* Rows */}
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="p-4 grid gap-4"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                className={cn(
                  "h-4",
                  colIndex === 0 ? "w-3/4" : "w-full"
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * SkeletonList - List skeleton loader
 */
interface SkeletonListProps extends React.HTMLAttributes<HTMLDivElement> {
  items?: number
  showAvatar?: boolean
}

export function SkeletonList({ 
  className, 
  items = 5, 
  showAvatar = false,
  ...props 
}: SkeletonListProps) {
  return (
    <div
      className={cn(
        "space-y-4",
        className
      )}
      {...props}
    >
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 rounded-lg border bg-card"
        >
          {showAvatar && <Skeleton className="h-10 w-10 rounded-full" />}
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * ProgressIndicator - Progress bar for long operations
 */
interface ProgressIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  progress?: number
  label?: string
  showPercentage?: boolean
}

export function ProgressIndicator({
  className,
  progress = 0,
  label,
  showPercentage = true,
  ...props
}: ProgressIndicatorProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100)

  return (
    <div
      className={cn("space-y-2", className)}
      role="progressbar"
      aria-valuenow={clampedProgress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label || "Progress"}
      {...props}
    >
      {label && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          {showPercentage && (
            <span className="font-medium">{Math.round(clampedProgress)}%</span>
          )}
        </div>
      )}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all duration-300 ease-in-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  )
}

/**
 * LoadingOverlay - Full page or container loading overlay
 */
interface LoadingOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  isLoading: boolean
  text?: string
  children?: React.ReactNode
}

export function LoadingOverlay({
  isLoading,
  text,
  children,
  className,
  ...props
}: LoadingOverlayProps) {
  if (!isLoading) {
    return <>{children}</>
  }

  return (
    <div
      className={cn(
        "relative flex items-center justify-center min-h-[200px]",
        className
      )}
      {...props}
    >
      {children && (
        <div className="absolute inset-0 opacity-50 pointer-events-none">
          {children}
        </div>
      )}
      <div className="relative z-10">
        <LoadingSpinner size="lg" text={text} />
      </div>
    </div>
  )
}

