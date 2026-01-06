import * as React from "react"
import { useLocation } from "wouter"
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import {
  Search,
  Home,
  BarChart3,
  Users,
  Shield,
  Settings,
  FileText,
  BookOpen,
  Wrench,
  Calendar,
  Package,
  HeartPulse,
  TrendingUp,
  type LucideIcon,
} from "lucide-react"

interface CommandMenuAction {
  id: string
  label: string
  keywords?: string[]
  icon: LucideIcon
  action: () => void
  group?: string
}

interface CommandMenuProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  actions?: CommandMenuAction[]
}

/**
 * CommandMenu - Command palette for keyboard-driven navigation (Cmd/Ctrl + K)
 */
export function CommandMenu({ open, onOpenChange, actions }: CommandMenuProps) {
  const [location, setLocation] = useLocation()
  const [query, setQuery] = React.useState("")

  // Default navigation actions
  const defaultActions: CommandMenuAction[] = [
    { id: "home", label: "Home", keywords: ["home", "dashboard"], icon: Home, action: () => setLocation("/home"), group: "Navigation" },
    { id: "dashboard", label: "Dashboard", keywords: ["dashboard", "main"], icon: Home, action: () => setLocation("/dashboard"), group: "Navigation" },
    { id: "tracks", label: "Learning Tracks", keywords: ["tracks", "courses", "lessons"], icon: BookOpen, action: () => setLocation("/tracks"), group: "Learning" },
    { id: "exams", label: "Professional Exams", keywords: ["exams", "test", "assessment"], icon: FileText, action: () => setLocation("/exams"), group: "Learning" },
    { id: "analytics", label: "Analytics", keywords: ["analytics", "stats", "metrics"], icon: TrendingUp, action: () => setLocation("/analytics"), group: "Admin" },
    { id: "crm", label: "CRM Dashboard", keywords: ["crm", "clients", "customers"], icon: Users, action: () => setLocation("/crm"), group: "Admin" },
    { id: "admin", label: "Admin Dashboard", keywords: ["admin", "management"], icon: Shield, action: () => setLocation("/admin"), group: "Admin" },
    { id: "operations", label: "Operations", keywords: ["operations", "ops"], icon: Wrench, action: () => setLocation("/operations"), group: "Operations" },
    { id: "equipment", label: "Equipment", keywords: ["equipment", "tools"], icon: Package, action: () => setLocation("/equipment"), group: "Operations" },
    { id: "settings", label: "Settings", keywords: ["settings", "preferences", "config"], icon: Settings, action: () => setLocation("/profile-settings"), group: "Account" },
  ]

  const allActions = actions ? [...defaultActions, ...actions] : defaultActions

  // Filter actions based on search query
  const filteredActions = React.useMemo(() => {
    if (!query) return allActions

    const lowerQuery = query.toLowerCase()
    return allActions.filter((action) => {
      const matchesLabel = action.label.toLowerCase().includes(lowerQuery)
      const matchesKeywords = action.keywords?.some((keyword) =>
        keyword.toLowerCase().includes(lowerQuery)
      )
      return matchesLabel || matchesKeywords
    })
  }, [query, allActions])

  // Group actions
  const groupedActions = React.useMemo(() => {
    const groups: Record<string, CommandMenuAction[]> = {}
    filteredActions.forEach((action) => {
      const group = action.group || "Other"
      if (!groups[group]) {
        groups[group] = []
      }
      groups[group].push(action)
    })
    return groups
  }, [filteredActions])

  const handleSelect = (action: CommandMenuAction) => {
    action.action()
    onOpenChange?.(false)
    setQuery("")
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Type to search..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {Object.entries(groupedActions).map(([groupName, groupActions]) => (
          <CommandGroup key={groupName} heading={groupName}>
            {groupActions.map((action) => {
              const Icon = action.icon
              return (
                <CommandItem
                  key={action.id}
                  value={`${action.id}-${action.label}`}
                  onSelect={() => handleSelect(action)}
                  className="cursor-pointer"
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{action.label}</span>
                </CommandItem>
              )
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  )
}

/**
 * useCommandMenu - Hook to open command menu with keyboard shortcut
 */
export function useCommandMenu() {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
      if (e.key === "Escape") {
        setOpen(false)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return { open, setOpen }
}

