/**
 * Content Parser for Client Representative Course
 * 
 * This script parses the provided text content to extract all modules,
 * questions, and scenarios into structured data format.
 */

import { writeFileSync } from 'fs';
import { Module, MCQ, ShortAnswer, Scenario } from './client-rep-content-data.js';

/**
 * Parse MCQs from text content
 */
function parseMCQs(text: string): MCQ[] {
  const mcqs: MCQ[] = [];
  // Pattern: Question text, then options A-D, then "Answer: X"
  const questionBlocks = text.split(/(?=^[A-Z][^:]*:)/m);
  
  for (const block of questionBlocks) {
    const lines = block.trim().split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length < 3) continue;
    
    const prompt = lines[0].replace(/^\d+\.\s*/, '').trim();
    if (!prompt || prompt.length < 10) continue;
    
    const options: string[] = [];
    let answer = 'b';
    let explanation = '';
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.match(/^[A-F]\.\s/)) {
        options.push(line.substring(2).trim());
      } else if (line.match(/^Answer:/i)) {
        const match = line.match(/Answer:\s*([A-F]|True|False|C\/B\*)/i);
        if (match) {
          answer = match[1].toLowerCase();
          if (answer === 'c/b*') answer = 'b'; // Handle special case
        }
      } else if (line.match(/^Explanation:/i)) {
        explanation = line.substring(11).trim();
      }
    }
    
    if (prompt && options.length >= 2) {
      mcqs.push({ prompt, options, correctAnswer: answer, explanation: explanation || undefined });
    }
  }
  
  return mcqs;
}

/**
 * Parse True/False questions
 */
function parseTrueFalse(text: string): MCQ[] {
  const mcqs: MCQ[] = [];
  const lines = text.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Pattern: Statement. Answer: True/False
    const match = line.match(/^(.+?)\s+Answer:\s+(True|False)$/i);
    if (match) {
      mcqs.push({
        prompt: match[1].trim(),
        options: ['True', 'False'],
        correctAnswer: match[2].toLowerCase(),
      });
    }
  }
  
  return mcqs;
}

/**
 * Parse short-answer questions
 */
function parseShortAnswers(text: string): ShortAnswer[] {
  const sas: ShortAnswer[] = [];
  // Pattern: Question text, then "Model points:" followed by list
  const blocks = text.split(/(?=^[A-Z][^:]*:)/m);
  
  for (const block of blocks) {
    if (!block.includes('Model points')) continue;
    
    const lines = block.split('\n').map(l => l.trim()).filter(l => l);
    const prompt = lines[0].replace(/^\d+\.\s*/, '').trim();
    
    const modelPoints: string[] = [];
    let inModelPoints = false;
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.match(/Model points?:/i)) {
        inModelPoints = true;
        continue;
      }
      if (inModelPoints) {
        if (line.match(/^[-*•]\s/) || line.match(/^\d+\.\s/)) {
          modelPoints.push(line.replace(/^[-*•]\s/, '').replace(/^\d+\.\s/, '').trim());
        } else if (line && !line.match(/^[A-Z]/)) {
          modelPoints.push(line);
        } else if (line.match(/^[A-Z]/) && modelPoints.length > 0) {
          break;
        }
      }
    }
    
    if (prompt && modelPoints.length > 0) {
      sas.push({ prompt, modelPoints, points: 5 });
    }
  }
  
  return sas;
}

/**
 * Parse scenarios
 */
