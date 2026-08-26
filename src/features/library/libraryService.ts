import type { PaginatedResponse } from "@/app/types";
import { apiDownload, apiRequest } from "@/shared/api/client";
import type { ResourceItem, ResourceType } from "@/types";

export type LibraryAccessTier = "free" | "learn_plus" | "school";

export type LibraryApiResourceType =
  | "book"
  | "lesson"
  | "revision_note"
  | "worksheet"
  | "worked_example"
  | "flashcard"
  | "quiz"
  | "audio"
  | "video"
  | "teacher_material"
  | "other";

export interface LibraryResourcePermissions {
  canRead: boolean;
  canExplain: boolean;
  canSummarise: boolean;
  canPractise: boolean;
  canDownload: boolean;
  canUseOffline: boolean;
  canAssign: boolean;
  canRecommend: boolean;
  canViewAnnotations: boolean;
  canAnnotate: boolean;
  canManageVersions: boolean;
}

export interface LibraryResourceSummary {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  author?: string | null;
  publisher?: string | null;
  resourceType: LibraryApiResourceType | string;
  educationalLevel?: string | null;
  className?: string | null;
  subject?: string | null;
  term?: string | null;
  topic?: string | null;
  estimatedStudyMinutes?: number | null;
  accessTier: LibraryAccessTier | string;
  sourceLabel?: string | null;
  coverImageUrl?: string | null;
  downloadUrl?: string | null;
  progressPercent?: number | null;
  bookmarked?: boolean;
  teacherRecommended?: boolean;
  schoolApproved?: boolean;
  permissions?: LibraryResourcePermissions;
  mimeType?: string | null;
  fileSize?: number | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
}

export interface LibraryResourceDetail extends LibraryResourceSummary {
  licence?: {
    name?: string | null;
    copyrightOwner?: string | null;
    usageNote?: string | null;
  };
  learningObjectives?: string[];
  tableOfContents?: Array<{ id?: string; title?: string }>;
  sections?: Array<{ id: string; title: string; content: string }>;
  contentVersion?: string;
}

export interface LibraryListResult {
  resources: LibraryResourceSummary[];
  meta: {
    currentPage: number;
    lastPage: number;
    total: number;
  };
}

export interface LibraryHomeResult {
  greeting?: string;
  entitlement?: {
    tier?: string;
    label?: string;
    aiUsesRemaining?: number | null;
  };
  continueLearning?: {
    id: string;
    title: string;
    progressPercent?: number;
    href?: string;
  } | null;
  recommendations?: LibraryResourceSummary[];
  upcoming?: Array<{ id: string; title: string; dateLabel?: string }>;
}

export interface LibraryListFilters {
  page?: number;
  search?: string;
  subjectId?: string;
  classId?: string;
  levelId?: string;
  topic?: string;
  saved?: boolean;
}

const filtersToSearch = (filters: LibraryListFilters = {}): string => {
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.search?.trim()) params.set("search", filters.search.trim());
  if (filters.subjectId) params.set("subjectId", filters.subjectId);
  if (filters.classId) params.set("classId", filters.classId);
  if (filters.levelId) params.set("levelId", filters.levelId);
  if (filters.topic?.trim()) params.set("topic", filters.topic.trim());
  if (filters.saved) params.set("saved", "1");
  const qs = params.toString();
  return qs ? `?${qs}` : "";
};

const UI_TO_API_TYPE: Record<ResourceType, LibraryApiResourceType> = {
  document: "lesson",
  presentation: "teacher_material",
  worksheet: "worksheet",
  past_question: "quiz",
  scheme_of_work: "teacher_material",
  link: "other",
  video: "video",
  audio: "audio",
};

const API_TO_UI_TYPE: Record<string, ResourceType> = {
  book: "document",
  lesson: "document",
  revision_note: "document",
  worksheet: "worksheet",
  worked_example: "document",
  flashcard: "document",
  quiz: "past_question",
  audio: "audio",
  video: "video",
  teacher_material: "document",
  other: "document",
};

