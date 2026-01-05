/**
 * Dive Supervisor Control App
 * 
 * Comprehensive dive operation management system for Dive Supervisors
 * - Dive Team Management (medical runout dates, competencies, contact info)
 * - Operations Log (DPR - Daily Project Reports with edit/save/export)
 * - Team Roster (phase-based assignments)
 * - Dive Plan & Profile
 * - Execution Tracking
 * - Operational Contacts (Clients, VTS, Harbour Master, Permits, etc.)
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  Users, 
  FileText, 
  ClipboardList,
  MapPin,
  PlayCircle,
  Phone,
  Calendar,
  Cloud,
  Waves,
  AlertTriangle,
  ClipboardCheck,
  Heart,
  Ship,
  FileText as FileTextIcon,
  Package,
  PenTool
} from "lucide-react";
import DiveTeamManagement from "./DiveTeamManagement";
import OperationsLog from "./OperationsLog";
import DiveTeamRoster from "./DiveTeamRoster";
import DivePlanEditor from "./DivePlanEditor";
import DiveExecution from "./DiveExecution";
import OperationalContacts from "./OperationalContacts";
import EnvironmentalData from "./EnvironmentalData";
import CasEvacDrills from "./CasEvacDrills";
import ToolBoxTalks from "./ToolBoxTalks";
import HazardsManagement from "./HazardsManagement";
import Welfare from "./Welfare";
import ShippingInfo from "./ShippingInfo";
import NoticesToMariners from "./NoticesToMariners";
import EquipmentHusbandry from "./EquipmentHusbandry";
import RAMS from "./RAMS";
import Whiteboard from "./Whiteboard";

// Container configuration with descriptions
const supervisorContainers = [
  {
    id: "team",
    title: "Dive Team",
    description: "Manage team members, medical certifications, competencies, and contact information",
    icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    component: DiveTeamManagement
  },
  {
    id: "operations-log",
    title: "Operations Log",
    description: "Daily Project Reports (DPR) with edit, save, and export capabilities for dive operations",
    icon: FileText,
    color: "text-green-600",
    bgColor: "bg-green-50",
    component: OperationsLog
  },
  {
    id: "roster",
    title: "Team Roster",
    description: "Phase-based team assignments and crew scheduling for dive operations",
    icon: ClipboardList,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    component: DiveTeamRoster
  },
  {
    id: "dive-plan",
    title: "Dive Plan",
    description: "Create and manage comprehensive dive plans, profiles, and operational procedures",
    icon: MapPin,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    component: DivePlanEditor
  },
  {
    id: "environmental",
    title: "Environmental",
    description: "Monitor weather conditions, tides, currents, and environmental data for dive operations",
    icon: Cloud,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
    component: EnvironmentalData
  },
  {
    id: "execution",
    title: "Execution",
    description: "Real-time dive execution tracking, monitoring, and operational status management",
    icon: PlayCircle,
    color: "text-red-600",
    bgColor: "bg-red-50",
    component: DiveExecution
  },
  {
    id: "contacts",
    title: "Contacts",
    description: "Operational contacts including clients, VTS, Harbour Master, permits, and emergency services",
    icon: Phone,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    component: OperationalContacts
  },
  {
    id: "hazards-risks",
    title: "Hazards & Risks",
    description: "Identify, assess, and manage operational hazards, risks, and safety protocols",
    icon: AlertTriangle,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    component: HazardsManagement
  },
  {
    id: "rams",
    title: "RAMS",
    description: "Risk Assessment and Method Statement documents with team member signatures",
    icon: FileText,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    component: RAMS
  },
  {
    id: "toolbox-talks",
    title: "Tool Box Talks",
    description: "Safety briefings, toolbox talks, and pre-dive safety discussions documentation",
    icon: ClipboardCheck,
    color: "text-teal-600",
    bgColor: "bg-teal-50",
    component: ToolBoxTalks
  },
  {
    id: "cas-evac-drills",
    title: "CasEvac Drills",
    description: "Casualty evacuation drills, emergency procedures, and evacuation planning",
    icon: AlertTriangle,
    color: "text-pink-600",
    bgColor: "bg-pink-50",
    component: CasEvacDrills
  },
  {
    id: "equipment",
    title: "Equipment",
    description: "Equipment husbandry, maintenance tracking, and equipment status management",
    icon: Package,
    color: "text-slate-600",
    bgColor: "bg-slate-50",
    component: EquipmentHusbandry
  },
  {
    id: "welfare",
    title: "Welfare",
    description: "Team welfare management, accommodation, meals, and crew comfort tracking",
    icon: Heart,
    color: "text-rose-600",
    bgColor: "bg-rose-50",
    component: Welfare
  },
  {
    id: "shipping",
    title: "Shipping",
    description: "Shipping information, logistics, cargo tracking, and transport coordination",
    icon: Ship,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    component: ShippingInfo
  },
  {
    id: "notices-mariners",
    title: "Notices to Mariners",
    description: "Maritime notices, navigational warnings, and safety information for dive operations",
    icon: FileTextIcon,
    color: "text-violet-600",
    bgColor: "bg-violet-50",
    component: NoticesToMariners
  },
  {
    id: "whiteboard",
    title: "Whiteboard",
    description: "Interactive drawing and doodling space for dive operation planning, sketches, and visual notes",
    icon: PenTool,
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    component: Whiteboard
  }
] as const;

export default function DiveSupervisorControlApp() {
  const [selectedOperationId, setSelectedOperationId] = useState<string | null>(null);
  const [activeContainer, setActiveContainer] = useState<string | null>(null);

  const handleContainerClick = (containerId: string) => {
    setActiveContainer(activeContainer === containerId ? null : containerId);
  };

  const activeContainerConfig = activeContainer 
    ? supervisorContainers.find(c => c.id === activeContainer)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-blue-600" />
            <div>
              <CardTitle>Dive Supervisor Control</CardTitle>
              <CardDescription>
                Comprehensive dive operation management, crew coordination, and safety oversight tools
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Container Grid - 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {supervisorContainers.map((container) => {
          const Icon = container.icon;
          const isActive = activeContainer === container.id;
          
          return (
            <Card 
              key={container.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                isActive ? 'ring-2 ring-blue-500 shadow-lg' : ''
              }`}
              onClick={() => handleContainerClick(container.id)}
            >
              <CardHeader className={`${container.bgColor} pb-3`}>
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg bg-white ${container.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-lg">{container.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {container.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Active Container Content */}
      {activeContainerConfig && activeContainer && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {(() => {
                const Icon = activeContainerConfig.icon;
                return <Icon className={`w-5 h-5 ${activeContainerConfig.color}`} />;
              })()}
              <h2 className="text-2xl font-bold">
                {activeContainerConfig.title}
              </h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveContainer(null)}
            >
              Close
            </Button>
          </div>
          <div>
            {(() => {
              const Component = activeContainerConfig.component;
              if (activeContainer === 'team' || activeContainer === 'whiteboard') {
                return <Component />;
              } else if (activeContainer === 'operations-log') {
                return (
                  <Component 
                    selectedOperationId={selectedOperationId}
                    onOperationSelect={setSelectedOperationId}
                  />
                );
              } else if (activeContainer === 'welfare' || activeContainer === 'shipping' || activeContainer === 'notices-mariners') {
                return (
                  <Component 
                    operationId={selectedOperationId}
                    onOperationSelect={setSelectedOperationId}
                  />
                );
              } else {
                return (
                  <Component 
                    operationId={selectedOperationId}
                    onOperationSelect={setSelectedOperationId}
                  />
                );
              }
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

