import 'dotenv/config';
import OpenAI from 'openai';
import { type ChatCompletionCreateParams } from 'openai/resources/chat/completions';

export interface TrackDefinition {
  slug: string;
  title: string;
  standards: string[];
  certification: string;
  tutorName: string;
}

export interface LessonOutline {
  trackSlug: string;
  title: string;
  order: number;
  isFinal?: boolean;
}

export interface GeneratedLesson {
  content: string;
  objectives: string[];
  estimatedMinutes: number;
  quiz: {
    title: string;
    timeLimit: number;
    examType: 'QUIZ' | 'EXAM' | 'PRACTICE';
    passingScore: number;
    questions: Array<{
      prompt: string;
      options: string[];
      correctAnswer: string;
    }>;
  };
}

const DEFAULT_MODEL = process.env.CONTENT_GENERATION_MODEL || 'gpt-4o';
const DEFAULT_TEMPERATURE = Number(process.env.CONTENT_GENERATION_TEMPERATURE || 0.7);

export class ContentGeneratorService {
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      // The service can still be constructed, but any generate() call will throw.
      console.warn('⚠️ OPENAI_API_KEY missing. Content generation will fail until provided.');
      this.openai = null;
    } else {
      // Only create OpenAI client if API key is present and valid
      try {
        this.openai = new OpenAI({
          apiKey: apiKey,
        });
      } catch (error) {
        console.error('⚠️ Failed to initialize OpenAI client:', error);
        this.openai = null;
      }
    }
  }

  async generateLesson(
    track: TrackDefinition,
    outline: LessonOutline,
    lessonCount: number
  ): Promise<GeneratedLesson> {
    const objectives = this.buildObjectives(outline.title, outline.isFinal);

    const prompt = this.buildPrompt(track, outline, objectives, lessonCount);
    const response = await this.callOpenAI(prompt);

    const content = response.content ?? '';
    const quiz = this.buildQuiz(track, outline, response.quiz);

    return {
      content,
      objectives,
      estimatedMinutes: outline.isFinal ? 60 : 45,
      quiz,
    };
  }

  private buildObjectives(title: string, isFinal?: boolean): string[] {
    if (isFinal) {
      return [
        'Complete comprehensive assessment of course knowledge and skills',
        'Demonstrate readiness for professional certification examination',
        'Apply all learned concepts in complex real-world scenarios',
        'Understand certification requirements and ongoing competency maintenance',
        'Prepare for professional career advancement in commercial diving',
      ];
    }

    return [
      `Master ${title} principles and industry-standard procedures`,
      'Understand safety protocols and risk management requirements',
      'Apply practical techniques in real-world commercial diving scenarios',
      'Demonstrate competency for certification preparation',
      'Maintain current knowledge of industry standards and best practices',
    ];
  }

  private buildPrompt(
    track: TrackDefinition,
    outline: LessonOutline,
    objectives: string[],
    lessonCount: number
  ): ChatCompletionCreateParams.CreateChatCompletionRequest {
    const sections = [
      `Track: ${track.title}`,
      `Lesson: ${outline.title} (Lesson ${outline.order} of ${lessonCount})`,
      `Certification: ${track.certification}`,
      `Industry Standards: ${track.standards.join(', ')}`,
      `Tutor: ${track.tutorName}`,
      '',
      'Write comprehensive, brand-neutral lesson content in Markdown with these sections:',
      '- Title',
      '- Introduction',
      '- Industry Standards and Regulations',
      '- Core Concepts (technical depth, procedures, parameters)',
      '- Practical Applications',
      '- Safety Protocols',
      '- Practice Scenarios (2 scenarios)',
      '- Assessment Preparation',
      outline.isFinal ? '- Final Assessment & Certification Preparation' : '- Next Steps',
      '',
      'Tone: professional, precise, safety-first, exam-prep oriented.',
      'Avoid vendor or brand names. Reference standards only.',
      'Include measurable details (parameters, limits, tables, checkpoints) where relevant.',
      '',
      'Return a JSON object with keys: content (markdown string), quiz (array of Q&A).',
      'Quiz: 5 questions (or 10 if final lesson), multiple-choice, include correctAnswer.',
      '',
      'Learning Objectives:',
      ...objectives.map((o, i) => `${i + 1}. ${o}`),
    ].join('\n');

    return {
      model: DEFAULT_MODEL,
      temperature: DEFAULT_TEMPERATURE,
      messages: [
        {
          role: 'system',
          content:
            'You are a senior commercial diving training author. You produce industry-standard, brand-neutral training content aligned with IMCA, ADCI, OSHA, HSE, AWS, API, and UHMS standards. Be concise, actionable, and safety-first.',
        },
        { role: 'user', content: sections },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 3000,
    };
  }

  private async callOpenAI(
    request: ChatCompletionCreateParams.CreateChatCompletionRequest
  ): Promise<{ content?: string; quiz?: any[] }> {
    if (!this.openai) {
      throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable.');
    }
    
    const response = await this.openai.chat.completions.create(request);
    const raw = response.choices[0]?.message?.content;
    if (!raw) {
      throw new Error('Empty response from OpenAI');
    }
    try {
      return JSON.parse(raw) as { content?: string; quiz?: any[] };
    } catch (err) {
      console.warn('⚠️ Failed to parse JSON, returning raw content');
      return { content: raw };
    }
  }

  private buildQuiz(
    track: TrackDefinition,
    outline: LessonOutline,
    quizItems?: any[]
  ): GeneratedLesson['quiz'] {
    const count = outline.isFinal ? 10 : 5;
    const questions =
      quizItems?.slice(0, count).map((q, idx) => ({
        prompt: q.prompt || `Question ${idx + 1} for ${outline.title}`,
        options: q.options || ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: q.correctAnswer || (q.options?.[0] ?? 'Option A'),
      })) ??
      Array.from({ length: count }, (_, idx) => ({
        prompt: `Which standard is most applicable to ${outline.title}?`,
        options: [
          track.standards[0] ?? 'IMCA',
          track.standards[1] ?? 'ADCI',
          'OSHA',
          'HSE',
        ],
        correctAnswer: track.standards[0] ?? 'IMCA',
      }));

    return {
      title: `${outline.title} - Assessment`,
      timeLimit: outline.isFinal ? 45 : 30,
      examType: outline.isFinal ? 'EXAM' : 'QUIZ',
      passingScore: 80,
      questions,
    };
  }
}

export default ContentGeneratorService;
