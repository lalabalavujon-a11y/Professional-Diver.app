import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import RoleBasedNavigation from "@/components/role-based-navigation";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileNotSupported } from "@/components/mobile-not-supported";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Copy, Plus, Trash2 } from "lucide-react";
import type { Invite } from "@shared/schema";

export default function AdminInvites() {
  const [email, setEmail] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invites, isLoading } = useQuery<Invite[]>({
    queryKey: ["/api/admin/invites"],
  });

  const createInviteMutation = useMutation({
    mutationFn: async (inviteData: { email: string; expiresAt: Date }) => {
      return apiRequest("POST", "/api/admin/invites", inviteData);
    },
    onSuccess: () => {
      toast({
        title: "Invite Created!",
        description: "The invitation has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invites"] });
      setEmail("");
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create invite. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteInviteMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      return apiRequest("DELETE", `/api/admin/invites/${inviteId}`, undefined);
    },
    onSuccess: () => {
      toast({
        title: "Invite Revoked",
        description: "The invitation has been revoked successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invites"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to revoke invite. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateInvite = () => {
    if (!email) return;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    createInviteMutation.mutate({
      email,
      expiresAt,
    });
  };

  const handleCopyInviteLink = (token: string) => {
    const inviteUrl = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(inviteUrl);
    toast({
      title: "Link Copied!",
      description: "The invite link has been copied to your clipboard.",
    });
  };

  const handleRevokeInvite = (inviteId: string) => {
    deleteInviteMutation.mutate(inviteId);
  };

  const isMobile = useIsMobile();

  // Show mobile-not-supported message on mobile devices
  if (isMobile) {
    return (
      <>
        <RoleBasedNavigation />
        <MobileNotSupported pageName="Admin Invites" />
      </>
    );
  }

  return (
    <>
      <RoleBasedNavigation />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50" data-sidebar-content="true">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900" data-testid="text-invites-title">
                  Manage Invitations
                </h2>
                <p className="text-sm text-slate-500">Create and manage user invitations</p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-primary-500 hover:bg-primary-600 text-white"
                    data-testid="button-create-invite"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Invite
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Create New Invite</DialogTitle>
                    <DialogDescription>
                      Send an invitation to a new user to join the platform.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="email" className="text-right">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="user@example.com"
                        className="col-span-3"
                        data-testid="input-email"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      onClick={handleCreateInvite}
                      disabled={!email || createInviteMutation.isPending}
                      data-testid="button-send-invite"
                    >
                      {createInviteMutation.isPending ? "Creating..." : "Create Invite"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : invites && invites.length > 0 ? (
              <div className="overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expires
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invites.map((invite: any) => (
                      <tr key={invite.id} data-testid={`invite-row-${invite.id}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-slate-900" data-testid={`text-email-${invite.id}`}>
                            {invite.email}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            invite.usedAt 
                              ? "bg-green-100 text-green-800" 
                              : new Date() > new Date(invite.expiresAt)
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {invite.usedAt 
                              ? "Accepted" 
                              : new Date() > new Date(invite.expiresAt)
                              ? "Expired"
                              : "Pending"
                            }
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {new Date(invite.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {new Date(invite.expiresAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {!invite.usedAt && new Date() <= new Date(invite.expiresAt) && (
                              <button
                                onClick={() => handleCopyInviteLink(invite.token)}
                                className="inline-flex items-center text-primary-600 hover:text-primary-900"
                                data-testid={`button-copy-${invite.id}`}
                              >
                                <Copy className="w-4 h-4 mr-1" />
                                Copy Link
                              </button>
                            )}
                            {!invite.usedAt && (
                              <button
                                onClick={() => handleRevokeInvite(invite.id)}
                                disabled={deleteInviteMutation.isPending}
                                className="inline-flex items-center text-red-600 hover:text-red-900"
                                data-testid={`button-delete-${invite.id}`}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Revoke
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-500" data-testid="text-no-invites">
                  No invitations found. Create your first invite to get started.
                </p>
              </div>
            )}
          </div>
        </div>
        </main>
      </div>
    </>
  );
}
