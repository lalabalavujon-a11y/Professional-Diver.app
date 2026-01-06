import { useState, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";

interface CollapsibleContainerProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  defaultCollapsed?: boolean;
  className?: string;
  headerClassName?: string;
}

export function CollapsibleContainer({
  title,
  description,
  icon,
  children,
  defaultCollapsed = true,
  className = "",
  headerClassName = "",
}: CollapsibleContainerProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card
      className={`transition-all duration-300 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className={`${headerClassName}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {icon && <div>{icon}</div>}
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              {description && isHovered && (
                <p className="text-sm text-slate-600 mt-1">{description}</p>
              )}
            </div>
          </div>
          {!isHovered ? (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </CardHeader>
      {isHovered && (
        <CardContent className="transition-all duration-300">
          <div className="opacity-100 transition-opacity duration-300">
            {children}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

