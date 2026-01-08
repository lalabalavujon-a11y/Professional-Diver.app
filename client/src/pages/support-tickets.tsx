import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import RoleBasedNavigation from "@/components/role-based-navigation";
import {
  MessageSquare,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Mail,
  Calendar,
  User,
  FileText,
  RefreshCw,
} from "lucide-react";

const supportTicketSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
});

type SupportTicketForm = z.infer<typeof supportTicketSchema>;

interface SupportTicket {
  id: string;
  ticketId: string;
  userId: string | null;
  email: string;
  name: string;
  subject: string;
  message: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed" | "closed" | "cancelled";
  assignedTo: string | null;
  assignedToLaura: boolean;
  response: string | null;
  resolvedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case "urgent":
      return "bg-red-100 text-red-800 border-red-200";
    case "high":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "medium":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "low":
      return "bg-blue-100 text-blue-800 border-blue-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "completed":
    case "closed":
      return "bg-green-100 text-green-800 border-green-200";
    case "in_progress":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "cancelled":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "completed":
    case "closed":
      return <CheckCircle className="w-4 h-4" />;
    case "in_progress":
      return <Clock className="w-4 h-4" />;
    case "pending":
      return <Clock className="w-4 h-4" />;
    case "cancelled":
      return <XCircle className="w-4 h-4" />;
    default:
      return <AlertCircle className="w-4 h-4" />;
  }
}

