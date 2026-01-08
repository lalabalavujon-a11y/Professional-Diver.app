import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Phone,
  MessageSquare,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  ArrowDown,
  ArrowUp,
} from "lucide-react";

interface Communication {
  id: string;
  clientId: string;
  type: "email" | "phone" | "sms" | "whatsapp" | "note";
  direction: "inbound" | "outbound";
  subject?: string | null;
  content: string;
  status: "sent" | "delivered" | "read" | "failed" | "answered" | "missed";
  duration?: number | null;
  metadata?: string | null;
  createdAt: number;
}

interface CommunicationTimelineProps {
  clientId: string;
  limit?: number;
}

function getCommunicationIcon(type: string, direction: string) {
  const iconClass = "w-4 h-4";
  const isInbound = direction === "inbound";

  switch (type) {
    case "email":
      return <Mail className={iconClass} />;
    case "phone":
      return <Phone className={iconClass} />;
    case "sms":
    case "whatsapp":
      return <MessageSquare className={iconClass} />;
    case "note":
      return <FileText className={iconClass} />;
    default:
      return <MessageSquare className={iconClass} />;
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "read":
    case "answered":
      return <CheckCircle className="w-3 h-3 text-green-600" />;
    case "delivered":
      return <CheckCircle className="w-3 h-3 text-blue-600" />;
    case "failed":
    case "missed":
      return <XCircle className="w-3 h-3 text-red-600" />;
    case "sent":
      return <Clock className="w-3 h-3 text-yellow-600" />;
    default:
      return null;
  }
}

function getTypeColor(type: string) {
  switch (type) {
    case "email":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "phone":
      return "bg-green-100 text-green-800 border-green-200";
    case "sms":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "whatsapp":
      return "bg-green-100 text-green-800 border-green-200";
    case "note":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

function formatDate(timestamp: number) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export default function CommunicationTimeline({ clientId, limit }: CommunicationTimelineProps) {
  const { data, isLoading } = useQuery<{ success: boolean; communications: Communication[] }>({
    queryKey: [`/api/clients/${clientId}/communications`, limit],
    queryFn: async () => {
      const url = limit
        ? `/api/clients/${clientId}/communications?limit=${limit}`
        : `/api/clients/${clientId}/communications`;
      const response = await apiRequest("GET", url);
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-slate-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const communications = data?.communications || [];

  if (communications.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-slate-500">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p>No communications yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {communications.map((comm) => {
        const metadata = comm.metadata ? JSON.parse(comm.metadata) : {};
        const isInbound = comm.direction === "inbound";

        return (
          <Card key={comm.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div
                    className={`mt-0.5 p-2 rounded-full ${
                      isInbound ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"
                    }`}
                  >
                    {getCommunicationIcon(comm.type, comm.direction)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge
                        variant="outline"
                        className={`text-xs ${getTypeColor(comm.type)}`}
                      >
                        {comm.type.charAt(0).toUpperCase() + comm.type.slice(1)}
                      </Badge>
                      {isInbound ? (
                        <ArrowDown className="w-3 h-3 text-blue-600" />
                      ) : (
                        <ArrowUp className="w-3 h-3 text-green-600" />
                      )}
                      <span className="text-xs text-slate-500">
                        {comm.direction === "inbound" ? "Inbound" : "Outbound"}
                      </span>
                      {getStatusIcon(comm.status)}
                    </div>

                    {comm.subject && (
                      <h4 className="font-semibold text-slate-900 mb-1">{comm.subject}</h4>
                    )}

                    <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">
                      {comm.content}
                    </p>

                    {comm.duration && (
                      <p className="text-xs text-slate-500 mt-1">
                        Duration: {Math.floor(comm.duration / 60)}m {comm.duration % 60}s
                      </p>
                    )}

                    {metadata.phoneNumber && (
                      <p className="text-xs text-slate-500 mt-1">
                        {metadata.phoneNumber}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-xs text-slate-500 ml-4">
                  {formatDate(comm.createdAt)}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

