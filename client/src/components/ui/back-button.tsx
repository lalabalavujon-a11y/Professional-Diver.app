import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";

interface BackButtonProps {
  /** Fallback route if browser history is not available */
  fallbackRoute?: string;
  /** Custom label for the back button */
  label?: string;
  /** Additional className for styling */
  className?: string;
  /** Variant for the button */
  variant?: "default" | "outline" | "ghost" | "link";
}

/**
 * Reusable Back Button Component
 * 
 * Smart navigation that:
 * 1. Uses browser history if available
 * 2. Falls back to specified route if no history
 * 3. Provides consistent styling across the app
 */
export default function BackButton({
  fallbackRoute = "/",
  label = "Back",
  className = "",
  variant = "ghost"
}: BackButtonProps) {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    // Check if there's browser history
    if (window.history.length > 1) {
      // Try to go back in browser history
      window.history.back();
    } else {
      // Fallback to specified route or home
      setLocation(fallbackRoute);
    }
  };

  return (
    <Button
      onClick={handleBack}
      variant={variant}
      className={`flex items-center gap-2 ${className}`}
      data-testid="button-back"
    >
      <ChevronLeft className="w-4 h-4" />
      {label}
    </Button>
  );
}
