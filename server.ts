import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import compression from "compression";

dotenv.config({ quiet: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function isLaravelProxyPath(pathname: string): boolean {
  return (
    pathname.startsWith('/api/v1') ||
    pathname.startsWith('/sanctum') ||
    pathname === '/health' ||
    pathname === '/ready' ||
    pathname === '/startup' ||
    pathname === '/live'
  );
}

async function startServer() {
  const app = express();
  const port = Number.parseInt(process.env.PORT ?? '3000', 10);
  const host = process.env.HOST ?? '0.0.0.0';

  // Enable gzip compression for all responses
  app.use(compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6, // Balance between speed and compression ratio
  }));

  let viteMiddleware: express.RequestHandler | null = null;
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : undefined,
      },
      appType: 'spa',
    });
    viteMiddleware = vite.middlewares;
    // Forward Laravel auth/API traffic before express.json() so POST bodies reach the backend.
    app.use((req, res, next) => {
      if (isLaravelProxyPath(req.path)) {
        return viteMiddleware!(req, res, next);
      }
      next();
    });
  }

  app.use(express.json());

  // Lazy-initialize Gemini client
  let aiClient: GoogleGenAI | null = null;
  function getAIClient(): GoogleGenAI | null {
    if (!aiClient && process.env.GEMINI_API_KEY) {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return aiClient;
  }

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Gemini Lesson Plan Generator
  app.post("/api/gemini/lesson-plan", async (req, res) => {
    try {
      const { subject, topic, level, duration, curriculum, teachingStyle, objectives } = req.body;
      const ai = getAIClient();

      if (!ai) {
        // Safe fallback response if API key is not yet configured
        return res.json({
          fallback: true,
          plan: {
            title: `Lesson Plan: ${topic || "Selected Topic"} (${subject || "General"})`,
            level: level || "Junior Secondary (JSS 2)",
            duration: duration || "40 Minutes",
            curriculum: curriculum || "NERDC Nigerian Curriculum",
            theme: subject ? `${subject} Core Fundamentals` : "Standard Curriculum",
            behavioralObjectives: [
              `By the end of the lesson, learners should be able to define and explain the fundamental concepts of ${topic || "the topic"}.`,
              `Learners should be able to identify at least 3 practical examples in daily Nigerian contexts.`,
              `Learners should be able to solve basic exercise questions independently.`,
            ],
            instructionalMaterials: [
              "Whiteboard and marker",
              "Illustrated visual chart / real-life models",
              "Skuggle student activity worksheet",
            ],
            previousKnowledge: `Learners have prior exposure to prerequisite concepts from earlier terms.`,
            introduction: `Warm-up question connecting the lesson to familiar Nigerian everyday experiences (5 minutes).`,
            activities: [
              {
                step: "Step 1: Concept Exploration (10 mins)",
                teacherActivity: `Explain the key definitions and demonstrate with practical classroom illustrations.`,
                learnerActivity: `Take guided notes, observe illustrations, and answer introductory checks.`,
              },
              {
                step: "Step 2: Guided Practice & Discussion (15 mins)",
                teacherActivity: `Guide groups through solved examples on the board, addressing common misconceptions.`,
                learnerActivity: `Work in peer pairs to solve prompt problems and present reasoning.`,
              },
              {
                step: "Step 3: Independent Application (10 mins)",
                teacherActivity: `Monitor learner progress around the room, noting learners requiring extra support.`,
                learnerActivity: `Complete the 3-question formative assessment independently.`,
              },
            ],
            evaluation: [
              `1. State the primary definition of ${topic || "the topic"}.`,
              `2. Mention two key importance or applications.`,
              `3. Solve the quick practice problem provided.`,
            ],
            homework: `Read ahead in the approved textbook and complete questions 1-5 on page 42.`,
            provenance: "Curriculum-aligned template. Review and customize before final classroom use.",
          },
        });
      }

      const prompt = `You are an expert Nigerian educational curriculum specialist and teacher aid on the Skuggle platform.
Create a detailed, high-quality, practical lesson plan following the NERDC (Nigerian Educational Research and Development Council) standard format.

Subject: ${subject || "Mathematics"}
Topic: ${topic || "Algebraic Expressions"}
Class/Level: ${level || "JSS 2"}
Duration: ${duration || "40 minutes"}
Curriculum standard: ${curriculum || "NERDC"}
Teaching preference/Style: ${teachingStyle || "Interactive & Practical"}
Specific teacher notes/objectives: ${objectives || "Focus on practical understanding and clear step-by-step reasoning"}

Respond with a strictly formatted JSON object matching this schema:
{
  "title": string,
  "level": string,
  "duration": string,
  "curriculum": string,
  "theme": string,
  "behavioralObjectives": string[],
  "instructionalMaterials": string[],
  "previousKnowledge": string,
  "introduction": string,
  "activities": [
    {
      "step": string,
      "teacherActivity": string,
      "learnerActivity": string
    }
  ],
  "evaluation": string[],
  "homework": string,
  "provenance": string
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          systemInstruction: "You are the Skuggle AI Teaching Assistant. Always output well-structured, culturally relevant Nigerian educational content with clear pedagogical rigor.",
        },
      });

      const text = response.text || "{}";
      const parsed = JSON.parse(text);
      res.json({ fallback: false, plan: parsed });
    } catch (err: any) {
      console.error("Gemini lesson plan error:", err);
      res.status(500).json({ error: "Failed to generate lesson plan", message: err.message });
    }
  });

  // Gemini Smart Question Generator
  app.post("/api/gemini/smart-questions", async (req, res) => {
    try {
      const { subject, topic, level, count = 5, type = "mixed" } = req.body;
      const ai = getAIClient();

      if (!ai) {
        return res.json({
          fallback: true,
          questions: [
            {
              id: "q1",
              type: "multiple-choice",
              question: `Which of the following is a primary characteristic of ${topic || "this subject"}?`,
              options: ["A) Standard Option 1", "B) Valid Key Option", "C) Alternative Option 3", "D) None of the above"],
              correctAnswer: "B",
              explanation: "Based on standard curriculum specifications, option B is correct.",
              difficulty: "Medium",
            },
            {
              id: "q2",
              type: "theory",
              question: `Explain in two clear points the significance of ${topic || "this topic"} in practical terms.`,
              rubric: "1 mark for definition, 2 marks for valid practical applications.",
              difficulty: "Hard",
            },
          ],
        });
      }

      const prompt = `Generate ${count} test/exam questions for Nigerian school assessment on Subject: "${subject}", Topic: "${topic}", Level: "${level}", Question Type: "${type}".
Return JSON format:
{
  "questions": [
    {
      "id": string,
      "type": "multiple-choice" | "theory",
      "question": string,
      "options": string[] (if multiple choice),
      "correctAnswer": string (e.g. "A" or explanation),
      "explanation": string,
      "rubric": string,
      "difficulty": "Easy" | "Medium" | "Hard"
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json({ fallback: false, questions: parsed.questions || [] });
    } catch (err: any) {
      console.error("Gemini questions error:", err);
      res.status(500).json({ error: "Failed to generate questions", message: err.message });
    }
  });

  // Skuggle Buddy AI Chat
  app.post("/api/gemini/buddy-chat", async (req, res) => {
    try {
      const { message, persona = "Teacher", context = {} } = req.body;
      const ai = getAIClient();

      if (!ai) {
        return res.json({
          reply: `Hello! I'm Skuggle, your AI learning and teaching buddy! 🤖 I see you're working in the ${persona} space. How can I assist you today with curriculum notes, attendance analysis, or lesson preparation?`,
        });
      }

      const systemPrompt = `You are Skuggle, the warm, intelligent, and supportive AI robot companion for Nigerian schools.
The user is currently a "${persona}". Context: ${JSON.stringify(context)}.
Your tone is friendly, encouraging, respectful, clear, and pedagogically sound. Keep answers concise, actionable, and visually formatted with neat bullet points when helpful.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: message,
        config: {
          systemInstruction: systemPrompt,
        },
      });

      res.json({ reply: response.text });
    } catch (err: any) {
      console.error("Gemini buddy chat error:", err);
      res.status(500).json({ error: "Failed to generate chat response", message: err.message });
    }
  });

  // Performance Intelligence Analyzer
  app.post("/api/gemini/performance-insight", async (req, res) => {
    try {
      const { classData, subject } = req.body;
      const ai = getAIClient();

      if (!ai) {
        return res.json({
          fallback: true,
          insight: {
            summary: `Performance in ${subject || "Class"} shows strong engagement with 78% average mastery. 3 learners require targeted intervention in algebraic operations.`,
            recommendations: [
              "Schedule a 15-minute concept reinforcement session on foundational arithmetic rules.",
              "Pair at-risk learners with peer study partners during Friday practical exercises.",
              "Send a brief encouraging progress update note to guardians.",
            ],
            atRiskLearners: ["Chinedu Okafor", "Fatima Abubakar", "Tunde Balogun"],
          },
        });
      }

      const prompt = `Analyze this Nigerian school class performance data and return actionable pedagogical insights:
Data: ${JSON.stringify(classData)}
Subject: ${subject}

Return JSON:
{
  "summary": string,
  "recommendations": string[],
  "atRiskLearners": string[]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" },
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json({ fallback: false, insight: parsed });
    } catch (err: any) {
      console.error("Gemini insight error:", err);
      res.status(500).json({ error: "Failed to analyze performance", message: err.message });
    }
  });

  // Assessment Studio: Comprehensive Exam, Test, Assignment & Quiz Generator
  app.post("/api/gemini/generate-assessment", async (req, res) => {
    try {
      const {
        assessmentType = "periodic-test", // 'terminal-exam' | 'periodic-test' | 'assignment' | 'quick-quiz'
        subject = "Mathematics",
        classLevel = "JSS 2",
        term = "1st Term",
        topics = "Linear Equations and Algebraic Expressions",
        totalMarks = 40,
        timeAllowed = "45 Minutes",
        mcqCount = 5,
        theoryCount = 2,
        difficulty = "Medium",
        instructions = "Answer all questions in Section A and chosen questions in Section B.",
        schoolName = "Crown Heights Int'l Academy",
      } = req.body;

      const ai = getAIClient();

      if (!ai) {
        // Fallback structured assessment data
        return res.json({
          fallback: true,
          assessment: {
            title: assessmentType === 'terminal-exam'
              ? `${term} Examination: ${subject}`
              : assessmentType === 'assignment'
              ? `Curriculum Assignment: ${subject}`
              : assessmentType === 'quick-quiz'
              ? `Diagnostic Quiz: ${subject}`
              : `Continuous Assessment Periodic Test: ${subject}`,
            schoolName,
            subject,
            classLevel,
            term,
            topics,
            timeAllowed,
            totalMarks,
            generalInstructions: instructions,
            sectionA: {
              title: "Section A: Multiple-Choice Questions (Objective)",
              instructions: "Choose the correct option from the lettered choices A - D.",
              totalMarks: mcqCount * 2,
              questions: Array.from({ length: mcqCount }).map((_, i) => ({
                number: i + 1,
                text: i === 0
                  ? `If 3x + 7 = 22, find the value of x in the equation.`
                  : i === 1
                  ? `Simplify the algebraic expression: 4(2a - 3b) + 5b.`
                  : `Evaluate the given expression when x = 3 and y = -2.`,
                options: [
                  "A) x = 3",
                  "B) x = 5",
                  "C) x = 7",
                  "D) x = 15",
                ],
                correctAnswer: "B",
                explanation: "Subtract 7 from both sides to get 3x = 15, then divide both sides by 3 to get x = 5.",
                marks: 2,
                cognitiveLevel: "Application",
              })),
            },
            sectionB: {
              title: "Section B: Structured & Theory Questions",
              instructions: "Show all working clearly. Marks will be awarded for orderly calculation.",
              totalMarks: totalMarks - mcqCount * 2,
              questions: Array.from({ length: theoryCount }).map((_, i) => ({
                number: i + 1,
                parts: [
                  {
                    subQuestion: `(a) Define what is meant by a linear equation in one variable with one standard example.`,
                    marks: 3,
                    markingGuide: "1 mark for formal definition, 2 marks for a well-formed mathematical equation example.",
                  },
                  {
                    subQuestion: `(b) Solve the simultaneous problem: 2x + y = 10 and x - y = 2. Find x and y.`,
                    marks: 7,
                    markingGuide: "3 marks for correct substitution/elimination step, 2 marks for value of x = 4, 2 marks for value of y = 2.",
                  },
                ],
              })),
            },
            markingScheme: {
              summary: "Full marking scheme and rubrics aligned with NERDC continuous assessment scoring guide.",
              gradeBoundaries: [
                { grade: "A1 (Distinction)", minScore: 75, description: "Exceptional mastery of concepts and calculation." },
                { grade: "B2 (Very Good)", minScore: 70, description: "Strong conceptual understanding with minor slip." },
                { grade: "C4 (Credit)", minScore: 60, description: "Satisfactory competence in standard problems." },
                { grade: "C6 (Pass)", minScore: 50, description: "Basic threshold achieved." },
                { grade: "F9 (Fail)", minScore: 0, description: "Requires remedial intervention and re-assessment." },
              ],
            },
          },
        });
      }

      const prompt = `You are a Nigerian educational examination expert and curriculum specialist for NERDC (Nigerian Educational Research and Development Council) schools.
Generate a complete, high-quality assessment paper for:
- School: "${schoolName}"
- Assessment Type: "${assessmentType}" (e.g. terminal-exam, periodic-test, assignment, quick-quiz)
- Subject: "${subject}"
- Class/Level: "${classLevel}"
- Term: "${term}"
- Topic/Focus: "${topics}"
- Total Marks: ${totalMarks}
- Time Allowed: "${timeAllowed}"
- Number of MCQ (Multiple Choice) Questions: ${mcqCount}
- Number of Theory / Structured Questions: ${theoryCount}
- Cognitive Difficulty: "${difficulty}"
- Custom Instructions: "${instructions}"

Return a valid JSON object matching this exact schema:
{
  "title": string,
  "schoolName": string,
  "subject": string,
  "classLevel": string,
  "term": string,
  "topics": string,
  "timeAllowed": string,
  "totalMarks": number,
  "generalInstructions": string,
  "sectionA": {
    "title": string,
    "instructions": string,
    "totalMarks": number,
    "questions": [
      {
        "number": number,
        "text": string,
        "options": string[], // e.g. ["A) ...", "B) ...", "C) ...", "D) ..."]
        "correctAnswer": string, // "A" | "B" | "C" | "D"
        "explanation": string,
        "marks": number,
        "cognitiveLevel": string
      }
    ]
  },
  "sectionB": {
    "title": string,
    "instructions": string,
    "totalMarks": number,
    "questions": [
      {
        "number": number,
        "parts": [
          {
            "subQuestion": string,
            "marks": number,
            "markingGuide": string
          }
        ]
      }
    ]
  },
  "markingScheme": {
    "summary": string,
    "gradeBoundaries": [
      { "grade": string, "minScore": number, "description": string }
    ]
  }
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          systemInstruction: "You are the Skuggle AI Assessment Studio Engine. Generate culturally accurate Nigerian curriculum assessment papers with rigorous question design, unambiguous options, and detailed marking guides.",
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json({ fallback: false, assessment: parsed });
    } catch (err: any) {
      console.error("Gemini assessment generator error:", err);
      res.status(500).json({ error: "Failed to generate assessment", message: err.message });
    }
  });

  // Vite middleware for development or static serving for production
  if (viteMiddleware) {
    app.use(viteMiddleware);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(port, host, () => {
    const browserHost = host === '0.0.0.0' ? 'localhost' : host;
    console.log(`Skuggle server ready at http://${browserHost}:${port}`);
  });
}

startServer();
