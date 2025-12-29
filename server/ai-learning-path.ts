import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable must be set");
}

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface UserProfile {
  experience: string;
  goals: string[];
  timeCommitment: string;
  certifications: string[];
  interests: string[];
}

interface TrackInfo {
  id: string;
  title: string;
  slug: string;
  summary: string;
  difficulty: string;
  prerequisites: string[];
  specialization: string;
}

interface LearningPathSuggestion {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  estimatedWeeks: number;
  tracks: Array<{
    id: string;
    title: string;
    slug: string;
    order: number;
    reason: string;
  }>;
  confidence: number;
  reasoning: string;
}

export class AILearningPathService {
  private availableTracks: TrackInfo[] = [
    {
      id: "1",
      title: "Assistant Life Support Technician",
      slug: "air-diving-life-support-technician",
      summary: "Foundation course for air diving support operations and safety systems",
      difficulty: "Beginner",
      prerequisites: [],
      specialization: "Assistant Life Support Technician"
    },
    {
      id: "2", 
      title: "Life Support Technician (LST)",
      slug: "life-support-technician",
      summary: "Advanced life support systems for commercial diving operations",
      difficulty: "Intermediate",
      prerequisites: ["Assistant Life Support Technician"],
      specialization: "LST"
    },
    {
      id: "3",
      title: "Diver Medic Technician (DMT)",
      slug: "diver-medic-technician", 
      summary: "Emergency medical training for diving operations and hyperbaric medicine",
      difficulty: "Advanced",
      prerequisites: ["Assistant Life Support Technician"],
      specialization: "DMT"
    },
    {
      id: "4",
      title: "Non Destructive Testing Underwater Inspection (NDT)",
      slug: "non-destructive-testing-underwater-inspection",
      summary: "Specialized underwater inspection techniques and equipment certification",
      difficulty: "Advanced", 
      prerequisites: ["Assistant Life Support Technician", "Commercial Experience"],
      specialization: "NDT"
    },
    {
      id: "5",
      title: "Commercial Dive Supervisor Training",
      slug: "commercial-dive-supervisor-training",
      summary: "Leadership and management training for commercial diving operations",
      difficulty: "Expert",
      prerequisites: ["LST", "DMT", "Experience"],
      specialization: "Commercial Dive Supervisor"
    },
    {
      id: "6",
      title: "Surface Supply Enclosed Diving (SSED)",
      slug: "surface-supply-enclosed-diving",
      summary: "Specialized training for surface-supplied diving in enclosed environments", 
      difficulty: "Intermediate",
      prerequisites: ["Assistant Life Support Technician"],
      specialization: "SSED"
    },
    {
      id: "7",
      title: "Saturation Diver Training (SAT)",
      slug: "saturation-diver-training",
      summary: "Advanced saturation diving techniques for deep water operations",
      difficulty: "Expert", 
      prerequisites: ["LST", "SSED", "Commercial Experience"],
      specialization: "SAT"
    }
  ];

  async generateLearningPath(
    userProfile: UserProfile,
    additionalInfo?: string
  ): Promise<LearningPathSuggestion[]> {
    try {
      const prompt = this.buildAnalysisPrompt(userProfile, additionalInfo);
      
      const response = await openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You are an expert diving training advisor with 30+ years of experience in commercial diving education. You specialize in creating personalized learning paths for professional divers based on industry standards (IMCA, ADCI, etc.).

Your task is to analyze user profiles and recommend optimal learning sequences from available diving training tracks. Always prioritize safety, industry standards, and career progression logic.

Respond with a JSON array containing 2-3 learning path suggestions, each with this structure:
{
  "id": "path-1",
  "title": "Career-focused title", 
  "description": "Brief description of the path",
  "difficulty": "Beginner|Intermediate|Advanced|Expert",
  "estimatedWeeks": number,
  "tracks": [
    {
      "id": "track-id",
      "title": "Track Title",
      "slug": "track-slug", 
      "order": 1,
      "reason": "Why this track at this position"
    }
  ],
  "confidence": 85,
  "reasoning": "Detailed explanation of why this path suits the user"
}`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 2000
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      if (result.suggestions && Array.isArray(result.suggestions)) {
        return result.suggestions;
      } else if (Array.isArray(result)) {
        return result;
      } else {
        // Fallback to create a single suggestion
        return [this.createFallbackSuggestion(userProfile)];
      }
    } catch (error) {
      console.error("AI Learning Path Generation Error:", error);
      throw new Error("Failed to generate AI learning path suggestions");
    }
  }

  private buildAnalysisPrompt(userProfile: UserProfile, additionalInfo?: string): string {
    const tracksDescription = this.availableTracks.map(track => 
      `${track.title} (${track.slug}): ${track.summary} - Difficulty: ${track.difficulty}, Prerequisites: [${track.prerequisites.join(", ") || "None"}]`
    ).join("\n");

    return `
Analyze this diving professional's profile and create personalized learning path recommendations:

USER PROFILE:
- Experience Level: ${userProfile.experience}
- Career Goals: ${userProfile.goals.join(", ")}
- Time Commitment: ${userProfile.timeCommitment}
- Current Certifications: ${userProfile.certifications.join(", ") || "None"}
- Areas of Interest: ${userProfile.interests.join(", ") || "None"}
${additionalInfo ? `- Additional Information: ${additionalInfo}` : ""}

AVAILABLE TRAINING TRACKS:
${tracksDescription}

REQUIREMENTS:
1. Create 2-3 different learning path options
2. Ensure logical prerequisite progression (Assistant Life Support Technician before LST, etc.)
3. Match tracks to user's goals and experience level
4. Consider time commitment for realistic timelines
5. Provide clear reasoning for each recommendation
6. Use industry-standard progression paths
7. Include confidence scores (70-95% realistic range)

Focus on career advancement, safety certification requirements, and industry demand for the specializations.
`;
  }

  private createFallbackSuggestion(userProfile: UserProfile): LearningPathSuggestion {
    // Create a basic learning path as fallback
    const isBeginnerLevel = userProfile.experience.toLowerCase().includes("beginner") || 
                           userProfile.experience.toLowerCase().includes("new");
    
    if (isBeginnerLevel) {
      return {
        id: "beginner-path",
        title: "Foundation Commercial Diving Path",
        description: "Start your commercial diving career with essential certifications",
        difficulty: "Beginner",
        estimatedWeeks: 12,
        tracks: [
          {
            id: "1",
            title: "Assistant Life Support Technician",
            slug: "air-diving-life-support-technician",
            order: 1,
            reason: "Essential foundation for all commercial diving operations"
          }
        ],
        confidence: 85,
        reasoning: "As a beginner, starting with Assistant Life Support Technician provides the fundamental knowledge and certification required for entry into commercial diving."
      };
    }

    return {
      id: "intermediate-path",
      title: "Professional Development Path",
      description: "Advance your diving career with specialized certifications",
      difficulty: "Intermediate", 
      estimatedWeeks: 20,
      tracks: [
        {
          id: "2",
          title: "Life Support Technician (LST)",
          slug: "life-support-technician",
          order: 1,
          reason: "Advanced life support skills for complex operations"
        },
        {
          id: "3", 
          title: "Diver Medic Technician (DMT)",
          slug: "diver-medic-technician",
          order: 2,
          reason: "Medical emergency response capabilities"
        }
      ],
      confidence: 80,
      reasoning: "Building on your experience, these certifications will enhance your value and safety capabilities in commercial diving operations."
    };
  }
}