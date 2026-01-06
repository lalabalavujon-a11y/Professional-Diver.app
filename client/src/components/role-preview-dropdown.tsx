import { useState } from "react";
import { Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface RolePreviewDropdownProps {
  currentRole: string;
}

/**
 * Role Preview Dropdown Component
 * Allows SUPER_ADMIN to preview what different roles see
 */
export default function RolePreviewDropdown({ currentRole }: RolePreviewDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Only show for SUPER_ADMIN
  if (currentRole !== "SUPER_ADMIN") {
    return null;
  }

  const previewRoles = [
    { value: "USER", label: "User" },
    { value: "AFFILIATE", label: "Partner Admin" },
    { value: "ENTERPRISE", label: "Enterprise User" },
  ];

  const handlePreview = (role: string) => {
    // Get current URL
    const currentUrl = new URL(window.location.href);
    
    // Add preview role query parameter
    currentUrl.searchParams.set("previewRole", role);
    
    // Open in new tab
    window.open(currentUrl.toString(), "_blank");
    
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start text-xs"
          title="Preview different role views"
        >
          <Eye className="w-3 h-3 mr-2" />
          <span className="group-data-[collapsible=icon]:hidden">Role Preview</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-xs">Preview as:</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {previewRoles.map((role) => (
          <DropdownMenuItem
            key={role.value}
            onClick={() => handlePreview(role.value)}
            className="cursor-pointer"
          >
            <Eye className="w-4 h-4 mr-2" />
            <span>{role.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


