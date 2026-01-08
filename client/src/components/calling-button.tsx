import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  Phone,
  Video,
  MessageCircle,
  Loader2,
  VideoOff,
  PhoneCall,
} from "lucide-react";
import {
  initiateCall,
  getCallingPreferences,
  getAvailableProviders,
  openCallUrl,
  type CallingProvider,
  type CallOptions,
} from "@/services/calling-service";

interface CallingButtonProps {
  phoneNumber?: string;
  email?: string;
  name?: string;
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showLabel?: boolean;
  defaultProvider?: CallingProvider;
}

export default function CallingButton({
  phoneNumber,
  email,
  name,
  variant = "default",
  size = "default",
  className,
  showLabel = true,
  defaultProvider,
}: CallingButtonProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState<any>(null);
  const [availableProviders, setAvailableProviders] = useState<CallingProvider[]>([]);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    const prefs = await getCallingPreferences();
    setPreferences(prefs);
    if (prefs) {
      setAvailableProviders(getAvailableProviders(prefs));
    } else {
      // Default providers if no preferences
      setAvailableProviders(['google-meet', 'zoom', 'phone']);
    }
  };

  const handleCall = async (provider: CallingProvider) => {
    setIsLoading(true);
    try {
      const options: CallOptions = {
        provider,
        phoneNumber,
        email,
        name,
        video: provider !== 'phone' && provider !== 'facetime',
      };

      const result = await initiateCall(provider, options);

      if (result.success) {
        if (result.url) {
          openCallUrl(result.url, provider);
          toast({
            title: "Call initiated",
            description: `Starting ${provider} call...`,
          });
        } else if (result.token) {
          // For Twilio, we need to initialize the call with the token
          // This would typically use Twilio Client SDK
          toast({
            title: "Phone call ready",
            description: "Use the Twilio client to make the call",
          });
        }
      } else {
        toast({
          title: "Call failed",
          description: result.error || "Failed to initiate call",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to initiate call",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getProviderLabel = (provider: CallingProvider): string => {
    switch (provider) {
      case 'google-meet':
        return 'Google Meet';
      case 'facetime':
        return 'FaceTime';
      case 'zoom':
        return 'Zoom';
      case 'phone':
        return 'Phone Call';
      default:
        return provider;
    }
  };

  const getProviderIcon = (provider: CallingProvider) => {
    switch (provider) {
      case 'google-meet':
      case 'zoom':
        return <Video className="w-4 h-4" />;
      case 'facetime':
        return <Video className="w-4 h-4" />;
      case 'phone':
        return <PhoneCall className="w-4 h-4" />;
      default:
        return <Phone className="w-4 h-4" />;
    }
  };

  // Filter available providers based on what data we have
  const filteredProviders = availableProviders.filter((provider) => {
    if (provider === 'phone' || provider === 'facetime') {
      return phoneNumber || email;
    }
    return true;
  });

  if (filteredProviders.length === 0) {
    return null;
  }

  // If only one provider and defaultProvider is set, show direct button
  if (filteredProviders.length === 1 && defaultProvider && filteredProviders.includes(defaultProvider)) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => handleCall(defaultProvider)}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          getProviderIcon(defaultProvider)
        )}
        {showLabel && `Call via ${getProviderLabel(defaultProvider)}`}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Phone className="w-4 h-4 mr-2" />
          )}
          {showLabel && "Call"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Choose calling method</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {filteredProviders.map((provider) => (
          <DropdownMenuItem
            key={provider}
            onClick={() => handleCall(provider)}
            disabled={isLoading}
          >
            {getProviderIcon(provider)}
            <span className="ml-2">{getProviderLabel(provider)}</span>
          </DropdownMenuItem>
        ))}
        {filteredProviders.length === 0 && (
          <DropdownMenuItem disabled>
            No calling options available
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}



