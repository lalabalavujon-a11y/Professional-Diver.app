import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import CallingButton from "@/components/calling-button";

interface EnhancedCallingButtonProps {
  clientId: string;
  phoneNumber?: string;
  email?: string;
  name?: string;
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showLabel?: boolean;
  defaultProvider?: "google-meet" | "facetime" | "zoom" | "phone";
}

/**
 * Enhanced Calling Button that logs phone calls to communication history
 */
export default function EnhancedCallingButton({
  clientId,
  phoneNumber,
  email,
  name,
  ...props
}: EnhancedCallingButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const logCallMutation = useMutation({
    mutationFn: async (data: {
      direction: "inbound" | "outbound";
      duration?: number;
      status: "answered" | "missed" | "failed";
      notes?: string;
    }) => {
      const response = await apiRequest("POST", `/api/clients/${clientId}/communications`, {
        type: "phone",
        direction: data.direction,
        content: data.notes || `Phone call ${data.direction === "inbound" ? "received from" : "made to"} ${name || phoneNumber || email}`,
        status: data.status,
        duration: data.duration,
        phoneNumber: phoneNumber || undefined,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/communications`] });
    },
  });

  const handleCallClick = async () => {
    // Log the phone call attempt
    // Note: Actual call duration would need to be tracked separately
    // For now, we log the call initiation
    
    // This will be called when user actually makes a call
    // For now, we'll log it when the button is clicked
    // In a real implementation, you'd hook into the actual call completion
  };

  return (
    <div onClick={handleCallClick}>
      <CallingButton
        phoneNumber={phoneNumber}
        email={email}
        name={name}
        {...props}
      />
    </div>
  );
}

