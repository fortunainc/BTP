import type { ActivityItem, AnswerSubmission, ContentReport, HelpType, OutcomeType, PaidReviewInterest, PostResult, PrivateHelpRequest, QuestionDetail, QuestionFilter, QuestionPage, QuestionSummary, ReactionType, SavedAnswer } from "@/types/question";
import { API_URL } from "@/lib/config";

export { liveApiConfigured } from "@/lib/config";
export class ApiError extends Error { constructor(public status: number, message: string) { super(message); this.name = "ApiError"; } }
type RequestOptions = RequestInit & { token?: string | null };

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!API_URL) throw new Error("EXPO_PUBLIC_API_URL is not configured");
  const { token, headers, ...init } = options;
  const response = await fetch(`${API_URL.replace(/\/$/, "")}${path}`, { ...init, headers: { Accept: "application/json", "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers } });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try { const body = await response.json() as { error?: string; message?: string }; message = body.error ?? body.message ?? message; } catch {}
    throw new ApiError(response.status, message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

type SituationApi = { id: string; title: string; description?: string; issueCategory?: string; timeLabel?: string; hasVisibleAnswer?: boolean; isAuthor?: boolean; authorHandle?: string | null; authorRole?: string | null };
type AnswerApi = { id: string; text: string; role?: string; authorRole?: string; authorHandle?: string | null; timeLabel?: string; isAuthor?: boolean; myReactions?: ReactionType[]; reactions?: Partial<Record<ReactionType, number>> };
const toSummary = (item: SituationApi): QuestionSummary => ({ id: item.id, title: item.title, description: item.description, authorHandle: item.authorHandle ?? null, role: item.authorRole || "BTP member", topic: item.issueCategory || "General", hasVisibleAnswer: item.hasVisibleAnswer ?? false, createdLabel: item.timeLabel || "Recently", isAuthor: item.isAuthor });
const toAnswer = (a: AnswerApi): QuestionDetail["answers"][number] => ({ id: a.id, text: a.text, role: a.authorRole || a.role || "BTP member", authorHandle: a.authorHandle ?? null, timeLabel: a.timeLabel || "", isAuthor: a.isAuthor, myReactions: a.myReactions ?? [], askerReportedWorked: (a.reactions?.WORKED ?? 0) > 0 });
const filterParams = (f: QuestionFilter) => { const p = new URLSearchParams({ q: f.query ?? "" }); if (f.category) p.set("issueCategory", f.category); if (f.unanswered) p.set("unanswered", "1"); if (f.cursor) p.set("cursor", f.cursor); return p; };

const liveApi = {
  requestDeletion: (token: string | null) => apiRequest("/api/account/deletion", { token, method: "POST", body: "{}" }),
  session: (token: string | null) => apiRequest<{
    authenticated: boolean;
    member: { id: string; handle: string; roleCategory?: string | null; roleLabel?: string | null; companyCategory?: string | null; verificationStatus?: string | null; approved: boolean };
  }>("/api/mobile/session", { token }),
  questions: {
    async page(token: string | null, filter: QuestionFilter): Promise<QuestionPage> { const result = await apiRequest<{ situations: SituationApi[]; nextCursor: string | null }>(`/api/situations?${filterParams(filter)}`, { token }); return { items: result.situations.map(toSummary), nextCursor: result.nextCursor }; },
    async detail(token: string | null, id: string): Promise<QuestionDetail> { const result = await apiRequest<{ situation: SituationApi; answers: AnswerApi[]; isAuthor?: boolean }>(`/api/situations/${id}`, { token }); const q = toSummary(result.situation); return { ...q, isAuthor: result.situation.isAuthor ?? result.isAuthor ?? false, description: result.situation.description || result.situation.title, answers: (result.answers || []).map(toAnswer) }; },
    review: (token: string | null, description: string) => apiRequest<{ redactedContent: string; redactionsApplied: number; message: string; piiWarning?: string | null }>("/api/situations/review", { token, method: "POST", body: JSON.stringify({ description }) }),
    async create(token: string | null, description: string): Promise<PostResult> { const r = await apiRequest<{ id: string; message: string; pendingReview?: boolean }>("/api/situations", { token, method: "POST", body: JSON.stringify({ description, confirmedRedaction: true }) }); return { id: r.id, message: r.message, pendingReview: r.pendingReview ?? /awaiting review/i.test(r.message) }; },
    answer: (token: string | null, id: string, context: string) => apiRequest<AnswerSubmission>(`/api/situations/${id}/interact`, { token, method: "POST", body: JSON.stringify({ interactionType: "ANSWER", context }) }),
    followState: (token: string | null, id: string) => apiRequest<{ following: boolean }>(`/api/situations/${id}/follow`, { token }),
    follow: (token: string | null, id: string, following: boolean) => apiRequest<{ following: boolean }>(`/api/situations/${id}/follow`, { token, method: following ? "POST" : "DELETE" }),
    outcome: (token: string | null, id: string, outcomeType: OutcomeType, outcomeData: string) => apiRequest(`/api/situations/${id}/outcome`, { token, method: "POST", body: JSON.stringify({ outcomeType, outcomeData }) }),
    async react(token: string | null, answerId: string, reaction: ReactionType, on: boolean): Promise<ReactionType[]> { const r = await apiRequest<{ mine: ReactionType[] }>(on ? `/api/answers/${answerId}/reactions` : `/api/answers/${answerId}/reactions?type=${reaction}`, { token, method: on ? "POST" : "DELETE", body: on ? JSON.stringify({ type: reaction }) : undefined }); return r.mine ?? []; },
    report: (token: string | null, contentType: "QUESTION" | "ANSWER", contentId: string, reason: string, description?: string) => apiRequest<{ success: boolean; alreadyReported?: boolean }>("/api/reports", { token, method: "POST", body: JSON.stringify({ contentType, contentId, reason, description }) }),
  },
  help: {
    async list(token: string | null): Promise<PrivateHelpRequest[]> { const result = await apiRequest<{ requests: PrivateHelpRequest[] }>("/api/help-requests", { token }); return result.requests; },
    create: (token: string | null, helpType: HelpType, details: string, questionId?: string | null) => apiRequest("/api/help-requests", { token, method: "POST", body: JSON.stringify({ helpType, details, ...(questionId ? { contributionId: questionId } : {}) }) }),
    feedback: (token: string | null, id: string, feedback: string) => apiRequest("/api/help-requests", { token, method: "PATCH", body: JSON.stringify({ id, feedback }) }),
  },
  reports: {
    async list(token: string | null): Promise<ContentReport[]> { const result = await apiRequest<{ reports: ContentReport[] }>("/api/reports", { token }); return result.reports; },
  },
  saved: {
    async list(token: string | null): Promise<SavedAnswer[]> { return (await apiRequest<{ items: SavedAnswer[] }>("/api/me/saved-answers", { token })).items; },
  },
  interest: {
    get: (token: string | null) => apiRequest<PaidReviewInterest>("/api/me/paid-review-interest", { token }),
    set: (token: string | null, interested: boolean) => apiRequest<PaidReviewInterest>("/api/me/paid-review-interest", { token, method: "PUT", body: JSON.stringify({ interested }) }),
  },
  activity: {
    async list(token: string | null): Promise<ActivityItem[]> {
      const result = await apiRequest<{ notifications: Array<Record<string, unknown>> }>("/api/notifications?limit=50", { token });
      return result.notifications.map((n) => ({ id: String(n.id), title: String(n.title || n.subject || "BTP update"), detail: String(n.body || n.message || n.copy || ""), displayTime: String(n.displayTime || "recently").replaceAll("_", " "), read: Boolean(n.read), questionId: n.relatedPostId ? String(n.relatedPostId) : null }));
    },
    markRead: (token: string | null, id: string) => apiRequest(`/api/notifications/${id}`, { token, method: "PATCH", body: JSON.stringify({ opened: true }) }),
    markAllRead: (token: string | null) => apiRequest("/api/notifications/mark-all-read", { token, method: "POST", body: "{}" }),
  },
};

export type BtpApi = typeof liveApi;

/**
 * Local preview only: sample data held in memory on this device. Never used in release
 * builds (localPreviewEnabled requires __DEV__) and never sent to the BTP service.
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
// The condition is written inline so release builds (where __DEV__ is false) strip the sample data entirely.
export const api: BtpApi = __DEV__ && process.env.EXPO_PUBLIC_ENABLE_LOCAL_PREVIEW === "true" && !process.env.EXPO_PUBLIC_API_URL ? (require("@/lib/preview-api").previewApi as BtpApi) : liveApi;
