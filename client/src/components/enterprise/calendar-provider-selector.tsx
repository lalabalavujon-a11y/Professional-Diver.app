/**
 * Calendar Provider Selector Component
 * Allows users to select and configure a calendar provider
 */

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

interface CalendarProvider {
  provider: string;
  name: string;
  description: string;
  requiresOAuth: boolean;
  requiredFields: string[];
  optionalFields: string[];
}

interface CalendarProviderSelectorProps {
  providers: CalendarProvider[];
  selectedProvider: string | null;
  onSelectProvider: (provider: string | null) => void;
  onConnect: (provider: string, config: any) => void;
  onClose: () => void;
}

export default function CalendarProviderSelector({
  providers,
  selectedProvider,
  onSelectProvider,
  onConnect,
  onClose,
}: CalendarProviderSelectorProps) {
  const [connectionName, setConnectionName] = useState("");
  const [calendarId, setCalendarId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [locationId, setLocationId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentProvider = providers.find(p => p.provider === selectedProvider);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider || !currentProvider) return;

    setIsSubmitting(true);

    try {
      const config: any = {
        connectionName: connectionName || currentProvider.name,
      };

      // Provider-specific configuration
      if (selectedProvider === 'google') {
        if (calendarId) {
          config.calendarId = calendarId;
        }
      } else if (selectedProvider === 'highlevel') {
        config.providerConfig = {
          apiKey,
          locationId,
        };
        if (calendarId) {
          config.calendarId = calendarId;
        }
      } else if (selectedProvider === 'calendly') {
        config.providerConfig = {
          accountId,
        };
      }

      onConnect(selectedProvider, config);
    } catch (error) {
      console.error('Error connecting calendar:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Calendar Connection</DialogTitle>
          <DialogDescription>
            Connect a calendar system to sync events with your unified calendar
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Provider Selection */}
          <div>
            <Label htmlFor="provider">Calendar Provider</Label>
            <Select value={selectedProvider || ""} onValueChange={onSelectProvider}>
              <SelectTrigger id="provider">
                <SelectValue placeholder="Select a calendar provider" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((provider) => (
                  <SelectItem key={provider.provider} value={provider.provider}>
                    {provider.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentProvider && (
              <p className="text-sm text-muted-foreground mt-2">
                {currentProvider.description}
              </p>
            )}
          </div>

          {selectedProvider && currentProvider && (
            <>
              {/* Connection Name */}
              <div>
                <Label htmlFor="connectionName">Connection Name</Label>
                <Input
                  id="connectionName"
                  value={connectionName}
                  onChange={(e) => setConnectionName(e.target.value)}
                  placeholder={currentProvider.name}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Give this connection a friendly name (optional)
                </p>
              </div>

              {/* Google Calendar Configuration */}
              {selectedProvider === 'google' && (
                <div>
                  <Label htmlFor="calendarId">Calendar ID (Optional)</Label>
                  <Input
                    id="calendarId"
                    value={calendarId}
                    onChange={(e) => setCalendarId(e.target.value)}
                    placeholder="primary (default) or specific calendar ID"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Leave empty to use your primary calendar. Find Calendar ID in Google Calendar settings.
                  </p>
                  <Alert className="mt-4">
                    <AlertDescription>
                      You will be redirected to Google to authorize calendar access after clicking "Connect".
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* HighLevel Configuration */}
              {selectedProvider === 'highlevel' && (
                <>
                  <div>
                    <Label htmlFor="apiKey">API Key *</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Enter your GoHighLevel API Key"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="locationId">Location ID *</Label>
                    <Input
                      id="locationId"
                      value={locationId}
                      onChange={(e) => setLocationId(e.target.value)}
                      placeholder="Enter your GoHighLevel Location ID"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="calendarId">Calendar ID (Optional)</Label>
                    <Input
                      id="calendarId"
                      value={calendarId}
                      onChange={(e) => setCalendarId(e.target.value)}
                      placeholder="Specific calendar ID (optional)"
                    />
                  </div>
                </>
              )}

              {/* Calendly Configuration */}
              {selectedProvider === 'calendly' && (
                <div>
                  <Label htmlFor="accountId">Calendly Account ID</Label>
                  <Input
                    id="accountId"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    placeholder="Enter your Calendly Account ID"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Found in your Calendly account settings
                  </p>
                </div>
              )}

              {/* Other providers - generic config */}
              {!['google', 'highlevel', 'calendly'].includes(selectedProvider) && (
                <Alert>
                  <AlertDescription>
                    Configuration for {currentProvider.name} will be available soon.
                    Contact support for assistance with custom calendar integrations.
                  </AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    'Connect'
                  )}
                </Button>
              </div>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