export default function SupportTickets() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string>(() => {
    return localStorage.getItem("userEmail") || "";
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<SupportTicketForm>({
    resolver: zodResolver(supportTicketSchema),
    defaultValues: {
      name: "",
      email: userEmail || "",
      subject: "",
      message: "",
      priority: "medium",
    },
  });

  // Fetch user's tickets (filter by email)
  const { data: ticketsData, isLoading } = useQuery<{ success: boolean; tickets: SupportTicket[]; count: number }>({
    queryKey: ["/api/support/tickets", userEmail],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/support/tickets");
      const data = await response.json();
      // Filter tickets by user's email client-side
      if (userEmail && data.tickets) {
        data.tickets = data.tickets.filter((ticket: SupportTicket) => 
          ticket.email.toLowerCase() === userEmail.toLowerCase()
        );
        data.count = data.tickets.length;
      }
      return data;
    },
    enabled: !!userEmail,
  });

  const createTicketMutation = useMutation({
    mutationFn: async (data: SupportTicketForm) => {
      const response = await apiRequest("POST", "/api/support/ticket", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Ticket Created Successfully",
        description: `Your support ticket ${data.ticketId} has been created. You will receive a confirmation email shortly.`,
      });
      form.reset();
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/support/tickets"] });
      // Update user email if provided
      if (data.email && !userEmail) {
        setUserEmail(data.email);
        localStorage.setItem("userEmail", data.email);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Ticket",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SupportTicketForm) => {
    createTicketMutation.mutate(data);
  };

  const tickets = ticketsData?.tickets || [];
  const pendingTickets = tickets.filter((t) => t.status === "pending");
  const inProgressTickets = tickets.filter((t) => t.status === "in_progress");
  const completedTickets = tickets.filter((t => t.status === "completed" || t.status === "closed"));

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <RoleBasedNavigation />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 pt-20" data-sidebar-content="true">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Support Tickets</h1>
              <p className="text-slate-600">View and manage your support requests</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  New Ticket
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Create Support Ticket</DialogTitle>
                  <DialogDescription>
                    Submit a new support request. We'll respond as soon as possible.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      {...form.register("name")}
                      placeholder="Your full name"
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...form.register("email")}
                      placeholder="your.email@example.com"
                    />
                    {form.formState.errors.email && (
                      <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      {...form.register("subject")}
                      placeholder="Brief description of your issue"
                    />
                    {form.formState.errors.subject && (
                      <p className="text-sm text-red-600">{form.formState.errors.subject.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={form.watch("priority")}
                      onValueChange={(value) => form.setValue("priority", value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      {...form.register("message")}
                      placeholder="Describe your issue in detail..."
                      rows={6}
                    />
                    {form.formState.errors.message && (
                      <p className="text-sm text-red-600">{form.formState.errors.message.message}</p>
                    )}
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createTicketMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {createTicketMutation.isPending ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Submit Ticket
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {!userEmail && (
            <Card className="mb-6 border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <p className="text-blue-900">
                  <strong>Note:</strong> To view your existing tickets, please enter your email address or create a ticket.
                  Tickets are associated with your email address.
                </p>
              </CardContent>
            </Card>
          )}

          {isLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
              <p className="text-slate-600">Loading tickets...</p>
            </div>
          ) : tickets.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <MessageSquare className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No Tickets Found</h3>
                <p className="text-slate-600 mb-6">
                  {userEmail
                    ? "You haven't created any support tickets yet."
                    : "Create your first support ticket to get started."}
                </p>
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Ticket
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All ({tickets.length})</TabsTrigger>
                <TabsTrigger value="pending">Pending ({pendingTickets.length})</TabsTrigger>
                <TabsTrigger value="in_progress">In Progress ({inProgressTickets.length})</TabsTrigger>
                <TabsTrigger value="completed">Completed ({completedTickets.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4 mt-6">
                {tickets.map((ticket) => (
                  <TicketCard key={ticket.id} ticket={ticket} formatDate={formatDate} />
                ))}
              </TabsContent>

              <TabsContent value="pending" className="space-y-4 mt-6">
                {pendingTickets.length > 0 ? (
                  pendingTickets.map((ticket) => (
                    <TicketCard key={ticket.id} ticket={ticket} formatDate={formatDate} />
                  ))
                ) : (
                  <Card>
                    <CardContent className="pt-12 pb-12 text-center">
                      <p className="text-slate-600">No pending tickets</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="in_progress" className="space-y-4 mt-6">
                {inProgressTickets.length > 0 ? (
                  inProgressTickets.map((ticket) => (
                    <TicketCard key={ticket.id} ticket={ticket} formatDate={formatDate} />
                  ))
                ) : (
                  <Card>
                    <CardContent className="pt-12 pb-12 text-center">
                      <p className="text-slate-600">No tickets in progress</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="completed" className="space-y-4 mt-6">
                {completedTickets.length > 0 ? (
                  completedTickets.map((ticket) => (
                    <TicketCard key={ticket.id} ticket={ticket} formatDate={formatDate} />
                  ))
                ) : (
                  <Card>
                    <CardContent className="pt-12 pb-12 text-center">
                      <p className="text-slate-600">No completed tickets</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          )}
        </main>
      </div>
    </>
  );
}

function TicketCard({ ticket, formatDate }: { ticket: SupportTicket; formatDate: (timestamp: number) => string }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <CardTitle className="text-lg">{ticket.subject}</CardTitle>
              <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                {ticket.priority}
              </Badge>
              <Badge variant="outline" className={getStatusColor(ticket.status)}>
                <span className="flex items-center space-x-1">
                  {getStatusIcon(ticket.status)}
                  <span>{ticket.status.replace("_", " ")}</span>
                </span>
              </Badge>
            </div>
            <CardDescription className="flex items-center space-x-4 text-sm">
              <span className="flex items-center">
                <Mail className="w-3 h-3 mr-1" />
                {ticket.ticketId}
              </span>
              <span className="flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                {formatDate(ticket.createdAt)}
              </span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex items-start space-x-2 text-sm text-slate-600">
              <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p className="whitespace-pre-wrap">{ticket.message}</p>
            </div>
          </div>

          {ticket.response && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <User className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-900">Response from Support</span>
                {ticket.assignedToLaura && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    Laura AI
                  </Badge>
                )}
              </div>
              <p className="text-sm text-blue-800 whitespace-pre-wrap">{ticket.response}</p>
              {ticket.resolvedAt && (
                <p className="text-xs text-blue-600 mt-2">
                  Resolved: {formatDate(ticket.resolvedAt)}
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

