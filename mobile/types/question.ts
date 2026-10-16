export type QuestionSummary = {
  id: string;
  title: string;
  role: string;
  topic: string;
  hasVisibleAnswer: boolean;
  createdLabel: string;
  description?: string;
  isAuthor?: boolean;
};

export type Answer = { id: string; text: string; role: string; timeLabel: string; isAuthor?: boolean };
export type QuestionDetail = QuestionSummary & { description: string; answers: Answer[] };
export type AnswerSubmission = {
  success: boolean;
  message: string;
  interactionType: "ANSWER";
  contextRedacted: boolean;
  pendingReview: boolean;
};
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