function parseScenarios(text: string): Scenario[] {
  const scenarios: Scenario[] = [];
  // Pattern: Scenario X – Title: Description. Task: ...
  const scenarioBlocks = text.split(/(?=Scenario \d+)/i);
  
  for (const block of scenarioBlocks) {
    if (!block.trim()) continue;
    
    const lines = block.split('\n').map(l => l.trim()).filter(l => l);
    const titleMatch = lines[0].match(/Scenario \d+\s*[–-]\s*(.+)/);
    if (!titleMatch) continue;
    
    const title = titleMatch[1].trim();
    let description = '';
    let task = '';
    let expectedApproach = '';
    let rubric = '';
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.match(/^Task:/i)) {
        task = line.substring(5).trim();
      } else if (line.match(/^Expected approach:/i)) {
        expectedApproach = line.substring(16).trim();
      } else if (line.match(/^Rubric:/i)) {
        rubric = line.substring(7).trim();
      } else if (line && !line.match(/^(Task|Expected|Rubric):/i)) {
        if (!description) description = line;
        else description += ' ' + line;
      }
    }
    
    scenarios.push({
      title,
      description: description || title,
      task: task || 'Complete the scenario as described.',
      expectedApproach,
      rubric,
      difficulty: 'intermediate'
    });
  }
  
  return scenarios;
}

/**
 * Main parsing function - extracts all content from provided text
 */
export function parseClientRepContent(fullText: string): Module[] {
  const modules: Module[] = [];
  
  // Split by module markers
  const moduleSections = fullText.split(/(?=Module \d+ —)/i);
  
  for (const section of moduleSections) {
    if (!section.trim()) continue;
    
    // Extract module number and title
    const headerMatch = section.match(/Module (\d+) — (.+?)(?:\n|$)/);
    if (!headerMatch) continue;
    
    const moduleNum = parseInt(headerMatch[1]);
    const moduleTitle = headerMatch[2].trim();
    
    // Extract description (usually on next line or in "Key competence:" line)
    const descMatch = section.match(/Key competence:\s*(.+?)(?:\n|$)/i) || 
                     section.match(/Competence:\s*(.+?)(?:\n|$)/i);
    const description = descMatch ? descMatch[1].trim() : moduleTitle;
    
    // Extract MCQs
    const mcqs = parseMCQs(section);
    const trueFalse = parseTrueFalse(section);
    const allMCQs = [...mcqs, ...trueFalse];
    
    // Extract short answers
    const shortAnswers = parseShortAnswers(section);
    
    // Extract scenarios
    const scenarios = parseScenarios(section);
    
    // Extract learning outcomes (if present)
    const learningOutcomes: string[] = [];
    const outcomesMatch = section.match(/Learning Outcomes[:\s]*(.+?)(?=\n\n|##|$)/is);
    if (outcomesMatch) {
      const outcomesText = outcomesMatch[1];
      const outcomeLines = outcomesText.split('\n').map(l => l.trim()).filter(l => l);
      for (const line of outcomeLines) {
        if (line.match(/^[-*•]\s/) || line.match(/^\d+\.\s/)) {
          learningOutcomes.push(line.replace(/^[-*•]\s/, '').replace(/^\d+\.\s/, '').trim());
        }
      }
    }
    
    // Extract content (everything except questions)
    let content = section;
    // Remove question sections
    content = content.replace(/MCQs?[:\s]*\d+[^]*?(?=Short|Scenario|Module|$)/gi, '');
    content = content.replace(/Short[-\s]?Answer[^]*?(?=Scenario|Module|$)/gi, '');
    content = content.replace(/Scenario[^]*?(?=Module|$)/gi, '');
    
    modules.push({
      id: moduleNum,
      title: moduleTitle,
      description,
      learningOutcomes: learningOutcomes.length > 0 ? learningOutcomes : [
        `Understand key concepts in ${moduleTitle}`,
        `Apply knowledge to practical situations`,
        `Demonstrate competency through assessment`
      ],
      content: content.trim() || `# ${moduleTitle}\n\n${description}`,
      mcqs: allMCQs,
      shortAnswers: shortAnswers.length > 0 ? shortAnswers : undefined,
      scenarios: scenarios.length > 0 ? scenarios : undefined
    });
  }
  
  return modules;
}

// Export for use in import script
export { parseClientRepContent };
