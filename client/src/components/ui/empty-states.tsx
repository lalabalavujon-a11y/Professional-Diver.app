import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  AlertCircle,
  FileSearch,
  Inbox,
  RefreshCw,
  Search,
  FolderX,
  AlertTriangle,
  WifiOff,
  ServerCrash,
  type LucideIcon,
} from "lucide-react"

/**
 * EmptyState - Generic empty state component
 */
interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    loading?: boolean
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  secondaryAction,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
      role="status"
      aria-live="polite"
      {...props}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Icon className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mb-6 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="flex gap-3">
          {action && (
            <Button
              onClick={action.onClick}
              disabled={action.loading}
              aria-label={action.label}
            >
              {action.loading && (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              )}
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="outline"
              onClick={secondaryAction.onClick}
              aria-label={secondaryAction.label}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * ErrorState - Error state component with retry
 */
interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  error?: Error | string
  onRetry?: () => void
  retryLoading?: boolean
}

export function ErrorState({
  title = "Something went wrong",
  description,
  error,
  onRetry,
  retryLoading = false,
  className,
  ...props
}: ErrorStateProps) {
  const errorMessage =
    error instanceof Error ? error.message : error || description

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
      role="alert"
      aria-live="assertive"
      {...props}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      {errorMessage && (
        <p className="mb-6 max-w-sm text-sm text-muted-foreground">
          {errorMessage}
        </p>
      )}
      {onRetry && (
        <Button
          onClick={onRetry}
          disabled={retryLoading}
          variant="outline"
          aria-label="Retry"
        >
          {retryLoading && (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          )}
          Try Again
        </Button>
      )}
    </div>
  )
}

/**
 * NotFoundState - Not found / no results state
 */
interface NotFoundStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  searchQuery?: string
  onClearSearch?: () => void
}

export function NotFoundState({
  title = "No results found",
  description,
  searchQuery,
  onClearSearch,
  className,
  ...props
}: NotFoundStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
      role="status"
      aria-live="polite"
      {...props}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Search className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">
        {searchQuery ? `No results for "${searchQuery}"` : title}
      </h3>
      {description && (
        <p className="mb-6 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {onClearSearch && searchQuery && (
        <Button variant="outline" onClick={onClearSearch}>
          Clear search
        </Button>
      )}
    </div>
  )
}

/**
 * NoDataState - No data available state
 */
interface NoDataStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function NoDataState({
  title = "No data available",
  description = "There is no data to display at this time.",
  action,
  className,
  ...props
}: NoDataStateProps) {
  return (
    <EmptyState
      icon={FileSearch}
      title={title}
      description={description}
      action={action}
      className={className}
      {...props}
    />
  )
}

/**
 * OfflineState - Offline/network error state
 */
interface OfflineStateProps extends React.HTMLAttributes<HTMLDivElement> {
  onRetry?: () => void
  retryLoading?: boolean
}

export function OfflineState({
  onRetry,
  retryLoading = false,
  className,
  ...props
}: OfflineStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
      role="alert"
      aria-live="assertive"
      {...props}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warning/10">
        <WifiOff className="h-8 w-8 text-warning-600" aria-hidden="true" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">No internet connection</h3>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">
        Please check your connection and try again.
      </p>
      {onRetry && (
        <Button
          onClick={onRetry}
          disabled={retryLoading}
          variant="outline"
          aria-label="Retry connection"
        >
          {retryLoading && (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          )}
          Retry
        </Button>
      )}
    </div>
  )
}

/**
 * ServerErrorState - Server error state
 */
interface ServerErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  onRetry?: () => void
  retryLoading?: boolean
}

export function ServerErrorState({
  onRetry,
  retryLoading = false,
  className,
  ...props
}: ServerErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
      role="alert"
      aria-live="assertive"
      {...props}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <ServerCrash className="h-8 w-8 text-destructive" aria-hidden="true" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">Server error</h3>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">
        We're experiencing technical difficulties. Please try again later.
      </p>
      {onRetry && (
        <Button
          onClick={onRetry}
          disabled={retryLoading}
          variant="outline"
          aria-label="Retry"
        >
          {retryLoading && (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          )}
          Try Again
        </Button>
      )}
    </div>
  )
}

/**
 * WarningState - Warning state with icon
 */
interface WarningStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function WarningState({
  title,
  description,
  action,
  className,
  ...props
}: WarningStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
      role="status"
      aria-live="polite"
      {...props}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warning/10">
        <AlertTriangle className="h-8 w-8 text-warning-600" aria-hidden="true" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mb-6 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick} variant="outline">
          {action.label}
        </Button>
      )}
    </div>
  )
}

