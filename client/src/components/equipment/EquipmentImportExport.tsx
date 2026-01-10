import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Download, Upload, FileText, FileSpreadsheet, AlertCircle } from "lucide-react";
import ExcelJS from "exceljs";
import { validateExcelFile, validateExcelData, sanitizeExcelData } from "@/utils/excel-validation";

interface EquipmentImportExportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface EquipmentItem {
  name: string;
  equipmentTypeName: string;
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  purchaseDate?: string;
  status: string;
  location?: string;
  notes?: string;
}

export default function EquipmentImportExport({ open, onOpenChange, onSuccess }: EquipmentImportExportProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const { data: equipmentItems } = useQuery<EquipmentItem[]>({
    queryKey: ["/api/equipment/items"],
    queryFn: async () => {
      const res = await fetch("/api/equipment/items");
      if (!res.ok) throw new Error("Failed to fetch equipment items");
      return res.json();
    },
    enabled: open, // Only fetch when dialog is open
  });

  const { data: equipmentTypes } = useQuery<any[]>({
    queryKey: ["/api/equipment/types"],
    queryFn: async () => {
      const res = await fetch("/api/equipment/types");
      if (!res.ok) throw new Error("Failed to fetch equipment types");
      return res.json();
    },
    enabled: open,
  });

  const bulkImportMutation = useMutation({
    mutationFn: async (items: any[]) => {
      const res = await apiRequest("POST", "/api/equipment/items/bulk", { items });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment/items"] });
      toast({
        title: "Success",
        description: `Successfully imported ${data.created || 0} equipment items${data.errors > 0 ? ` (${data.errors} errors)` : ""}`,
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to import equipment items",
        variant: "destructive",
      });
    },
  });

  const handleExportCSV = () => {
    if (!equipmentItems || equipmentItems.length === 0) {
      toast({
        title: "No Data",
        description: "No equipment items to export",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      const headers = [
        "Name",
        "Equipment Type",
        "Serial Number",
        "Manufacturer",
        "Model",
        "Purchase Date",
        "Status",
        "Location",
        "Notes",
      ];

      const csvRows = [
        headers.join(","),
        ...equipmentItems.map((item) => {
          const row = [
            `"${(item.name || "").replace(/"/g, '""')}"`,
            `"${((item as any).equipmentType?.name || "").replace(/"/g, '""')}"`,
            `"${(item.serialNumber || "").replace(/"/g, '""')}"`,
            `"${(item.manufacturer || "").replace(/"/g, '""')}"`,
            `"${(item.model || "").replace(/"/g, '""')}"`,
            `"${(item.purchaseDate || "").replace(/"/g, '""')}"`,
            `"${(item.status || "").replace(/"/g, '""')}"`,
            `"${(item.location || "").replace(/"/g, '""')}"`,
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
      link.setAttribute("download", `equipment_export_${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Equipment exported to CSV successfully",
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

  const handleExportExcel = async () => {
    if (!equipmentItems || equipmentItems.length === 0) {
      toast({
        title: "No Data",
        description: "No equipment items to export",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Equipment");

      // Add headers
      worksheet.columns = [
        { header: "Name", key: "name", width: 30 },
        { header: "Equipment Type", key: "equipmentType", width: 20 },
        { header: "Serial Number", key: "serialNumber", width: 20 },
        { header: "Manufacturer", key: "manufacturer", width: 20 },
        { header: "Model", key: "model", width: 20 },
        { header: "Purchase Date", key: "purchaseDate", width: 15 },
        { header: "Status", key: "status", width: 15 },
        { header: "Location", key: "location", width: 20 },
        { header: "Notes", key: "notes", width: 40 },
      ];

      // Style header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };

      // Add data rows
      equipmentItems.forEach((item) => {
        worksheet.addRow({
          name: item.name || "",
          equipmentType: (item as any).equipmentType?.name || "",
          serialNumber: item.serialNumber || "",
          manufacturer: item.manufacturer || "",
          model: item.model || "",
          purchaseDate: item.purchaseDate || "",
          status: item.status || "",
          location: item.location || "",
          notes: item.notes || "",
        });
      });

      // Generate buffer and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `equipment_export_${new Date().toISOString().split("T")[0]}.xlsx`;
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Equipment exported to Excel successfully",
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
        // Only add rows with a name
        data.push(row);
      }
    }

    return data;
  };

  const parseExcel = async (file: File): Promise<any[]> => {
    // Validate file before processing
    const fileValidation = validateExcelFile(file);
    if (!fileValidation.valid) {
      throw new Error(fileValidation.error);
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(data);
          
          const worksheet = workbook.worksheets[0];
          if (!worksheet) {
            throw new Error("Excel file has no worksheets");
          }

          const jsonData: any[] = [];
          worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header row
            
            const rowData: any = {};
            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
              const header = worksheet.getRow(1).getCell(colNumber).value?.toString() || "";
              rowData[header] = cell.value?.toString() || "";
            });
            jsonData.push(rowData);
          });

          // Validate and sanitize parsed data
          const dataValidation = validateExcelData(jsonData);
          if (!dataValidation.valid) {
            throw new Error(dataValidation.error);
          }

          const sanitized = sanitizeExcelData(jsonData);
          resolve(sanitized);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsArrayBuffer(file);
    });
  };

  const normalizeImportData = (data: any[]): any[] => {
    if (!equipmentTypes || equipmentTypes.length === 0) {
      throw new Error("Equipment types not loaded");
    }

    const typeMap: Record<string, string> = {};
    equipmentTypes.forEach((type) => {
      typeMap[type.name.toLowerCase()] = type.id;
    });

    return data.map((row) => {
      // Map various column name variations
      const name = row.Name || row.name || row["Equipment Name"] || "";
      const typeName = row["Equipment Type"] || row["EquipmentType"] || row["Type"] || row.type || "";
      const typeId = typeMap[typeName.toLowerCase()] || equipmentTypes[0]?.id || "";

      if (!name) {
        throw new Error("Name is required for all equipment items");
      }

      return {
        name,
        equipmentTypeId: typeId,
        serialNumber: row["Serial Number"] || row["SerialNumber"] || row["Serial"] || row.serialNumber || undefined,
        manufacturer: row.Manufacturer || row.manufacturer || undefined,
        model: row.Model || row.model || undefined,
        purchaseDate: row["Purchase Date"] || row["PurchaseDate"] || row.purchaseDate || undefined,
        status: (row.Status || row.status || "OPERATIONAL").toUpperCase(),
        location: row.Location || row.location || undefined,
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
          <DialogTitle>Import / Export Equipment</DialogTitle>
          <DialogDescription>
            Import equipment from CSV/Excel files or export existing equipment to CSV/Excel
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Export Equipment</h3>
            <div className="flex gap-3">
              <Button
                onClick={handleExportCSV}
                disabled={isExporting || !equipmentItems || equipmentItems.length === 0}
                variant="outline"
                className="flex-1"
              >
                <FileText className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button
                onClick={handleExportExcel}
                disabled={isExporting || !equipmentItems || equipmentItems.length === 0}
                variant="outline"
                className="flex-1"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
            </div>
            {equipmentItems && equipmentItems.length > 0 && (
              <p className="text-sm text-slate-600">
                Exporting {equipmentItems.length} equipment items
              </p>
            )}
          </div>

          {/* Import Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Import Equipment</h3>
            <div className="space-y-3">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">CSV/Excel Format Requirements:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Required columns: Name, Equipment Type</li>
                      <li>Optional columns: Serial Number, Manufacturer, Model, Purchase Date, Status, Location, Notes</li>
                      <li>First row should contain column headers</li>
                      <li>Status should be one of: OPERATIONAL, MAINTENANCE, RETIRED, RESERVED, DECOMMISSIONED</li>
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
                id="equipment-file-input"
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

