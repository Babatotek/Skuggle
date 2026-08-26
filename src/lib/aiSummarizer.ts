import { ResourceItem, ResourceAISummary } from '../types';

export type SummaryLevel = 'standard' | 'simplified' | 'exam_prep';

/**
 * Calls server-side Gemini 3.7 Flash API to generate or refresh a concise student quick preview summary.
 * If server is unavailable, seamlessly falls back to a deterministic, high-quality pedagogical summary.
 */
export async function generateResourceAISummary(
  resource: ResourceItem,
  level: SummaryLevel = 'standard'
): Promise<ResourceAISummary> {
  try {
    const response = await fetch('/api/ai/summarize-resource', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: resource.title,
        description: resource.description,
        subject: resource.subject,
        classLevels: resource.classLevels,
        contentPreview: resource.contentPreview,
        ocrText: resource.ocrText,
        fileFormat: resource.fileFormat,
        folderCategory: resource.folderCategory,
        tags: resource.tags,
        level,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.summary) {
        return data.summary;
      }
    }
  } catch (error) {
    console.warn('Network error reaching Gemini summarizer endpoint, using client-side fallback:', error);
  }

  // Client-Side Pedagogical Fallback Generator
  return createClientFallbackSummary(resource, level);
}

/**
 * Deterministic, domain-informed fallback summarizer for Nigerian secondary school curriculum
 */
