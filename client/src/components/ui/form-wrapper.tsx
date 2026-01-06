import * as React from "react"
import { useForm, UseFormReturn, FieldValues } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

export interface FormWrapperProps<T extends FieldValues> {
  schema: z.ZodType<T>
  defaultValues?: Partial<T>
  onSubmit: (data: T) => void | Promise<void>
  children: (form: UseFormReturn<T>) => React.ReactNode
  className?: string
  submitLabel?: string
  showCancel?: boolean
  onCancel?: () => void
  isLoading?: boolean
  autoSave?: boolean
  autoSaveDelay?: number
}

/**
 * FormWrapper - Standardized form wrapper with validation, error handling, and auto-save
 */
export function FormWrapper<T extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  children,
  className,
  submitLabel = "Submit",
  showCancel = false,
  onCancel,
  isLoading = false,
  autoSave = false,
  autoSaveDelay = 2000,
}: FormWrapperProps<T>) {
  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as T,
    mode: "onChange", // Real-time validation
  })

  const [autoSaveStatus, setAutoSaveStatus] = React.useState<"idle" | "saving" | "saved">("idle")
  const autoSaveTimeoutRef = React.useRef<NodeJS.Timeout>()

  // Auto-save functionality
  React.useEffect(() => {
    if (!autoSave) return

    const subscription = form.watch(() => {
      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }

      // Set auto-save status to saving
      setAutoSaveStatus("saving")

      // Debounce auto-save
      autoSaveTimeoutRef.current = setTimeout(async () => {
        try {
          const values = form.getValues()
          if (form.formState.isDirty) {
            await onSubmit(values)
            setAutoSaveStatus("saved")
            
            // Reset to idle after 2 seconds
            setTimeout(() => setAutoSaveStatus("idle"), 2000)
          }
        } catch (error) {
          setAutoSaveStatus("idle")
        }
      }, autoSaveDelay)
    })

    return () => {
      subscription.unsubscribe()
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [autoSave, autoSaveDelay, form, onSubmit])

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await onSubmit(data)
    } catch (error) {
      // Error handling is done by the parent component
      console.error("Form submission error:", error)
    }
  })

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
        {children(form)}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {autoSave && autoSaveStatus === "saving" && (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            )}
            {autoSave && autoSaveStatus === "saved" && (
              <span className="text-success-600">Saved</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {showCancel && onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isLoading || (autoSave && autoSaveStatus === "saving")}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitLabel}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  )
}

/**
 * Standardized form field components with consistent styling and accessibility
 */
export function FormFieldWrapper<T extends FieldValues>({
  form,
  name,
  label,
  description,
  required,
  children,
  className,
}: {
  form: UseFormReturn<T>
  name: keyof T
  label: string
  description?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <FormField
      control={form.control}
      name={name as any}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </FormLabel>
          <FormControl>{children}</FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

