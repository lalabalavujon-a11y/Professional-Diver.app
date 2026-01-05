import { ReactNode } from "react";
import RoleBasedNavigation from "./role-based-navigation";
import { SidebarInset } from "./ui/sidebar";

interface AppLayoutProps {
  children: ReactNode;
}

/**
 * AppLayout component that provides proper spacing for sidebar and header
 * Pages should wrap their content in this component instead of directly using RoleBasedNavigation
 */
export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <>
      <RoleBasedNavigation />
      <div 
        className="min-h-screen md:ml-[var(--sidebar-width,16rem)] ml-0 pt-16 md:pt-16 transition-all duration-200 ease-linear"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-5 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          {children}
        </div>
      </div>
    </>
  );
}
