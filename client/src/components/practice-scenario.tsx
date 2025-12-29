import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Play, CheckCircle, AlertTriangle, Wrench, Users, Clock } from "lucide-react";

// Practice scenarios for each track
const PRACTICE_SCENARIOS = {
  "ndt-inspection": [
    {
      id: "pier-inspection",
      title: "Offshore Platform Pier Inspection",
      difficulty: "Intermediate",
      duration: "45 minutes",
      scenario: "You're tasked with inspecting the underwater foundations of an offshore drilling platform. Recent storms have raised concerns about structural integrity.",
      objectives: [
        "Conduct visual inspection of concrete piers",
        "Perform ultrasonic thickness testing on critical joints",
        "Document any signs of corrosion or cracking",
        "Recommend immediate actions if critical issues found"
      ],
      challenges: [
        "Limited visibility due to murky water",
        "Strong currents requiring careful positioning",
        "Time pressure due to weather window",
        "Critical infrastructure - zero tolerance for errors"
      ],
      tools: ["Ultrasonic thickness gauge", "Underwater camera", "Crack measurement tools", "Documentation slate"],
      outcome: "Based on your findings, determine if the platform can continue operations or requires immediate repairs."
    },
    {
      id: "ship-hull-survey",
      title: "Commercial Ship Hull Survey",
      difficulty: "Advanced",
      duration: "60 minutes",
      scenario: "A cargo vessel requires mandatory 5-year hull inspection. Insurance and port authorities need comprehensive documentation.",
      objectives: [
        "Complete hull thickness measurements at specified points",
        "Inspect propeller and rudder assemblies",
        "Check sea chest and through-hull fittings",
        "Generate certification-ready report"
      ],
      challenges: [
        "Large surface area to cover systematically",
        "Varying steel thickness across hull zones",
        "Port scheduling pressure",
        "International certification standards"
      ],
      tools: ["Multi-frequency thickness gauge", "Magnetic particle test kit", "High-resolution camera", "Measurement tools"],
      outcome: "Produce inspection report meeting classification society standards for vessel certification."
    }
  ],
  "diver-medic-technician": [
    {
      id: "decompression-emergency",
      title: "Decompression Sickness Emergency",
      difficulty: "Expert",
      duration: "30 minutes",
      scenario: "A commercial diver surfaces rapidly after a deep saturation dive. They're experiencing joint pain, dizziness, and difficulty breathing.",
      objectives: [
        "Rapid assessment using ABCDE protocol",
        "Identify decompression sickness symptoms",
        "Initiate appropriate emergency treatment",
        "Coordinate hyperbaric chamber transport"
      ],
      challenges: [
        "Multiple symptoms presenting simultaneously",
        "Patient anxiety affecting cooperation",
        "Remote location - limited resources",
        "Weather affecting evacuation options"
      ],
      tools: ["High-flow oxygen delivery", "Vital signs monitoring", "IV access kit", "Emergency medications"],
      outcome: "Stabilize patient and ensure safe transport to hyperbaric treatment facility."
    },
    {
      id: "near-drowning-rescue",
      title: "Near-Drowning Incident Response",
      difficulty: "Advanced",
      duration: "25 minutes",
      scenario: "An unconscious diver has been brought to the surface. They're not breathing and show no signs of circulation.",
      objectives: [
        "Immediate airway assessment and management",
        "Begin CPR if indicated",
        "Manage potential cervical spine injury",
        "Prepare for advanced life support"
      ],
      challenges: [
        "Potential water in lungs complicating ventilation",
        "Unknown duration of submersion",
        "Possible hypothermia",
        "Need to protect cervical spine"
      ],
      tools: ["BVM resuscitator", "Cervical collar", "Suction device", "AED"],
      outcome: "Restore breathing and circulation, prepare for emergency medical transport."
    }
  ],
  "commercial-dive-supervisor": [
    {
      id: "emergency-ascent-procedure",
      title: "Emergency Ascent Situation",
      difficulty: "Expert",
      duration: "40 minutes",
      scenario: "Your diver reports equipment malfunction at 100ft depth. Life support systems are failing and emergency ascent may be required.",
      objectives: [
        "Assess diver's condition and equipment status",
        "Evaluate ascent options and risks",
        "Coordinate surface support team",
        "Execute emergency response protocol"
      ],
      challenges: [
        "Decompression obligations vs. life threat",
        "Equipment failure diagnosis under pressure",
        "Team coordination under stress",
        "Multiple contingency plans needed"
      ],
      tools: ["Surface communication system", "Emergency gas supplies", "Decompression tables", "Dive computer"],
      outcome: "Safely recover diver while minimizing decompression injury risk."
    },
    {
      id: "lost-diver-search",
      title: "Lost Diver Search & Rescue",
      difficulty: "Advanced",
      duration: "50 minutes",
      scenario: "A diver has missed their scheduled check-in by 15 minutes. Last known position was near underwater obstructions.",
      objectives: [
        "Organize systematic search pattern",
        "Deploy backup divers safely",
        "Coordinate with surface vessels",
        "Maintain communication protocols"
      ],
      challenges: [
        "Time pressure affecting decision quality",
        "Limited underwater visibility",
        "Multiple team coordination",
        "Balancing speed vs. safety"
      ],
      tools: ["Search patterns chart", "Backup diving systems", "Surface communication", "GPS positioning"],
      outcome: "Locate missing diver and coordinate safe recovery operation."
    }
  ]
};

interface PracticeScenarioProps {
  trackSlug: string;
}

