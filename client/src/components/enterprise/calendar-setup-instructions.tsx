/**
 * Calendar Setup Instructions Component
 * Displays step-by-step instructions for connecting calendar providers
 */

import { useQuery } from "@tanstack/react-query";
import { LoadingSpinner } from "@/components/ui/loading-states";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ExternalLink, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CalendarSetupInstructionsProps {
  provider: string;
}

export default function CalendarSetupInstructions({ provider }: CalendarSetupInstructionsProps) {
  const { data, isLoading } = useQuery<{
    provider: any;
    instructions: {
      overview: string;
      prerequisites: string[];
      steps: Array<{
        step: number;
        title: string;
        description: string;
        details?: string[];
        codeExample?: string;
      }>;
      troubleshooting: Array<{ issue: string; solution: string }>;
      additionalResources?: Array<{ title: string; url: string }>;
    };
  }>({
    queryKey: [`/api/enterprise/calendar/instructions/${provider}`],
    queryFn: async () => {
      const response = await fetch(`/api/enterprise/calendar/instructions/${provider}`);
      if (!response.ok) throw new Error('Failed to fetch instructions');
      return response.json();
    },
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return <div>Instructions not available for this provider.</div>;
  }

  const { instructions } = data;

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{instructions.overview}</p>
        </CardContent>
      </Card>

      {/* Prerequisites */}
      {instructions.prerequisites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Prerequisites</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {instructions.prerequisites.map((prereq, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{prereq}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {instructions.steps.map((step) => (
            <div key={step.step} className="border-l-2 border-primary pl-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">Step {step.step}</Badge>
                <h4 className="font-medium">{step.title}</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
              {step.details && step.details.length > 0 && (
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                  {step.details.map((detail, idx) => (
                    <li key={idx}>{detail}</li>
                  ))}
                </ul>
              )}
              {step.codeExample && (
                <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-x-auto">
                  {step.codeExample}
                </pre>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      {instructions.troubleshooting.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {instructions.troubleshooting.map((item, idx) => (
              <Alert key={idx}>
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  <div className="font-medium mb-1">{item.issue}</div>
                  <div className="text-sm">{item.solution}</div>
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Additional Resources */}
      {instructions.additionalResources && instructions.additionalResources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {instructions.additionalResources.map((resource, idx) => (
                <a
                  key={idx}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  {resource.title}
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
