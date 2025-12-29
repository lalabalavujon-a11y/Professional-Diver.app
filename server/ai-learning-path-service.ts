import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable must be set");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface UserProgress {
  userId: string;
  completedLessons: string[];
  currentTrack?: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  goals: string[];
  weakAreas: string[];
  strengths: string[];
  timeAvailable: number; // hours per week
  preferredLearningStyle: 'visual' | 'hands-on' | 'theoretical' | 'mixed';
  certificationGoals: string[];
}

export interface LearningPathSuggestion {
  id: string;
  title: string;
  description: string;
  estimatedDuration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tracks: {
    trackId: string;
    trackTitle: string;
    priority: number;
    reason: string;
    estimatedWeeks: number;
  }[];
  personalizedMessage: string;
  nextSteps: string[];
  prerequisites: string[];
  careerBenefits: string[];
}

export class AILearningPathService {
  
  async generateLearningPath(userProgress: UserProgress): Promise<LearningPathSuggestion> {
    try {
      const prompt = this.buildLearningPathPrompt(userProgress);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4", // the newest OpenAI model is "gpt-4" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an expert commercial diving education consultant with 20+ years of experience in professional diving training. You specialize in creating personalized learning paths for commercial divers based on their current skills, goals, and career aspirations. Your recommendations should be practical, industry-relevant, and aligned with commercial diving certification standards."
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

      const suggestion = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        id: `path-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: suggestion.title || "Personalized Learning Path",
        description: suggestion.description || "A customized learning journey based on your goals and progress.",
        estimatedDuration: suggestion.estimatedDuration || "8-12 weeks",
        difficulty: suggestion.difficulty || userProgress.skillLevel,
        tracks: suggestion.tracks || [],
        personalizedMessage: suggestion.personalizedMessage || "This path is designed specifically for your learning goals.",
        nextSteps: suggestion.nextSteps || ["Start with the recommended track", "Complete prerequisite courses"],
        prerequisites: suggestion.prerequisites || [],
        careerBenefits: suggestion.careerBenefits || ["Enhanced career prospects", "Industry certification"]
      };
    } catch (error) {
      console.error('Error generating learning path:', error);
      
      // Fallback to rule-based recommendation
      return this.generateFallbackLearningPath(userProgress);
    }
  }

  private buildLearningPathPrompt(userProgress: UserProgress): string {
    return `
As a commercial diving education expert, analyze this user's profile and create a personalized learning path recommendation.

User Profile:
- Current Skill Level: ${userProgress.skillLevel}
- Completed Lessons: ${userProgress.completedLessons.length} lessons
- Current Track: ${userProgress.currentTrack || 'None'}
- Goals: ${userProgress.goals.join(', ')}
- Weak Areas: ${userProgress.weakAreas.join(', ')}
- Strengths: ${userProgress.strengths.join(', ')}
- Time Available: ${userProgress.timeAvailable} hours per week
- Learning Style: ${userProgress.preferredLearningStyle}
- Certification Goals: ${userProgress.certificationGoals.join(', ')}

Available Training Tracks:
1. Inspection & Non-Destructive Testing (NDT) - Advanced underwater inspection techniques
2. Diver Medic Technician - Emergency medical response and diving medicine
3. Commercial Dive Supervisor - Leadership and dive operation management
4. Air Diver Certification - Fundamental air diving skills
5. Saturation Diver Training - Deep-sea saturation diving operations
6. Assistant Life Support Technician - Life support system operation
7. Life Support Technician (LST) - Advanced life support systems

Please respond with a JSON object containing:
{
  "title": "Descriptive title for the learning path",
  "description": "Detailed description explaining why this path suits the user",
  "estimatedDuration": "Time estimate (e.g., '6-8 weeks', '3-4 months')",
  "difficulty": "beginner|intermediate|advanced",
  "tracks": [
    {
      "trackId": "track-slug",
      "trackTitle": "Track Name",
      "priority": 1-5,
      "reason": "Why this track is recommended for this user",
      "estimatedWeeks": 2-8
    }
  ],
  "personalizedMessage": "Encouraging message tailored to their goals and situation",
  "nextSteps": ["Specific actionable steps they should take"],
  "prerequisites": ["Any requirements or preparation needed"],
  "careerBenefits": ["How this path advances their career"]
}

Consider:
- Their current skill level and experience
- Time constraints and learning preferences
- Career advancement opportunities
- Industry demand and certification value
- Logical skill progression and dependencies
- Personalization based on their specific goals and interests
`;
  }

  private generateFallbackLearningPath(userProgress: UserProgress): LearningPathSuggestion {
    // Rule-based fallback when AI is unavailable
    const tracks = this.getFallbackTracks(userProgress);
    
    return {
      id: `fallback-${Date.now()}`,
      title: "Recommended Learning Path",
      description: `Based on your ${userProgress.skillLevel} level and goals, we've created a structured learning path to advance your commercial diving career.`,
      estimatedDuration: "8-12 weeks",
      difficulty: userProgress.skillLevel,
      tracks,
      personalizedMessage: `Your ${userProgress.skillLevel} level experience and ${userProgress.timeAvailable} hours per week make this an ideal path for skill development.`,
      nextSteps: [
        "Review the recommended tracks below",
        "Start with the highest priority track",
        "Complete one track before moving to the next"
      ],
      prerequisites: userProgress.skillLevel === 'beginner' ? ["Basic diving certification"] : [],
      careerBenefits: [
        "Industry-recognized certifications",
        "Enhanced job opportunities",
        "Higher earning potential",
        "Professional skill advancement"
      ]
    };
  }