const formatBytes = (bytes?: number | null): string | undefined => {
  if (!bytes || bytes <= 0) return undefined;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const mimeToFormat = (mime?: string | null, resourceType?: string): string => {
  if (!mime) {
    if (resourceType === "video") return "MP4";
    if (resourceType === "audio") return "MP3";
    if (resourceType === "other") return "URL";
    return "PDF";
  }
  if (mime.includes("pdf")) return "PDF";
  if (mime.includes("word") || mime.includes("docx")) return "DOCX";
  if (mime.includes("text")) return "TXT";
  if (mime.includes("mp4") || mime.includes("video")) return "MP4";
  if (mime.includes("mp3") || mime.includes("audio")) return "MP3";
  return mime.split("/").pop()?.toUpperCase() ?? "FILE";
};

export function mapUiTypeToApi(type: ResourceType): LibraryApiResourceType {
  return UI_TO_API_TYPE[type] ?? "other";
}

export function mapLibrarySummaryToResourceItem(
  summary: LibraryResourceSummary,
): ResourceItem {
  const classLevels = summary.className
    ? [summary.className]
    : summary.educationalLevel
      ? [summary.educationalLevel]
      : ["All Classes"];

  return {
    id: summary.id,
    title: summary.title,
    description: summary.description?.trim() || "School library resource.",
    subject: summary.subject?.trim() || "General",
    classLevels,
    term: summary.term?.trim() || "All Terms",
    resourceType: API_TO_UI_TYPE[summary.resourceType] ?? "document",
    fileFormat: mimeToFormat(summary.mimeType, summary.resourceType),
    fileSize: formatBytes(summary.fileSize),
    url: summary.downloadUrl ?? undefined,
    externalLink: undefined,
    tags: [
      summary.subject,
      summary.term,
      summary.topic,
      summary.accessTier,
    ].filter((value): value is string => Boolean(value && value.trim())),
    author: summary.author?.trim() || summary.sourceLabel?.trim() || "School library",
    authorRole: summary.publisher?.trim() || "Skuggle Library",
    authorAvatar: summary.coverImageUrl ?? undefined,
    uploadedAt: (summary.publishedAt ?? summary.updatedAt ?? new Date().toISOString()).slice(
      0,
      10,
    ),
    downloadCount: 0,
    viewCount: 0,
    isPinned: Boolean(summary.bookmarked),
    isSharedWithStudents: summary.accessTier !== "learn_plus",
    isSharedWithParents: summary.accessTier === "free" || summary.schoolApproved === true,
    curriculumStandard: summary.sourceLabel ?? undefined,
    contentPreview: summary.description ?? undefined,
    folderCategory: "General",
  };
}

export const libraryService = {
  list: (filters: LibraryListFilters = {}, signal?: AbortSignal) =>
    apiRequest<LibraryListResult>(
      `/library/resources${filtersToSearch(filters)}`,
      signal ? { signal } : {},
    ),

  publicList: (filters: LibraryListFilters = {}, signal?: AbortSignal) =>
    apiRequest<LibraryListResult>(
      `/public/library/resources${filtersToSearch(filters)}`,
      signal ? { signal } : {},
    ),

  home: (signal?: AbortSignal) =>
    apiRequest<LibraryHomeResult>(
      "/library/home",
      signal ? { signal } : {},
    ),

  show: (id: string, signal?: AbortSignal) =>
    apiRequest<LibraryResourceDetail>(
      `/library/resources/${id}`,
      signal ? { signal } : {},
    ),

  create: (formData: FormData) =>
    apiRequest<{ id: string }>("/library/resources", {
      method: "POST",
      body: formData,
      timeoutMs: 120_000,
    }),

  archive: (id: string) =>
    apiRequest<{ id: string }>(`/library/resources/${id}/archive`, {
      method: "POST",
      body: {},
    }),

  bookmark: (id: string) =>
    apiRequest<{ bookmarked: boolean }>(`/library/resources/${id}/bookmark`, {
      method: "POST",
      body: {},
    }),

  unbookmark: (id: string) =>
    apiRequest<{ bookmarked: boolean }>(`/library/resources/${id}/bookmark`, {
      method: "DELETE",
    }),

  download: async (id: string, suggestedName: string) => {
    await apiDownload(`/library/resources/${id}/download`, suggestedName);
  },

  update: (id: string, formData: FormData) =>
    apiRequest<{ id: string; contentVersion?: string }>(
      `/library/resources/${id}`,
      {
        method: "PATCH",
        body: formData,
        timeoutMs: 120_000,
      },
    ),

  summary: (id: string) =>
    apiRequest<{
      summary: string;
      keyPoints: string[];
      generatedAt?: string;
      contentVersion?: string;
      sourceLabel?: string;
    }>(`/library/resources/${id}/summary`, {
      method: "POST",
      body: {},
      timeoutMs: 90_000,
    }),

  assistant: (
    id: string,
    input: {
      action:
        | "explain"
        | "simplify"
        | "step_by_step"
        | "everyday_example"
        | "summarise"
        | "key_points"
        | "test_me";
      sectionId?: string;
      selectedText?: string;
    },
  ) =>
    apiRequest<{
      answer: string;
      responseType: string;
      sources: Array<{ label: string; sectionId?: string }>;
      uncertaintyNote?: string | null;
    }>(`/library/resources/${id}/assistant`, {
      method: "POST",
      body: input,
      timeoutMs: 90_000,
    }),

  inspectSyllabus: (formData: FormData) =>
    apiRequest<{
      uploadToken: string;
      fileName: string;
      detectedSubject?: string | null;
      detectedClass?: string | null;
      outcomes: Array<{ id: string; title: string; confidence?: number }>;
      warnings?: string[];
    }>("/library/tools/quiz-generator/inspect", {
      method: "POST",
      body: formData,
      timeoutMs: 120_000,
    }),

  generateQuiz: (input: {
    uploadToken: string;
    outcomeIds: string[];
    questionCount: number;
    difficulty: "foundation" | "standard" | "challenge";
  }) =>
    apiRequest<{
      id: string;
      title: string;
      subject?: string;
      className?: string;
      learningOutcomes: string[];
      questions: Array<{
        id: string;
        prompt: string;
        options: Array<{ id: string; label: string }>;
        correctOptionId: string;
        rationale: string;
        outcomeId?: string;
      }>;
      humanReviewRequired?: boolean;
    }>("/library/tools/quiz-generator/generate", {
      method: "POST",
      body: input,
      timeoutMs: 120_000,
    }),

  saveQuiz: (
    quizId: string,
    input: { title: string; classId?: string; subjectId?: string },
  ) =>
    apiRequest<{ assessmentId: string }>(
      `/library/tools/quiz-generator/${quizId}/save`,
      {
        method: "POST",
        body: input,
      },
    ),

  createExport: (input: {
    resourceIds: string[];
    title: string;
    includeCoverPage: boolean;
    format: "pdf";
  }) =>
    apiRequest<{
      id: string;
      state: string;
      progressPercent?: number;
      message?: string;
      downloadUrl?: string | null;
      filename?: string | null;
    }>("/library/exports", {
      method: "POST",
      body: input,
    }),

  exportJob: (jobId: string) =>
    apiRequest<{
      id: string;
      state: string;
      progressPercent?: number;
      message?: string;
      downloadUrl?: string | null;
      filename?: string | null;
    }>(`/library/exports/${jobId}`),

  downloadExport: async (jobId: string, suggestedName: string) => {
    await apiDownload(`/library/exports/${jobId}/download`, suggestedName);
  },

  listAnnotations: (resourceId: string) =>
    apiRequest<
      Array<{
        id: string;
        resourceId: string | number;
        sectionId?: string | null;
        body: string;
        colour: "yellow" | "pink" | "blue" | "green";
        createdAt?: string;
        updatedAt?: string;
        author?: { id?: string; name?: string; roleLabel?: string };
        canEdit?: boolean;
      }>
    >(`/library/resources/${resourceId}/annotations`),

  createAnnotation: (
    resourceId: string,
    input: {
      body: string;
      colour: "yellow" | "pink" | "blue" | "green";
      sectionId?: string | null;
    },
  ) =>
    apiRequest<{
      id: string;
      body: string;
      colour: string;
      sectionId?: string | null;
      author?: { name?: string; roleLabel?: string };
      canEdit?: boolean;
      createdAt?: string;
    }>(`/library/resources/${resourceId}/annotations`, {
      method: "POST",
      body: input,
    }),

  updateAnnotation: (
    resourceId: string,
    annotationId: string,
    input: {
      body: string;
      colour: "yellow" | "pink" | "blue" | "green";
      sectionId?: string | null;
    },
  ) =>
    apiRequest<{ id: string }>(
      `/library/resources/${resourceId}/annotations/${annotationId}`,
      {
        method: "PATCH",
        body: input,
      },
    ),

  deleteAnnotation: (resourceId: string, annotationId: string) =>
    apiRequest<null>(
      `/library/resources/${resourceId}/annotations/${annotationId}`,
      { method: "DELETE" },
    ),

  transcribeAnnotationAudio: (resourceId: string, audio: Blob) => {
    const form = new FormData();
    form.append("audio", audio, "annotation.webm");
    return apiRequest<{ transcript: string }>(
      `/library/resources/${resourceId}/annotations/transcribe`,
      {
        method: "POST",
        body: form,
        timeoutMs: 90_000,
      },
    );
  },

  /** Build a .txt File from text for quiz-generator inspect. */
  textToSyllabusFile: (text: string, fileName = "syllabus.txt"): File =>
    new File([text], fileName, { type: "text/plain" }),

  mapApiDifficulty: (
    ui: "Mixed" | "Easy" | "Medium" | "Hard",
  ): "foundation" | "standard" | "challenge" => {
    if (ui === "Easy") return "foundation";
    if (ui === "Hard") return "challenge";
    return "standard";
  },

  mapApiQuizToSmartQuiz: (apiQuiz: {
    id: string;
    title: string;
    subject?: string;
    className?: string;
    learningOutcomes: string[];
    questions: Array<{
      id: string;
      prompt: string;
      options: Array<{ id: string; label: string }>;
      correctOptionId: string;
      rationale: string;
      outcomeId?: string;
    }>;
  }): import("@/types").SmartQuiz => {
    const questions = apiQuiz.questions.map((q, index) => {
      const options = q.options.map((opt) => opt.label);
      const correctIndex = Math.max(
        0,
        q.options.findIndex((opt) => opt.id === q.correctOptionId),
      );
      const outcome =
        apiQuiz.learningOutcomes.find((_, i) => `outcome-${i + 1}` === q.outcomeId) ||
        apiQuiz.learningOutcomes[0] ||
        "Curriculum outcome";
      return {
        id: q.id || `q-${index + 1}`,
        question: q.prompt,
        options:
          options.length >= 4
            ? options.slice(0, 4)
            : [...options, ...Array(4 - options.length).fill("—")],
        correctIndex: correctIndex >= 0 ? correctIndex : 0,
        explanation: q.rationale,
        learningOutcome: outcome,
        difficulty: "Medium" as const,
      };
    });

    return {
      id: apiQuiz.id,
      title: apiQuiz.title,
      subject: apiQuiz.subject || "General",
      classLevel: apiQuiz.className || "All Classes",
      learningOutcomes: apiQuiz.learningOutcomes,
      questions,
      totalPoints: questions.length,
      timeLimitMinutes: Math.max(10, questions.length * 2),
      createdAt: new Date().toISOString(),
    };
  },

  buildCreateFormData: (input: {
    title: string;
    description?: string;
    author?: string;
    resourceType: ResourceType;
    subject?: string;
    className?: string;
    term?: string;
    topic?: string;
    accessTier?: LibraryAccessTier;
    sourceLabel?: string;
    licenceName?: string;
    copyrightOwner?: string;
    status?: "draft" | "published" | "archived";
    changeSummary?: string;
    schoolApproved?: boolean;
    isPublic?: boolean;
    sectionContent?: string;
    sections?: Array<{ id: string; title: string; content: string }>;
    learningObjectives?: string[];
    file?: File | null;
  }): FormData => {
    const form = new FormData();
    form.append("title", input.title.trim());
    form.append("description", (input.description ?? "").trim());
    form.append("author", (input.author ?? "School staff").trim());
    form.append("resourceType", mapUiTypeToApi(input.resourceType));
    form.append("educationalLevel", input.className?.trim() || "");
    form.append("className", input.className?.trim() || "");
    form.append("subject", input.subject?.trim() || "General");
    form.append("term", input.term?.trim() || "");
    form.append("topic", input.topic?.trim() || input.title.trim());
    form.append("accessTier", input.accessTier ?? "school");
    form.append("sourceLabel", input.sourceLabel ?? "School upload");
    form.append("licenceName", input.licenceName ?? "School licence");
    form.append("copyrightOwner", input.copyrightOwner ?? "School");
    form.append("status", input.status ?? "published");
    form.append(
      "changeSummary",
      input.changeSummary ?? "Initial publication via Smart Library",
    );
    form.append("schoolApproved", input.schoolApproved === false ? "0" : "1");
    form.append("isPublic", input.isPublic ? "1" : "0");

    const sectionBody =
      input.sectionContent?.trim() ||
      input.description?.trim() ||
      `Teaching resource: ${input.title.trim()}`;
    form.append(
      "sections",
      JSON.stringify(
        input.sections?.length
          ? input.sections
          : [
              {
                id: "section-1",
                title: "Overview",
                content: sectionBody,
              },
            ],
      ),
    );
    form.append(
      "learningObjectives",
      JSON.stringify(
        input.learningObjectives?.length
          ? input.learningObjectives
          : [
              `Understand key ideas in ${input.topic?.trim() || input.title.trim()}`,
            ],
      ),
    );

    if (input.file) {
      form.append("file", input.file);
    }

    return form;
  },
};

/** Convenience alias used by list pages that expect PaginatedResponse shape. */
export type LibraryPaginated = PaginatedResponse<LibraryResourceSummary>;