export default function PracticeScenario({ trackSlug }: PracticeScenarioProps) {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [scenarioPhase, setScenarioPhase] = useState<"briefing" | "active" | "debrief">("briefing");
  const [userActions, setUserActions] = useState<string[]>([]);

  const scenarios = PRACTICE_SCENARIOS[trackSlug as keyof typeof PRACTICE_SCENARIOS] || [];

  if (scenarios.length === 0) {
    return null;
  }

  const currentScenario = scenarios.find(s => s.id === selectedScenario);

  const startScenario = (scenarioId: string) => {
    setSelectedScenario(scenarioId);
    setScenarioPhase("briefing");
    setUserActions([]);
  };

  const beginScenario = () => {
    setScenarioPhase("active");
  };

  const completeScenario = () => {
    setScenarioPhase("debrief");
  };

  const resetScenario = () => {
    setSelectedScenario(null);
    setScenarioPhase("briefing");
    setUserActions([]);
  };

  if (!selectedScenario) {
    return (
      <Card className="mt-8 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader>
          <CardTitle className="text-xl text-green-900 flex items-center gap-2">
            <Play className="w-5 h-5" />
            Practice Scenarios
          </CardTitle>
          <p className="text-green-700">
            Test your skills with realistic diving scenarios based on real-world situations.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {scenarios.map((scenario) => (
              <div
                key={scenario.id}
                className="border border-green-200 rounded-lg p-4 hover:bg-green-50 transition-colors"
                data-testid={`scenario-card-${scenario.id}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-green-900">{scenario.title}</h3>
                  <div className="flex gap-2">
                    <Badge 
                      variant={scenario.difficulty === "Expert" ? "destructive" : scenario.difficulty === "Advanced" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {scenario.difficulty}
                    </Badge>
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {scenario.duration}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-green-700 mb-3">{scenario.scenario}</p>
                <div className="flex items-center gap-4 text-xs text-green-600">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {scenario.objectives.length} objectives
                  </span>
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {scenario.challenges.length} challenges
                  </span>
                  <span className="flex items-center gap-1">
                    <Wrench className="w-3 h-3" />
                    {scenario.tools.length} tools
                  </span>
                </div>
                <Button
                  onClick={() => startScenario(scenario.id)}
                  className="w-full mt-3 bg-green-600 hover:bg-green-700"
                  data-testid={`button-start-${scenario.id}`}
                >
                  Start Scenario
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentScenario) return null;

  return (
    <Card className="mt-8 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl text-green-900">{currentScenario.title}</CardTitle>
          <Button variant="outline" onClick={resetScenario} data-testid="button-exit-scenario">
            Exit Scenario
          </Button>
        </div>
        <div className="flex gap-2">
          <Badge variant={currentScenario.difficulty === "Expert" ? "destructive" : "default"}>
            {currentScenario.difficulty}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {currentScenario.duration}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {scenarioPhase === "briefing" && (
          <div className="space-y-6">
            <Alert className="border-blue-200 bg-blue-50">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Scenario:</strong> {currentScenario.scenario}
              </AlertDescription>
            </Alert>

            <div>
              <h3 className="font-semibold text-green-900 mb-3">Mission Objectives:</h3>
              <ul className="space-y-2">
                {currentScenario.objectives.map((objective, index) => (
                  <li key={index} className="flex items-start gap-2 text-green-800">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-600" />
                    {objective}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-green-900 mb-3">Expected Challenges:</h3>
              <ul className="space-y-2">
                {currentScenario.challenges.map((challenge, index) => (
                  <li key={index} className="flex items-start gap-2 text-amber-800">
                    <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-600" />
                    {challenge}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-green-900 mb-3">Available Tools:</h3>
              <div className="flex flex-wrap gap-2">
                {currentScenario.tools.map((tool, index) => (
                  <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                    {tool}
                  </Badge>
                ))}
              </div>
            </div>

            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Success Criteria:</strong> {currentScenario.outcome}
              </AlertDescription>
            </Alert>

            <Button
              onClick={beginScenario}
              className="w-full bg-green-600 hover:bg-green-700"
              data-testid="button-begin-scenario"
            >
              Begin Scenario
            </Button>
          </div>
        )}

        {scenarioPhase === "active" && (
          <div className="space-y-6">
            <Alert className="border-amber-200 bg-amber-50">
              <Play className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Scenario Active:</strong> Use your training to work through this situation step by step.
              </AlertDescription>
            </Alert>

            <div className="text-center py-12">
              <div className="text-6xl mb-4">🤿</div>
              <h3 className="text-xl font-semibold text-green-900 mb-4">You are now in the scenario</h3>
              <p className="text-green-700 mb-6">
                Apply your knowledge and training to handle this situation. Consider each step carefully.
              </p>
              <Button
                onClick={completeScenario}
                className="bg-green-600 hover:bg-green-700"
                data-testid="button-complete-scenario"
              >
                Complete Scenario
              </Button>
            </div>
          </div>
        )}

        {scenarioPhase === "debrief" && (
          <div className="space-y-6">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Scenario Complete!</strong> Well done working through this challenging situation.
              </AlertDescription>
            </Alert>

            <div>
              <h3 className="font-semibold text-green-900 mb-3">Key Learning Points:</h3>
              <ul className="space-y-2 text-green-800">
                <li>• Systematic approach to emergency situations</li>
                <li>• Importance of following established protocols</li>
                <li>• Communication and teamwork under pressure</li>
                <li>• Balancing speed with safety considerations</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={resetScenario}
                variant="outline"
                className="flex-1"
                data-testid="button-try-another"
              >
                Try Another Scenario
              </Button>
              <Button
                onClick={() => setScenarioPhase("briefing")}
                className="flex-1 bg-green-600 hover:bg-green-700"
                data-testid="button-retry-scenario"
              >
                Retry This Scenario
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}