export function createClientFallbackSummary(
  resource: ResourceItem,
  level: SummaryLevel = 'standard'
): ResourceAISummary {
  const title = resource.title || 'Educational Resource';
  const subject = resource.subject || 'Academic Studies';
  const category = resource.folderCategory || 'Study Guide';
  const classes = resource.classLevels && resource.classLevels.length > 0 ? resource.classLevels.join(', ') : 'Secondary Level';

  let brief = `This ${category.toLowerCase()} on ${title} provides a step-by-step breakdown of fundamental concepts for ${classes} students. It simplifies core theoretical definitions, problem-solving methods, and typical questions encountered in ${subject}.`;
  
  let takeaways: string[] = [
    `Understand the primary principles, definitions, and real-world significance of ${title}.`,
    `Apply systematic steps to solve standard exercises and homework questions without missing intermediate work.`,
    `Identify key keywords and terminology evaluated in ${subject} marking schemes.`
  ];

  let concepts: string[] = [
    `${title.split(':')[0] || title}`,
    `${subject} Core Theory`,
    'Problem Solving Flow',
    'NERDC Curriculum'
  ];

  let tip = `Always write out the complete formula and intermediate calculation steps before arriving at your final answer to secure full marks.`;

  // Specific domain customizations
  const lower = (resource.title + ' ' + (resource.description || '') + ' ' + (resource.ocrText || '')).toLowerCase();

  if (lower.includes('algebra') || lower.includes('fraction') || lower.includes('equation') || subject.toLowerCase().includes('math')) {
    if (level === 'simplified') {
      brief = `Think of algebraic fractions just like pizza slices with letters! In this guide, you will learn how to find common denominators (LCM) so you can add and subtract algebraic terms with ease.`;
    } else if (level === 'exam_prep') {
      brief = `High-yield WAEC/BECE Mathematics breakdown focusing on algebraic fractions, LCM of composite polynomials, and equation simplification traps.`;
    } else {
      brief = `Master algebraic fraction simplification, lowest common multiple (LCM) factorizations, and systematic equation solving tailored for ${classes} students.`;
    }
    takeaways = [
      'Calculate the Lowest Common Multiple (LCM) for numerical and variable denominators.',
      'Combine fractions across addition and subtraction by converting to equivalent numerators.',
      'Avoid illegal cancellation across "+" or "-" signs before complete factorization.'
    ];
    concepts = ['LCM of Algebraic Denominators', 'Complete Factorization', 'Cross Multiplication', 'Simplest Form'];
    tip = 'Common Pitfall: Never cancel out terms directly across a plus (+) or minus (-) sign. Factorize the entire numerator and denominator first!';
  } else if (lower.includes('projectile') || lower.includes('motion') || lower.includes('physics')) {
    if (level === 'simplified') {
      brief = `When you kick a football into the air, it curves in a parabola. This physics guide explains how gravity pulls it down while forward speed carries it across the field!`;
    } else if (level === 'exam_prep') {
      brief = `Essential WAEC Physics formulas and derivations for Projectile Motion: Maximum Height, Time of Flight, and Maximum Horizontal Range at 45 degrees.`;
    } else {
      brief = `Comprehensive physics tutorial on kinematics in two dimensions, vector resolution into horizontal and vertical components, and equations of motion under constant gravity.`;
    }
    takeaways = [
      'Resolve initial velocity (u) into horizontal (u cos θ) and vertical (u sin θ) components.',
      'Derive and calculate Maximum Height: H_max = (u² sin² θ) / (2g).',
      'Calculate Total Time of Flight: T = (2u sin θ) / g, and Horizontal Range: R = (u² sin 2θ) / g.'
    ];
    concepts = ['Trajectory Parabola', 'Time of Flight (T)', 'Maximum Height (H_max)', 'Horizontal Range (R)', 'Vector Resolution'];
    tip = 'Exam Tip: In horizontal projectile calculations, horizontal acceleration is always zero (ax = 0), meaning horizontal speed never changes in ideal flight.';
  } else if (lower.includes('bond') || lower.includes('periodic') || subject.toLowerCase().includes('chemistry')) {
    brief = `Explore how atoms achieve stable octet/duplet configurations by transferring or sharing electrons to form ionic, covalent, metallic, and coordinate dative bonds.`;
    takeaways = [
      'Differentiate between electrovalent electron transfer (metals to non-metals) and covalent sharing (non-metals).',
      'Draw electronic Lewis dot-and-cross diagrams showing outer valence shells.',
      'Explain physical properties like high melting points and aqueous electrical conductivity.'
    ];
    concepts = ['Octet Rule', 'Electrovalent (Ionic) Bond', 'Covalent Bond', 'Coordinate Dative Bond', 'Lewis Dot Structures'];
    tip = 'WAEC Chemistry Tip: Coordinate (dative) bonds must always be drawn with a single arrow (→) showing electron pair donation from donor to acceptor.';
  } else if (lower.includes('essay') || lower.includes('writing') || subject.toLowerCase().includes('english')) {
    brief = `Master the art of scoring high marks in WAEC essay writing using the proven PEEL paragraph framework, rich transitional connectors, and strong thesis statements.`;
    takeaways = [
      'Structure every body paragraph with Point, Evidence, Elaboration, and Link (PEEL).',
      'Use sophisticated transitions like "Furthermore", "In stark contrast", and "Consequently".',
      'Avoid mechanical errors (spelling and punctuation) that deduct marks in WAEC scoring rubrics.'
    ];
    concepts = ['Thesis Statement', 'PEEL Technique', 'Transitional Devices', 'WAEC Marking Rubrics'];
    tip = 'WAEC English Tip: Deductions of 1/2 mark are levied on every single spelling or punctuation mistake under Mechanical Accuracy (10 marks total).';
  } else if (lower.includes('python') || lower.includes('code') || subject.toLowerCase().includes('computer')) {
    brief = `An interactive student introduction to Python programming covering variables, conditional statements (if/elif/else), loops, and algorithm logic.`;
    takeaways = [
      'Write and execute basic Python scripts with correct indentation syntax.',
      'Understand variable types: strings, integers, floats, and booleans.',
      'Implement while and for loops to automate repetitive calculations.'
    ];
    concepts = ['Python Syntax', 'Variables & Data Types', 'Conditional Logic', 'For/While Loops', 'Algorithm Flow'];
    tip = 'Coding Tip: Python uses strict indentation (4 spaces) rather than curly braces to define code blocks. Be consistent with whitespace!';
  }

  return {
    briefSummary: brief,
    keyTakeaways: takeaways,
    coreConcepts: concepts,
    studentActionableTip: tip,
    readingLevel: `${classes} (NERDC / WAEC Aligned)`,
    estimatedReadTime: '2 min quick read',
    targetExam: level === 'exam_prep' ? 'WAEC & NECO Past Questions' : 'Class Tests & Terminal Exams',
    generatedAt: new Date().toISOString(),
    model: 'Skuggle AI Tutor (Offline Mode)',
  };
}

/**
 * Text-to-Speech Web Speech API Integration for Audio Narration
 */
let currentUtterance: SpeechSynthesisUtterance | null = null;

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function speakSummaryText(
  text: string,
  rate: number = 1.0,
  onEnd?: () => void,
  onError?: () => void
): boolean {
  if (!isSpeechSynthesisSupported()) return false;

  stopSummarySpeech();

  try {
    const cleanText = text.replace(/[*_#`[\]()]/g, ' ');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = rate;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    utterance.onend = () => {
      currentUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      currentUtterance = null;
      if (onError) onError();
    };

    currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.error('Speech synthesis error:', err);
    return false;
  }
}

export function pauseSummarySpeech(): void {
  if (isSpeechSynthesisSupported() && window.speechSynthesis.speaking) {
    window.speechSynthesis.pause();
  }
}

export function resumeSummarySpeech(): void {
  if (isSpeechSynthesisSupported() && window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }
}

export function stopSummarySpeech(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
}
