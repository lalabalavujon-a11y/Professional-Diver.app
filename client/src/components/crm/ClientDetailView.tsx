import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import TagManager from "./TagManager";
import CommunicationTimeline from "./CommunicationTimeline";
import CommunicationComposer from "./CommunicationComposer";
import EnhancedCallingButton from "./EnhancedCallingButton";
import {
  Mail,
  Phone,
  MessageSquare,
  FileText,
  X,
  User,
  Calendar,
  DollarSign,
} from "lucide-react";

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subscription_type?: string;
  subscriptionType?: string;
  status: string;
  subscription_date?: string;
  subscriptionDate?: number | string;
  monthly_revenue?: number;
  monthlyRevenue?: number;
  notes?: string;
  created_at?: string;
  createdAt?: number;
}

interface ClientDetailViewProps {
  client: Client;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

function getStatusColor(status: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-800";
    case "PAUSED":
      return "bg-yellow-100 text-yellow-800";
    case "CANCELLED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function formatDate(timestamp: number | string | undefined) {
  if (!timestamp) return "N/A";
  const date = typeof timestamp === "string" ? new Date(timestamp) : new Date(timestamp);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getSubscriptionType(client: Client): string {
  return client.subscription_type || client.subscriptionType || "TRIAL";
}

function getSubscriptionDate(client: Client): number | string {
  if (client.subscriptionDate) {
    return typeof client.subscriptionDate === "string" ? client.subscriptionDate : client.subscriptionDate;
  }
  if (client.subscription_date) {
    return client.subscription_date;
  }
  return Date.now();
}

function getMonthlyRevenue(client: Client): number {
  return client.monthly_revenue || client.monthlyRevenue || 0;
}

export default function ClientDetailView({
  client,
  isOpen,
  onClose,
  onUpdate,
}: ClientDetailViewProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const { data: statsData } = useQuery<{ success: boolean; stats: any }>({
    queryKey: [`/api/clients/${client.id}/communications/stats`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/clients/${client.id}/communications/stats`);
      return response.json();
    },
    enabled: isOpen,
  });

  const stats = statsData?.stats;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">{client.name}</DialogTitle>
              <p className="text-sm text-slate-500 mt-1">{client.email}</p>
            </div>
            <div className="flex items-center space-x-2">
              <EnhancedCallingButton
                clientId={client.id}
                phoneNumber={client.phone}
                email={client.email}
                name={client.name}
                variant="outline"
                size="sm"
              />
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="communications">Communications</TabsTrigger>
            <TabsTrigger value="tags">Tags</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">
                    Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className={getStatusColor(client.status)}>
                    {client.status}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">
                    Subscription
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold">{getSubscriptionType(client)}</div>
                  <div className="text-xs text-slate-500">
                    ${(getMonthlyRevenue(client) / 100).toFixed(2)}/mo
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center">
                    <Mail className="w-3 h-3 mr-1" />
                    Email
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <a
                    href={`mailto:${client.email}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {client.email}
                  </a>
                </CardContent>
              </Card>

              {client.phone && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600 flex items-center">
                      <Phone className="w-3 h-3 mr-1" />
                      Phone
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <a
                      href={`tel:${client.phone}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {client.phone}
                    </a>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    Member Since
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">{formatDate(getSubscriptionDate(client))}</div>
                </CardContent>
              </Card>

              {stats && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600">
                      Total Communications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.total || 0}</div>
                  </CardContent>
                </Card>
              )}
            </div>

            {client.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{client.notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="communications" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Communication History</h3>
              <div className="flex items-center space-x-2">
                <CommunicationComposer
                  clientId={client.id}
                  clientEmail={client.email}
                  clientPhone={client.phone}
                  clientName={client.name}
                  trigger={
                    <Button size="sm">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      New Message
                    </Button>
                  }
                />
              </div>
            </div>
            <CommunicationTimeline clientId={client.id} />
          </TabsContent>

          <TabsContent value="tags" className="space-y-4 mt-4">
            <TagManager clientId={client.id} />
          </TabsContent>

          <TabsContent value="notes" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Notes & Internal Comments</CardTitle>
              </CardHeader>
              <CardContent>
                <CommunicationComposer
                  clientId={client.id}
                  clientName={client.name}
                  defaultType="note"
                  trigger={
                    <Button>
                      <FileText className="w-4 h-4 mr-2" />
                      Add Note
                    </Button>
                  }
                />
                <div className="mt-4">
                  <CommunicationTimeline clientId={client.id} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

