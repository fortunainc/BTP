export type ReactionType = "HELPFUL" | "SAME_HERE" | "SAVED" | "WORKED";

export type QuestionSummary = {
  id: string;
  title: string;
  authorHandle: string | null;
  role: string;
  topic: string;
  hasVisibleAnswer: boolean;
  createdLabel: string;
  description?: string;
  isAuthor?: boolean;
};

export type Answer = {
  id: string;
  text: string;
  role: string;
  authorHandle: string | null;
  timeLabel: string;
  isAuthor?: boolean;
  myReactions: ReactionType[];
  /** True when the asker marked this answer "It worked". */
  askerReportedWorked: boolean;
};
export type QuestionDetail = QuestionSummary & { description: string; answers: Answer[] };
export type QuestionPage = { items: QuestionSummary[]; nextCursor: string | null };
export type QuestionFilter = { query?: string; category?: string | null; unanswered?: boolean; cursor?: string | null };
export type PostResult = { id: string; message: string; pendingReview: boolean };
export type AnswerSubmission = {
  success: boolean;
  message: string;
  interactionType: "ANSWER";
  contextRedacted: boolean;
  pendingReview: boolean;
};
export type SavedAnswer = { answerId: string; situationId: string; situationTitle: string; excerpt: string; authorHandle: string | null; authorRole: string; savedAt: string };
export type PaidReviewInterest = { interested: boolean; roleLabel: string | null; yearsExperience: number | null };
export type OutcomeType = "resolution" | "validation" | "correction" | "incomplete" | "misleading";
export type HelpType = "CONSULTATION" | "INTERVIEW_PREP" | "WRITTEN_REVIEW" | "DOCUMENT_REVIEW" | "PROJECT_HELP";
export type ActivityItem = { id: string; title: string; detail: string; displayTime: string; read: boolean; questionId?: string | null };
export type PrivateHelpRequest = {
  id: string;
  contributionId: string | null;
  memberUpdate?: string | null;
  feedback?: string | null;
  helpType: string;
  details: string;
  timing?: string | null;
  status: string;
  createdAt: string;
};
export type ContentReport = { id: string; contentType: string; reason: string; status: string; action?: string | null; createdAt: string; reviewedAt?: string | null };

/** Existing categories accepted by GET /api/situations?issueCategory= */
export const CATEGORIES = ["Enrollment", "Protocol burden", "Sponsor expectations", "Data integrity", "Regulatory", "Operational", "Staffing", "Site Overload", "Patient Retention", "Budget/Reimbursement", "Other"] as const;
