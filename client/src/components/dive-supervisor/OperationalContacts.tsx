/**
 * Operational Contacts Component
 * 
 * Manages operational contacts including:
 * - Clients, Client Rep, VTS, Harbour Master
 * - VHF Channels
 * - Permit to Dive, Hotworks, etc.
 * - Medical facilities (A&E, CC, Diving Doctor)
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Phone,
  Plus,
  Mail,
  Radio,
  FileText,
  Edit,
  Trash2,
  HeartPulse,
  MapPin
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Contact {
  id: string;
  operationId: string;
  contactType: string;
  name: string;
  organization?: string;
  phone?: string;
  email?: string;
  vhfChannel?: string;
  notes?: string;
}

interface Permit {
  id: string;
  operationId: string;
  permitType: string;
  permitNumber?: string;
  issuedBy?: string;
  issueDate?: string;
  expiryDate?: string;
  status: string;
  notes?: string;
}

const CONTACT_TYPES = [
  "CLIENT",
  "CLIENT_REP",
  "VTS",
  "HARBOUR_MASTER",
  "DIVING_DOCTOR",
  "A_E",
  "CRITICAL_CARE",
  "POLICE",
  "FIRE",
  "AMBULANCE",
  "SHIPPING",
  "OTHER",
] as const;

const PERMIT_TYPES = [
  "DIVE_PERMIT",
  "HOTWORKS",
  "ENVIRONMENTAL",
  "SAFETY",
  "OTHER",
] as const;

const contactTypeLabels: Record<string, string> = {
  CLIENT: "Client",
  CLIENT_REP: "Client Representative",
  VTS: "VTS (Vessel Traffic Service)",
  HARBOUR_MASTER: "Harbour Master",
  DIVING_DOCTOR: "Diving Doctor",
  A_E: "A&E",
  CRITICAL_CARE: "Critical Care",
  POLICE: "Police",
  FIRE: "Fire Service",
  AMBULANCE: "Ambulance Service",
  SHIPPING: "Shipping",
  OTHER: "Other",
};

const permitTypeLabels: Record<string, string> = {
  DIVE_PERMIT: "Permit to Dive",
  HOTWORKS: "Hotworks Permit",
  ENVIRONMENTAL: "Environmental Permit",
  SAFETY: "Safety Permit",
  OTHER: "Other",
};

export default function OperationalContacts({ 
  operationId, 
  onOperationSelect 
}: { 
  operationId: string | null;
  onOperationSelect: (id: string | null) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [isPermitDialogOpen, setIsPermitDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [editingPermit, setEditingPermit] = useState<Permit | null>(null);
  const [contactFormData, setContactFormData] = useState<Partial<Contact>>({});
  const [permitFormData, setPermitFormData] = useState<Partial<Permit>>({});

  // Fetch operations
  const { data: operations = [] } = useQuery({
    queryKey: ["/api/dive-supervisor/operations"],
    queryFn: async () => {
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const response = await fetch(`/api/dive-supervisor/operations?email=${email}`);
      if (!response.ok) throw new Error('Failed to fetch operations');
      return response.json();
    },
  });

  // Fetch contacts
  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/dive-supervisor/contacts", operationId],
    queryFn: async () => {
      if (!operationId) return [];
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const response = await fetch(`/api/dive-supervisor/contacts?email=${email}&operationId=${operationId}`);
      if (!response.ok) throw new Error('Failed to fetch contacts');
      return response.json();
    },
    enabled: !!operationId,
  });

  // Fetch permits
  const { data: permits = [] } = useQuery<Permit[]>({
    queryKey: ["/api/dive-supervisor/permits", operationId],
    queryFn: async () => {
      if (!operationId) return [];
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const response = await fetch(`/api/dive-supervisor/permits?email=${email}&operationId=${operationId}`);
      if (!response.ok) throw new Error('Failed to fetch permits');
      return response.json();
    },
    enabled: !!operationId,
  });

  const contactMutation = useMutation({
    mutationFn: async (data: Partial<Contact>) => {
      if (!operationId) throw new Error('No operation selected');
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const url = editingContact 
        ? `/api/dive-supervisor/contacts/${editingContact.id}`
        : '/api/dive-supervisor/contacts';
      const response = await fetch(url, {
        method: editingContact ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, operationId, email }),
      });
      if (!response.ok) throw new Error('Failed to save contact');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dive-supervisor/contacts"] });
      setIsContactDialogOpen(false);
      setEditingContact(null);
      setContactFormData({});
      toast({
        title: "Success",
        description: editingContact ? "Contact updated" : "Contact added",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const permitMutation = useMutation({
    mutationFn: async (data: Partial<Permit>) => {
      if (!operationId) throw new Error('No operation selected');
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const url = editingPermit 
        ? `/api/dive-supervisor/permits/${editingPermit.id}`
        : '/api/dive-supervisor/permits';
      const response = await fetch(url, {
        method: editingPermit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, operationId, email }),
      });
      if (!response.ok) throw new Error('Failed to save permit');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dive-supervisor/permits"] });
      setIsPermitDialogOpen(false);
      setEditingPermit(null);
      setPermitFormData({});
      toast({
        title: "Success",
        description: editingPermit ? "Permit updated" : "Permit added",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/dive-supervisor/contacts/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete contact');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dive-supervisor/contacts"] });
      toast({ title: "Success", description: "Contact deleted" });
    },
  });

  const deletePermitMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/dive-supervisor/permits/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete permit');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dive-supervisor/permits"] });
      toast({ title: "Success", description: "Permit deleted" });
    },
  });

  if (!operationId) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Select Operation</CardTitle>
            <CardDescription>Choose an operation to manage contacts and permits</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={operationId || "none"}
              onValueChange={(value) => onOperationSelect(value === "none" ? null : value)}
            >
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder="Select Operation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select Operation</SelectItem>
                {operations.map((op: any) => (
                  <SelectItem key={op.id} value={op.id}>
                    {op.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Operational Contacts</h2>
          <p className="text-sm text-muted-foreground">
            Manage contacts, permits, and authorizations for dive operations
          </p>
        </div>
        <Select
          value={operationId}
          onValueChange={(value) => onOperationSelect(value)}
        >
          <SelectTrigger className="w-full md:w-[300px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {operations.map((op: any) => (
              <SelectItem key={op.id} value={op.id}>
                {op.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Contacts Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Contacts</CardTitle>
            <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingContact(null);
                  setContactFormData({ contactType: "CLIENT" });
                  setIsContactDialogOpen(true);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Contact
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingContact ? "Edit Contact" : "Add Contact"}</DialogTitle>
                  <DialogDescription>Add operational contact information</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Contact Type</Label>
                    <Select
                      value={contactFormData.contactType || "CLIENT"}
                      onValueChange={(value) => setContactFormData({ ...contactFormData, contactType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTACT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {contactTypeLabels[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Name *</Label>
                    <Input
                      value={contactFormData.name || ""}
                      onChange={(e) => setContactFormData({ ...contactFormData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Organization</Label>
                    <Input
                      value={contactFormData.organization || ""}
                      onChange={(e) => setContactFormData({ ...contactFormData, organization: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      type="tel"
                      value={contactFormData.phone || ""}
                      onChange={(e) => setContactFormData({ ...contactFormData, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={contactFormData.email || ""}
                      onChange={(e) => setContactFormData({ ...contactFormData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>VHF Channel</Label>
                    <Input
                      value={contactFormData.vhfChannel || ""}
                      onChange={(e) => setContactFormData({ ...contactFormData, vhfChannel: e.target.value })}
                      placeholder="Channel 16"
                    />
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      value={contactFormData.notes || ""}
                      onChange={(e) => setContactFormData({ ...contactFormData, notes: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsContactDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => contactMutation.mutate(contactFormData)}>
                      {contactMutation.isPending ? "Saving..." : editingContact ? "Update" : "Add"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contacts.map((contact) => (
              <Card key={contact.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{contact.name}</CardTitle>
                      <Badge variant="secondary" className="mt-1">
                        {contactTypeLabels[contact.contactType]}
                      </Badge>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingContact(contact);
                          setContactFormData(contact);
                          setIsContactDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Delete ${contact.name}?`)) {
                            deleteContactMutation.mutate(contact.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {contact.organization && (
                    <div>{contact.organization}</div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4" />
                      <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                        {contact.phone}
                      </a>
                    </div>
                  )}
                  {contact.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                        {contact.email}
                      </a>
                    </div>
                  )}
                  {contact.vhfChannel && (
                    <div className="flex items-center space-x-2">
                      <Radio className="w-4 h-4" />
                      <span>VHF: {contact.vhfChannel}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          {contacts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No contacts added yet. Add your first contact to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permits Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Permits & Authorizations</CardTitle>
            <Dialog open={isPermitDialogOpen} onOpenChange={setIsPermitDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingPermit(null);
                  setPermitFormData({ permitType: "DIVE_PERMIT", status: "PENDING" });
                  setIsPermitDialogOpen(true);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Permit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingPermit ? "Edit Permit" : "Add Permit"}</DialogTitle>
                  <DialogDescription>Add permit or authorization information</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Permit Type</Label>
                    <Select
                      value={permitFormData.permitType || "DIVE_PERMIT"}
                      onValueChange={(value) => setPermitFormData({ ...permitFormData, permitType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PERMIT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {permitTypeLabels[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Permit Number</Label>
                    <Input
                      value={permitFormData.permitNumber || ""}
                      onChange={(e) => setPermitFormData({ ...permitFormData, permitNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Issued By</Label>
                    <Input
                      value={permitFormData.issuedBy || ""}
                      onChange={(e) => setPermitFormData({ ...permitFormData, issuedBy: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Issue Date</Label>
                      <Input
                        type="date"
                        value={permitFormData.issueDate || ""}
                        onChange={(e) => setPermitFormData({ ...permitFormData, issueDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Expiry Date</Label>
                      <Input
                        type="date"
                        value={permitFormData.expiryDate || ""}
                        onChange={(e) => setPermitFormData({ ...permitFormData, expiryDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select
                      value={permitFormData.status || "PENDING"}
                      onValueChange={(value) => setPermitFormData({ ...permitFormData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="ISSUED">Issued</SelectItem>
                        <SelectItem value="EXPIRED">Expired</SelectItem>
                        <SelectItem value="REVOKED">Revoked</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      value={permitFormData.notes || ""}
                      onChange={(e) => setPermitFormData({ ...permitFormData, notes: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsPermitDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => permitMutation.mutate(permitFormData)}>
                      {permitMutation.isPending ? "Saving..." : editingPermit ? "Update" : "Add"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {permits.map((permit) => (
              <Card key={permit.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">
                        {permitTypeLabels[permit.permitType]}
                      </CardTitle>
                      {permit.permitNumber && (
                        <div className="text-sm text-muted-foreground mt-1">
                          #{permit.permitNumber}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={
                        permit.status === "ISSUED" ? "default" :
                        permit.status === "EXPIRED" ? "destructive" :
                        permit.status === "REVOKED" ? "destructive" :
                        "secondary"
                      }>
                        {permit.status}
                      </Badge>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingPermit(permit);
                            setPermitFormData(permit);
                            setIsPermitDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Delete ${permitTypeLabels[permit.permitType]}?`)) {
                              deletePermitMutation.mutate(permit.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  {permit.issuedBy && (
                    <div>Issued by: {permit.issuedBy}</div>
                  )}
                  {permit.issueDate && (
                    <div>Issue date: {new Date(permit.issueDate).toLocaleDateString()}</div>
                  )}
                  {permit.expiryDate && (
                    <div>Expiry date: {new Date(permit.expiryDate).toLocaleDateString()}</div>
                  )}
                  {permit.notes && (
                    <div className="text-muted-foreground">{permit.notes}</div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          {permits.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No permits added yet. Add your first permit to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

