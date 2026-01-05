/**
 * DMT Diver Medic Operations Container
 * 
 * Comprehensive medical equipment and operations management for Diver Medic Technicians
 * - Medical Equipment Inventory (O2 Cylinders, etc.)
 * - Before/After Use Checks
 * - Import/Export (CSV/Excel)
 * - Incident Forms
 * - Glaucoma Screening Forms
 * - Medical Documentation
 */

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  HeartPulse, 
  Package, 
  FileText, 
  ClipboardCheck,
  Upload,
  Download,
  Stethoscope,
  Brain,
  ClipboardList,
  Pill,
  Box
} from "lucide-react";
import MedicalEquipmentInventory from "./MedicalEquipmentInventory";
import MedicalSuppliesInventory from "./MedicalSuppliesInventory";
import MedicalEquipmentCheckForm from "./MedicalEquipmentCheckForm";
import IncidentReportForm from "./IncidentReportForm";
import GlaucomaForm from "./GlaucomaForm";
import MedicalQuestionnaireForm from "./MedicalQuestionnaireForm";
import NeurologicalExamForm from "./NeurologicalExamForm";
import TreatmentLogForm from "./TreatmentLogForm";
import MedicationRecordForm from "./MedicationRecordForm";

export default function DMTMedOpsApp() {
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const [showCheckForm, setShowCheckForm] = useState(false);
  const [checkType, setCheckType] = useState<"before" | "after">("before");
  const [selectedForm, setSelectedForm] = useState<string | null>(null);

  const handleCheckEquipment = (equipmentId: string, type: "before" | "after") => {
    setSelectedEquipmentId(equipmentId);
    setCheckType(type);
    setShowCheckForm(true);
  };

  const handleFormSelect = (formType: string) => {
    setSelectedForm(formType);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <HeartPulse className="w-8 h-8 text-red-600" />
            <div>
              <CardTitle>Diver Medic Technician Operations</CardTitle>
              <CardDescription>
                Medical equipment management, incident reporting, and medical documentation for onsite DMT operations
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="equipment" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="equipment" className="flex items-center space-x-2">
            <Package className="w-4 h-4" />
            <span className="hidden lg:inline">Medical Equipment</span>
            <span className="lg:hidden">Equipment</span>
          </TabsTrigger>
          <TabsTrigger value="supplies" className="flex items-center space-x-2">
            <Box className="w-4 h-4" />
            <span className="hidden lg:inline">Medical Supplies (MS)</span>
            <span className="lg:hidden">Supplies</span>
          </TabsTrigger>
          <TabsTrigger value="incidents" className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span className="hidden lg:inline">Incident Reports</span>
            <span className="lg:hidden">Incidents</span>
          </TabsTrigger>
          <TabsTrigger value="glaucoma" className="flex items-center space-x-2">
            <Stethoscope className="w-4 h-4" />
            <span className="hidden lg:inline">Glaucoma Screening</span>
            <span className="lg:hidden">Glaucoma</span>
          </TabsTrigger>
          <TabsTrigger value="neurological" className="flex items-center space-x-2">
            <Brain className="w-4 h-4" />
            <span className="hidden lg:inline">Neuro Exam</span>
            <span className="lg:hidden">Neuro</span>
          </TabsTrigger>
          <TabsTrigger value="forms" className="flex items-center space-x-2">
            <ClipboardCheck className="w-4 h-4" />
            <span className="hidden lg:inline">All Forms</span>
            <span className="lg:hidden">Forms</span>
          </TabsTrigger>
        </TabsList>

        {/* Medical Equipment Tab */}
        <TabsContent value="equipment" className="space-y-4">
          <MedicalEquipmentInventory
            onCheckEquipment={handleCheckEquipment}
          />
        </TabsContent>

        {/* Medical Supplies Tab */}
        <TabsContent value="supplies" className="space-y-4">
          <MedicalSuppliesInventory />
        </TabsContent>

        {/* Incident Reports Tab */}
        <TabsContent value="incidents" className="space-y-4">
          <IncidentReportForm />
        </TabsContent>

        {/* Glaucoma Screening Tab */}
        <TabsContent value="glaucoma" className="space-y-4">
          <GlaucomaForm />
        </TabsContent>

        {/* Neurological Exam Tab */}
        <TabsContent value="neurological" className="space-y-4">
          <NeurologicalExamForm />
        </TabsContent>

        {/* Medical Forms Tab */}
        <TabsContent value="forms" className="space-y-4">
          {!selectedForm ? (
            <Card>
              <CardHeader>
                <CardTitle>Medical Documentation Forms</CardTitle>
                <CardDescription>
                  Access all required medical forms for Diver Medic Technician operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleFormSelect("incident")}
                  >
                    <CardHeader>
                      <div className="flex items-center space-x-2 mb-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <CardTitle className="text-lg">Incident Report Form</CardTitle>
                      </div>
                      <CardDescription>
                        Document diving incidents, accidents, and medical emergencies
                      </CardDescription>
                    </CardHeader>
                  </Card>
                  <Card 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleFormSelect("glaucoma")}
                  >
                    <CardHeader>
                      <div className="flex items-center space-x-2 mb-2">
                        <Stethoscope className="w-5 h-5 text-green-600" />
                        <CardTitle className="text-lg">Glaucoma Screening Form</CardTitle>
                      </div>
                      <CardDescription>
                        Pre-dive medical screening for glaucoma assessment
                      </CardDescription>
                    </CardHeader>
                  </Card>
                  <Card 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleFormSelect("questionnaire")}
                  >
                    <CardHeader>
                      <div className="flex items-center space-x-2 mb-2">
                        <FileText className="w-5 h-5 text-purple-600" />
                        <CardTitle className="text-lg">Medical Questionnaire</CardTitle>
                      </div>
                      <CardDescription>
                        Pre-dive medical participant questionnaire
                      </CardDescription>
                    </CardHeader>
                  </Card>
                  <Card 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleFormSelect("neurological")}
                  >
                    <CardHeader>
                      <div className="flex items-center space-x-2 mb-2">
                        <Brain className="w-5 h-5 text-orange-600" />
                        <CardTitle className="text-lg">Neurological Exam</CardTitle>
                      </div>
                      <CardDescription>
                        Comprehensive neurological assessment (Neuro Exam Slate)
                      </CardDescription>
                    </CardHeader>
                  </Card>
                  <Card 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleFormSelect("treatment")}
                  >
                    <CardHeader>
                      <div className="flex items-center space-x-2 mb-2">
                        <ClipboardList className="w-5 h-5 text-red-600" />
                        <CardTitle className="text-lg">Treatment Log</CardTitle>
                      </div>
                      <CardDescription>
                        Document all medical treatments and interventions
                      </CardDescription>
                    </CardHeader>
                  </Card>
                  <Card 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleFormSelect("medication")}
                  >
                    <CardHeader>
                      <div className="flex items-center space-x-2 mb-2">
                        <Pill className="w-5 h-5 text-pink-600" />
                        <CardTitle className="text-lg">Medication Record</CardTitle>
                      </div>
                      <CardDescription>
                        Document all medications administered to patients
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Button variant="outline" onClick={() => setSelectedForm(null)}>
                ← Back to Forms
              </Button>
              {selectedForm === "incident" && <IncidentReportForm />}
              {selectedForm === "glaucoma" && <GlaucomaForm />}
              {selectedForm === "questionnaire" && <MedicalQuestionnaireForm />}
              {selectedForm === "neurological" && <NeurologicalExamForm />}
              {selectedForm === "treatment" && <TreatmentLogForm />}
              {selectedForm === "medication" && <MedicationRecordForm />}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Equipment Check Form Dialog */}
      {showCheckForm && selectedEquipmentId && (
        <MedicalEquipmentCheckForm
          equipmentId={selectedEquipmentId}
          checkType={checkType}
          open={showCheckForm}
          onOpenChange={setShowCheckForm}
          onSuccess={() => {
            setShowCheckForm(false);
            setSelectedEquipmentId(null);
          }}
        />
      )}
    </div>
  );
}