  private getFallbackTracks(userProgress: UserProgress) {
    const allTracks = [
      {
        trackId: "air-diver-certification",
        trackTitle: "Air Diver Certification",
        priority: userProgress.skillLevel === 'beginner' ? 1 : 3,
        reason: "Foundation skills for all commercial diving operations",
        estimatedWeeks: 4
      },
      {
        trackId: "inspection-ndt",
        trackTitle: "Inspection & Non-Destructive Testing (NDT)",
        priority: 2,
        reason: "High demand in commercial diving industry",
        estimatedWeeks: 6
      },
      {
        trackId: "diver-medic-technician",
        trackTitle: "Diver Medic Technician",
        priority: userProgress.goals.includes('safety') ? 1 : 2,
        reason: "Essential safety skills for diving operations",
        estimatedWeeks: 5
      },
      {
        trackId: "commercial-dive-supervisor",
        trackTitle: "Commercial Dive Supervisor",
        priority: userProgress.skillLevel === 'advanced' ? 1 : 4,
        reason: "Leadership role with career advancement potential",
        estimatedWeeks: 8
      }
    ];

    return allTracks
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 3);
  }

  async analyzeLearningStyle(completedLessons: string[], quizScores: number[]): Promise<{
    preferredStyle: 'visual' | 'hands-on' | 'theoretical' | 'mixed';
    confidence: number;
    recommendations: string[];
  }> {
    try {
      const prompt = `
Analyze this user's learning pattern and determine their preferred learning style:

Completed Lessons: ${completedLessons.length}
Average Quiz Score: ${quizScores.length ? (quizScores.reduce((a, b) => a + b, 0) / quizScores.length).toFixed(1) : 'N/A'}%

Based on completion patterns and performance, determine:
1. Preferred learning style (visual, hands-on, theoretical, mixed)
2. Confidence level (0-1)
3. Specific recommendations for optimizing their learning

Respond with JSON:
{
  "preferredStyle": "style",
  "confidence": 0.8,
  "recommendations": ["specific learning tips"]
}
`;

      const response = await openai.chat.completions.create({
        model: "gpt-4", // the newest OpenAI model is "gpt-4" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an educational psychologist specializing in adult learning and professional training analysis."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.5,
        max_tokens: 500
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Error analyzing learning style:', error);
      
      return {
        preferredStyle: 'mixed',
        confidence: 0.5,
        recommendations: [
          "Try different learning approaches to find what works best",
          "Combine visual aids with hands-on practice",
          "Take regular breaks to process information"
        ]
      };
    }
  }

  async generateCareerAdvice(userProgress: UserProgress): Promise<{
    careerPath: string;
    nextCertifications: string[];
    marketDemand: string;
    salaryProjection: string;
    timeToGoal: string;
  }> {
    try {
      const prompt = `
As a commercial diving career counselor, provide career guidance for this professional:

Current Status:
- Skill Level: ${userProgress.skillLevel}
- Completed Training: ${userProgress.completedLessons.length} lessons
- Goals: ${userProgress.goals.join(', ')}
- Certifications Sought: ${userProgress.certificationGoals.join(', ')}

Provide career guidance in JSON format:
{
  "careerPath": "Recommended career trajectory",
  "nextCertifications": ["List of relevant certifications to pursue"],
  "marketDemand": "Industry demand analysis",
  "salaryProjection": "Potential salary range with these skills",
  "timeToGoal": "Realistic timeline to achieve career goals"
}
`;

      const response = await openai.chat.completions.create({
        model: "gpt-4", // the newest OpenAI model is "gpt-4" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a commercial diving industry expert with deep knowledge of career paths, certifications, and market demands in the commercial diving sector."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.6,
        max_tokens: 800
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Error generating career advice:', error);
      
      return {
        careerPath: "Progressive advancement through specialized certifications",
        nextCertifications: ["NDT Inspection", "Dive Supervisor", "Advanced Life Support"],
        marketDemand: "Strong demand for certified commercial divers across offshore, marine construction, and inspection sectors",
        salaryProjection: "$55,000 - $120,000+ depending on specialization and experience",
        timeToGoal: "12-24 months with dedicated training"
      };
    }
  }
}

export const aiLearningPathService = new AILearningPathService();