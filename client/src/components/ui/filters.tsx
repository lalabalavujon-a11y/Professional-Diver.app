import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Separator } from "@/components/ui/separator"
import {
  Filter,
  X,
  Search,
  CalendarIcon,
  Check,
  ChevronDown,
} from "lucide-react"
import { format } from "date-fns"

export interface FilterOption {
  label: string
  value: string
  icon?: React.ReactNode
}

export interface DateRangeFilter {
  from?: Date
  to?: Date
}

export interface FilterConfig {
  key: string
  label: string
  type: "select" | "multi-select" | "date-range" | "text" | "number"
  options?: FilterOption[]
  placeholder?: string
}

export interface AdvancedFiltersProps {
  filters: FilterConfig[]
  values: Record<string, any>
  onChange: (key: string, value: any) => void
  onReset?: () => void
  className?: string
}

/**
 * AdvancedFilters - Enterprise-grade filtering component
 */
export function AdvancedFilters({
  filters,
  values,
  onChange,
  onReset,
  className,
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const activeFiltersCount = Object.values(values).filter(
    (v) => v !== undefined && v !== null && v !== ""
  ).length

  const handleReset = () => {
    filters.forEach((filter) => onChange(filter.key, undefined))
    onReset?.()
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Filter className="mr-2 h-4 w-4" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-2 h-5 w-5 rounded-full p-0 text-xs"
            >
              {activeFiltersCount}
            </Badge>
          )}
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Filters</h4>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-8 text-xs"
              >
                Reset
              </Button>
            )}
          </div>
          <Separator />
          <div className="space-y-3">
            {filters.map((filter) => (
              <FilterField
                key={filter.key}
                filter={filter}
                value={values[filter.key]}
                onChange={(value) => {
                  onChange(filter.key, value)
                }}
              />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function FilterField({
  filter,
  value,
  onChange,
}: {
  filter: FilterConfig
  value: any
  onChange: (value: any) => void
}) {
  switch (filter.type) {
    case "select":
      return (
        <div className="space-y-2">
          <label className="text-sm font-medium">{filter.label}</label>
          <Select value={value || ""} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder={filter.placeholder || "Select..."} />
            </SelectTrigger>
            <SelectContent>
              {filter.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.icon && <span className="mr-2">{option.icon}</span>}
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )

    case "text":
      return (
        <div className="space-y-2">
          <label className="text-sm font-medium">{filter.label}</label>
          <Input
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={filter.placeholder || "Enter text..."}
          />
        </div>
      )

    case "number":
      return (
        <div className="space-y-2">
          <label className="text-sm font-medium">{filter.label}</label>
          <Input
            type="number"
            value={value || ""}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
            placeholder={filter.placeholder || "Enter number..."}
          />
        </div>
      )

    case "date-range":
      return (
        <div className="space-y-2">
          <label className="text-sm font-medium">{filter.label}</label>
          <DateRangePicker value={value} onChange={onChange} />
        </div>
      )

    default:
      return null
  }
}

function DateRangePicker({
  value,
  onChange,
}: {
  value?: DateRangeFilter
  onChange: (value: DateRangeFilter) => void
}) {
  const [date, setDate] = React.useState<DateRangeFilter | undefined>(value)

  React.useEffect(() => {
    if (date) {
      onChange(date)
    }
  }, [date, onChange])

  return (
    <div className="grid gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date?.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={{ from: date?.from, to: date?.to }}
            onSelect={(range) => setDate(range)}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

/**
 * SearchBar - Standardized search input with clear button
 */
export interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void
}

export function SearchBar({
  value,
  onClear,
  className,
  ...props
}: SearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        className={cn("pl-9 pr-9", className)}
        {...props}
      />
      {value && onClear && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
          onClick={onClear}
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

/**
 * ActiveFilters - Display active filter badges with remove functionality
 */
export interface ActiveFiltersProps {
  filters: Array<{
    key: string
    label: string
    value: string
  }>
  onRemove: (key: string) => void
  onClearAll?: () => void
}

export function ActiveFilters({
  filters,
  onRemove,
  onClearAll,
}: ActiveFiltersProps) {
  if (filters.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Active filters:</span>
      {filters.map((filter) => (
        <Badge
          key={filter.key}
          variant="secondary"
          className="gap-1 px-2 py-1"
        >
          <span className="text-xs">
            {filter.label}: {filter.value}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 hover:bg-transparent"
            onClick={() => onRemove(filter.key)}
            aria-label={`Remove ${filter.label} filter`}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
      {onClearAll && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs"
          onClick={onClearAll}
        >
          Clear all
        </Button>
      )}
    </div>
  )
}

