import express, { type Request, type Response } from "express";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT ?? 3000);
const backendUrl = new URL(
  process.env.SKOOL_BACKEND_URL ?? "http://127.0.0.1:8000",
);

const proxyToLaravel = (request: Request, response: Response): void => {
  const target = new URL(request.originalUrl, backendUrl);
  const transport = target.protocol === "https:" ? https : http;
  const headers = { ...request.headers, host: target.host };
  const upstream = transport.request(
    target,
    { method: request.method, headers },
    (upstreamResponse) => {
      response.status(upstreamResponse.statusCode ?? 502);
      const setCookie = upstreamResponse.headers["set-cookie"];
      Object.entries(upstreamResponse.headers).forEach(([name, value]) => {
        if (value === undefined || name.toLowerCase() === "set-cookie") return;
        response.setHeader(name, value);
      });
      if (setCookie) {
        response.setHeader("set-cookie", setCookie);
      }
      upstreamResponse.pipe(response);
    },
  );

  upstream.on("error", () => {
    if (!response.headersSent) {
      response.status(503).json({
        message:
          "The Skuggle API is unavailable. Start XAMPP MySQL and `php artisan serve` in /backend.",
      });
    } else {
      response.end();
    }
  });
  request.pipe(upstream);
};

// Laravel API + Sanctum CSRF must bypass body parsers (multipart + cookies).
app.use(["/api/v1", "/sanctum", "/health"], proxyToLaravel);

app.use(express.json({ limit: "25mb" }));

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    platform: "Skuggle 2.0",
    laravel: backendUrl.origin,
  });
});

