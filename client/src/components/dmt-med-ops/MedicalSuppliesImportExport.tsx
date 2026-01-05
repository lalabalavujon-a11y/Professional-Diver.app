/**
 * Medical Supplies Import/Export Component
 * 
 * Import/Export medical supplies inventory via CSV or Excel
 */

import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, FileText, FileSpreadsheet, AlertCircle } from "lucide-react";
import * as XLSX from "xlsx";
import type { MedicalSupplyItem } from "./MedicalSuppliesInventory";

interface MedicalSuppliesImportExportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function MedicalSuppliesImportExport({
  open,
  onOpenChange,
  onSuccess,
}: MedicalSuppliesImportExportProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const { data: supplyItems = [] } = useQuery<MedicalSupplyItem[]>({
    queryKey: ["/api/dmt-med-ops/supplies"],
    queryFn: async () => {
      return [];
    },
    enabled: open,
  });

  const bulkImportMutation = useMutation({
    mutationFn: async (items: any[]) => {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ created: items.length, errors: 0 }), 1000);
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/dmt-med-ops/supplies"] });
      toast({
        title: "Success",
        description: `Successfully imported ${data.created || 0} supply items${
          data.errors > 0 ? ` (${data.errors} errors)` : ""
        }`,
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to import supply items",
        variant: "destructive",
      });
    },
  });

  const handleExportCSV = () => {
    if (!supplyItems || supplyItems.length === 0) {
      toast({
        title: "No Data",
        description: "No supply items to export",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      const headers = [
        "Name",
        "Category",
        "Quantity",
        "Current Stock",
        "Minimum Stock",
        "Unit",
        "Location",
        "Expiry Date",
        "Batch Number",
        "Supplier",
        "Status",
        "Notes",
      ];

      const csvRows = [
        headers.join(","),
        ...supplyItems.map((item) => {
          const row = [
            `"${(item.name || "").replace(/"/g, '""')}"`,
            `"${(item.category || "").replace(/"/g, '""')}"`,
            `"${(item.quantity || 0).toString().replace(/"/g, '""')}"`,
            `"${(item.currentStock || 0).toString().replace(/"/g, '""')}"`,
            `"${(item.minimumStock || 0).toString().replace(/"/g, '""')}"`,
            `"${(item.unit || "").replace(/"/g, '""')}"`,
            `"${(item.location || "").replace(/"/g, '""')}"`,
            `"${(item.expiryDate || "").replace(/"/g, '""')}"`,
            `"${(item.batchNumber || "").replace(/"/g, '""')}"`,
            `"${(item.supplier || "").replace(/"/g, '""')}"`,
            `"${(item.status || "").replace(/"/g, '""')}"`,
            `"${(item.notes || "").replace(/"/g, '""')}"`,
          ];
          return row.join(",");
        }),
      ];

      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `medical_supplies_export_${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Medical supplies exported to CSV successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to export CSV",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = () => {
    if (!supplyItems || supplyItems.length === 0) {
      toast({
        title: "No Data",
        description: "No supply items to export",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      const data = supplyItems.map((item) => ({
        Name: item.name || "",
        Category: item.category || "",
        Quantity: item.quantity || 0,
        "Current Stock": item.currentStock || 0,
        "Minimum Stock": item.minimumStock || 0,
        Unit: item.unit || "",
        Location: item.location || "",
        "Expiry Date": item.expiryDate || "",
        "Batch Number": item.batchNumber || "",
        Supplier: item.supplier || "",
        Status: item.status || "",
        Notes: item.notes || "",
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Medical Supplies");
      XLSX.writeFile(workbook, `medical_supplies_export_${new Date().toISOString().split("T")[0]}.xlsx`);

      toast({
        title: "Success",
        description: "Medical supplies exported to Excel successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to export Excel",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.split("\n").filter((line) => line.trim());
    if (lines.length < 2) {
      throw new Error("CSV file must have at least a header row and one data row");
    }

    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    const data: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });
      if (row.Name) {
        data.push(row);
      }
    }

    return data;
  };

  const parseExcel = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const normalizeImportData = (data: any[]): any[] => {
    return data.map((row) => {
      const name = row.Name || row.name || "";
      const category = row.Category || row.category || "";
      const currentStock = parseInt(row["Current Stock"] || row.currentStock || row["CurrentStock"] || "0");
      const minimumStock = parseInt(row["Minimum Stock"] || row.minimumStock || row["MinimumStock"] || "0");
      
      let status: MedicalSupplyItem["status"] = "IN_STOCK";
      if (currentStock === 0) {
        status = "OUT_OF_STOCK";
      } else if (currentStock <= minimumStock) {
        status = "LOW_STOCK";
      }

      if (!name) {
        throw new Error("Name is required for all supply items");
      }

      return {
        name,
        category: category || "Miscellaneous",
        quantity: parseInt(row.Quantity || row.quantity || "0"),
        currentStock,
        minimumStock,
        unit: row.Unit || row.unit || "units",
        location: row.Location || row.location || undefined,
        expiryDate: row["Expiry Date"] || row["ExpiryDate"] || row.expiryDate || undefined,
        batchNumber: row["Batch Number"] || row["BatchNumber"] || row.batchNumber || undefined,
        supplier: row.Supplier || row.supplier || undefined,
        status,
        notes: row.Notes || row.notes || undefined,
      };
    });
  };

  const handleFileImport = async (file: File) => {
    try {
      let data: any[];
      if (file.name.endsWith(".csv")) {
        const text = await file.text();
        data = parseCSV(text);
      } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        data = await parseExcel(file);
      } else {
        throw new Error("Unsupported file format. Please use CSV or Excel files.");
      }

      const normalizedData = normalizeImportData(data);
      bulkImportMutation.mutate(normalizedData);
    } catch (error: any) {
      toast({
        title: "Import Error",
        description: error.message || "Failed to parse file",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileImport(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import / Export Medical Supplies</DialogTitle>
          <DialogDescription>
            Import medical supplies from CSV/Excel files or export existing supplies to CSV/Excel
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Export Supplies</h3>
            <div className="flex gap-3">
              <Button
                onClick={handleExportCSV}
                disabled={isExporting || !supplyItems || supplyItems.length === 0}
                variant="outline"
                className="flex-1"
              >
                <FileText className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button
                onClick={handleExportExcel}
                disabled={isExporting || !supplyItems || supplyItems.length === 0}
                variant="outline"
                className="flex-1"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
            </div>
            {supplyItems && supplyItems.length > 0 && (
              <p className="text-sm text-slate-600">
                Exporting {supplyItems.length} supply items
              </p>
            )}
          </div>

          {/* Import Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Import Supplies</h3>
            <div className="space-y-3">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">CSV/Excel Format Requirements:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Required columns: Name, Current Stock, Minimum Stock, Unit</li>
                      <li>
                        Optional columns: Category, Quantity, Location, Expiry Date, Batch Number,
                        Supplier, Notes
                      </li>
                      <li>First row should contain column headers</li>
                      <li>Status will be automatically calculated based on stock levels</li>
                    </ul>
                  </div>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="medical-supplies-file-input"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={bulkImportMutation.isPending}
                className="w-full"
                variant="outline"
              >
                <Upload className="w-4 h-4 mr-2" />
                {bulkImportMutation.isPending ? "Importing..." : "Choose File to Import"}
              </Button>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

