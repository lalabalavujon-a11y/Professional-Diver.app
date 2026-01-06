/**
 * Operations Log Component (DPR Management)
 * 
 * Manages Daily Project Reports (DPRs) with:
 * - Create, edit, save DPRs
 * - Export to PDF/DOCX
 * - Import from PDF/DOCX
 * - Template system
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  Plus, 
  Download,
  Upload,
  Edit,
  Calendar,
  Save
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import DPRFormEditor from "./DPRFormEditor";

interface DPR {
  id: string;
  operationId: string;
  operationTitle?: string;
  reportDate: string;
  reportData: any;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface DiveOperation {
  id: string;
  title: string;
  status: string;
}

export default function OperationsLog({ 
  selectedOperationId, 
  onOperationSelect 
}: { 
  selectedOperationId: string | null;
  onOperationSelect: (id: string | null) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingDPR, setEditingDPR] = useState<DPR | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);

  // Fetch operations
  const { data: operations = [] } = useQuery<DiveOperation[]>({
    queryKey: ["/api/dive-supervisor/operations"],
    queryFn: async () => {
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const response = await fetch(`/api/dive-supervisor/operations?email=${email}`);
      if (!response.ok) throw new Error('Failed to fetch operations');
      return response.json();
    },
  });

  // Fetch DPRs
  const { data: dprs = [], isLoading } = useQuery<DPR[]>({
    queryKey: ["/api/dive-supervisor/dprs", selectedOperationId],
    queryFn: async () => {
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const url = selectedOperationId
        ? `/api/dive-supervisor/dprs?email=${email}&operationId=${selectedOperationId}`
        : `/api/dive-supervisor/dprs?email=${email}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch DPRs');
      return response.json();
    },
    enabled: true,
  });

  const handleExportPDF = async (dprId: string) => {
    try {
      const response = await fetch(`/api/dive-supervisor/dprs/${dprId}/export-pdf`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to export PDF');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DPR-${dprId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "Success",
        description: "DPR exported to PDF",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleExportDOCX = async (dprId: string) => {
    try {
      const response = await fetch(`/api/dive-supervisor/dprs/${dprId}/export-docx`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to export DOCX');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DPR-${dprId}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "Success",
        description: "DPR exported to DOCX",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/dive-supervisor/dprs/import', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to import DPR');
      queryClient.invalidateQueries({ queryKey: ["/api/dive-supervisor/dprs"] });
      toast({
        title: "Success",
        description: "DPR imported successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSave = (dprData: any) => {
    // This will be handled by DPRFormEditor
    queryClient.invalidateQueries({ queryKey: ["/api/dive-supervisor/dprs"] });
    setEditingDPR(null);
    setCreatingNew(false);
  };

  if (editingDPR || creatingNew) {
    return (
      <DPRFormEditor
        dpr={editingDPR}
        operationId={selectedOperationId || undefined}
        onSave={handleSave}
        onCancel={() => {
          setEditingDPR(null);
          setCreatingNew(false);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Operations Log (DPR)</h2>
          <p className="text-sm text-muted-foreground">
            Daily Project Reports - Create, edit, and export dive operation reports
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setCreatingNew(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New DPR
          </Button>
          <label>
            <Button variant="outline" asChild>
              <span>
                <Upload className="w-4 h-4 mr-2" />
                Import
              </span>
            </Button>
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Operation Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Filter by Operation</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedOperationId || "all"}
            onValueChange={(value) => onOperationSelect(value === "all" ? null : value)}
          >
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="All Operations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Operations</SelectItem>
              {operations.map((op) => (
                <SelectItem key={op.id} value={op.id}>
                  {op.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* DPRs List */}
      {isLoading ? (
        <div>Loading DPRs...</div>
      ) : (
        <div className="space-y-4">
          {dprs.map((dpr) => (
            <Card key={dpr.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {dpr.operationTitle || `Operation ${dpr.operationId}`}
                    </CardTitle>
                    <CardDescription className="flex items-center space-x-2 mt-1">
                      <Calendar className="w-4 h-4" />
                      <span>{format(new Date(dpr.reportDate), "PPP")}</span>
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">
                    {format(new Date(dpr.updatedAt), "MMM dd, yyyy")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Last updated: {format(new Date(dpr.updatedAt), "PPp")}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingDPR(dpr)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportPDF(dpr.id)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportDOCX(dpr.id)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      DOCX
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {dprs.length === 0 && !isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              No DPRs found. Create your first Daily Project Report.
            </p>
            <Button onClick={() => setCreatingNew(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create DPR
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