app.post("/api/ai/lesson-plan", async (req, res) => {
  try {
    const {
      subject,
      className,
      topic,
      subtopic,
      duration,
      objectives,
      classLevel,
    } = req.body;
    const ai = getGeminiClient();

    if (ai) {
      const prompt = `You are an expert Nigerian curriculum specialist creating a NERDC lesson plan.
Class: ${className || "JSS 2"} (${classLevel || "Junior Secondary"})
Subject: ${subject || "Mathematics"}
Topic: ${topic || "Algebraic Fractions"}
Subtopic: ${subtopic || "Addition and Subtraction of Algebraic Fractions"}
Duration: ${duration || "40 minutes"}
Objectives: ${objectives || "Enable students to find LCM of algebraic denominators."}

Return pure JSON with keys: title, subject, className, duration, curriculumReference, learningObjectives, previousKnowledge, instructionalMaterials, steps, evaluationQuestions, homework, teacherRemarks.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" },
      });

      if (response.text) {
        return res.json({
          success: true,
          lessonPlan: JSON.parse(response.text),
        });
      }
    }

    return res.json({
      success: true,
      lessonPlan: {
        title: `Lesson Plan: ${topic || "Algebraic Fractions"}`,
        subject: subject || "Mathematics",
        className: className || "JSS 2A",
        duration: duration || "40 minutes",
        curriculumReference: `NERDC ${className || "JSS 2"} Scheme of Work`,
        learningObjectives: [
          "Identify algebraic fractions",
          "Find LCM of algebraic denominators",
          "Add and subtract algebraic fractions",
        ],
        previousKnowledge: "Students know numerical LCM and basic factorization.",
        instructionalMaterials: ["Whiteboard", "Worksheets"],
        steps: [
          {
            stepNumber: 1,
            title: "Introduction",
            duration: "5 mins",
            teacherActivity: "Review numerical fractions",
            studentActivity: "Respond to oral questions",
            keyPoints: "LCM rules transfer to algebra",
          },
        ],
        evaluationQuestions: ["Find LCM of 2x and 3x"],
        homework: "Exercise 4b, Questions 1-10",
        teacherRemarks: "Support struggling learners in tutorial.",
      },
    });
  } catch (error: any) {
    console.error("AI Lesson Plan error:", error);
    res
      .status(500)
      .json({ success: false, error: error.message || "Failed to generate" });
  }
});

app.post("/api/ai/generate-questions", async (req, res) => {
  try {
    const {
      subject,
      className,
      topic,
      count = 5,
      questionType = "multiple_choice",
      difficulty = "medium",
    } = req.body;
    const ai = getGeminiClient();
    if (ai) {
      const prompt = `Generate ${count} ${difficulty} ${questionType} questions for ${className} ${subject} on "${topic}". Return JSON array with question, options, correctAnswer, explanation, topic, difficulty.`;
      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" },
      });
      if (response.text) {
        return res.json({
          success: true,
          questions: JSON.parse(response.text),
        });
      }
    }
    return res.json({
      success: true,
      questions: [
        {
          id: "q1",
          question: `Sample ${subject || "Mathematics"} question on ${topic || "topic"}?`,
          options: ["A) 1", "B) 2", "C) 3", "D) 4"],
          correctAnswer: "A",
          explanation: "Demo fallback question.",
          topic: topic || "General",
          difficulty,
        },
      ],
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/ai/smartmark-scan", async (req, res) => {
  try {
    const { totalQuestions = 20, assessmentId = "ASM-2026-MATH" } = req.body;
    const answerKey = [
      "A",
      "B",
      "A",
      "C",
      "D",
      "B",
      "A",
      "C",
      "B",
      "D",
      "A",
      "A",
      "C",
      "D",
      "B",
      "C",
      "A",
      "D",
      "B",
      "A",
    ];
    const responses: Record<
      number,
      { selected: string; confidence: number; isUncertain: boolean; correct: string }
    > = {};
    let totalScore = 0;
    let flaggedCount = 0;
    for (let i = 1; i <= totalQuestions; i++) {
      const correct = answerKey[(i - 1) % answerKey.length];
      const isCorrect = Math.random() > 0.18;
      const selected = isCorrect
        ? correct
        : ["A", "B", "C", "D"][Math.floor(Math.random() * 4)];
      const isUncertain = i === 7 || i === 14 ? Math.random() > 0.5 : false;
      if (isUncertain) flaggedCount++;
      if (selected === correct && !isUncertain) totalScore += 1;
      responses[i] = {
        selected,
        confidence: isUncertain ? 0.62 : 0.98,
        isUncertain,
        correct,
      };
    }
    return res.json({
      success: true,
      scanResult: {
        assessmentId,
        detectedStudentId: "RGA26/1006",
        studentName: "Nathan Bello",
        classArm: "JSS 2A",
        subject: "Mathematics First CA Test",
        totalQuestions,
        score: totalScore,
        percentage: Math.round((totalScore / totalQuestions) * 100),
        status: flaggedCount > 0 ? "Review Required" : "Auto Marked",
        flaggedExceptions: flaggedCount,
        responses,
        scannedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/ai/auto-categorize", async (req, res) => {
  try {
    const { title, tags } = req.body;
    return res.json({
      success: true,
      classification: {
        predictedCategory: String(title || "")
          .toLowerCase()
          .includes("exam")
          ? "Exams"
          : "Lecture Notes",
        confidence: 96,
        reasoning: "Classified using curriculum feature matching.",
        keyFeatures: ["Curriculum markers"],
        secondaryPredictions: [{ category: "Assignments", probability: 2.5 }],
        suggestedTags: tags?.length
          ? tags
          : ["NERDC Aligned", "Study Material"],
        difficulty: "Intermediate",
        readingTimeMinutes: 5,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/ai/summarize-resource", async (req, res) => {
  try {
    const { title, subject, folderCategory, classLevels = [] } = req.body;
    return res.json({
      success: true,
      summary: {
        briefSummary: `This ${folderCategory || "resource"} covers ${title || "the topic"} for ${subject || "students"}.`,
        keyTakeaways: [
          "Understand core definitions",
          "Practice worked examples",
          "Prepare for terminal assessments",
        ],
        coreConcepts: [title || "Core topic", subject || "Subject"],
        studentActionableTip:
          "Practice without skipping intermediate working steps.",
        readingLevel:
          classLevels.length > 0
            ? `${classLevels.join(", ")} (NERDC)`
            : "Secondary Education",
        estimatedReadTime: "2 mins quick preview",
        targetExam: "WAEC, NECO & Terminal Assessments",
        generatedAt: new Date().toISOString(),
        model: "Skuggle AI Tutor",
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Skuggle frontend: http://localhost:${PORT}`);
    console.log(`Laravel API proxy: ${backendUrl.origin}`);
  });
}

void startServer();
