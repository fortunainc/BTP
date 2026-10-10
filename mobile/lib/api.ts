import type { ActivityItem, AnswerSubmission, HelpType, OutcomeType, PrivateHelpRequest, QuestionDetail, QuestionSummary } from "@/types/question";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
export const liveApiConfigured = Boolean(API_URL);
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

type SituationApi = { id: string; title: string; description?: string; issueCategory?: string; timeLabel?: string; hasVisibleAnswer?: boolean; isAuthor?: boolean };
const toSummary = (item: SituationApi): QuestionSummary => ({ id: item.id, title: item.title, description: item.description, role: "Verified BTP member", topic: item.issueCategory || "Clinical trials", hasVisibleAnswer: item.hasVisibleAnswer ?? false, createdLabel: item.timeLabel || "Recently", isAuthor: item.isAuthor });

export const api = {
  session: (token: string | null) => apiRequest<{
    authenticated: boolean;
    member: { id: string; handle: string; roleCategory?: string | null; companyCategory?: string | null; verificationStatus?: string | null; approved: boolean };
  }>("/api/mobile/session", { token }),
  questions: {
    async list(token: string | null) { const result = await apiRequest<{ situations: SituationApi[] }>("/api/situations", { token }); return result.situations.map(toSummary); },
    async detail(token: string | null, id: string): Promise<QuestionDetail> { const result = await apiRequest<{ situation: SituationApi; answers: QuestionDetail["answers"]; isAuthor?: boolean }>(`/api/situations/${id}`, { token }); const q = toSummary(result.situation); return { ...q, isAuthor: result.situation.isAuthor ?? result.isAuthor ?? false, description: result.situation.description || result.situation.title, answers: result.answers || [] }; },
    review: (token: string | null, description: string) => apiRequest<{ redactedContent: string; redactionsApplied: number; message: string; piiWarning?: string | null }>("/api/situations/review", { token, method: "POST", body: JSON.stringify({ description }) }),
    create: (token: string | null, description: string) => apiRequest<{ id: string; message: string }>("/api/situations", { token, method: "POST", body: JSON.stringify({ description, confirmedRedaction: true }) }),
    answer: (token: string | null, id: string, context: string) => apiRequest<AnswerSubmission>(`/api/situations/${id}/interact`, { token, method: "POST", body: JSON.stringify({ interactionType: "ANSWER", context }) }),
    followState: (token: string | null, id: string) => apiRequest<{ following: boolean }>(`/api/situations/${id}/follow`, { token }),
    follow: (token: string | null, id: string, following: boolean) => apiRequest<{ following: boolean }>(`/api/situations/${id}/follow`, { token, method: following ? "POST" : "DELETE" }),
    outcome: (token: string | null, id: string, outcomeType: OutcomeType, outcomeData: string) => apiRequest(`/api/situations/${id}/outcome`, { token, method: "POST", body: JSON.stringify({ outcomeType, outcomeData }) }),
    privateHelp: (token: string | null, id: string, helpType: HelpType, details: string, timing: string) => apiRequest("/api/help-requests", { token, method: "POST", body: JSON.stringify({ contributionId: id, helpType, details, timing }) }),
    helpfulState: (token: string | null, answerId: string) => apiRequest<{ helpful: boolean }>(`/api/answers/${answerId}/helpful`, { token }),
    helpful: (token: string | null, answerId: string, helpful: boolean) => apiRequest<{ helpful: boolean }>(`/api/answers/${answerId}/helpful`, { token, method: helpful ? "POST" : "DELETE" }),
    report: (token: string | null, contentType: "QUESTION" | "ANSWER", contentId: string, reason: string, description?: string) => apiRequest<{ success: boolean; alreadyReported?: boolean }>("/api/reports", { token, method: "POST", body: JSON.stringify({ contentType, contentId, reason, description }) }),
  },
  help: {
    async list(token: string | null): Promise<PrivateHelpRequest[]> { const result = await apiRequest<{ requests: PrivateHelpRequest[] }>("/api/help-requests", { token }); return result.requests; },
  },
  activity: {
    async list(token: string | null): Promise<ActivityItem[]> {
      const result = await apiRequest<{ notifications: Array<Record<string, unknown>> }>("/api/notifications?limit=50", { token });
      return result.notifications.map((n) => {
        const variantId = String(n.variantId || "");
        const relatedIdIsAnswer = variantId === "IMPACT-ANSWER-HELPED";
        return { id: String(n.id), title: String(n.title || n.subject || "BTP update"), detail: String(n.body || n.message || n.copy || "A case you care about has an update."), displayTime: String(n.displayTime || "recently").replaceAll("_", " "), read: Boolean(n.read), questionId: !relatedIdIsAnswer && n.relatedPostId ? String(n.relatedPostId) : null };
      });
    },
    markRead: (token: string | null, id: string) => apiRequest(`/api/notifications/${id}`, { token, method: "PATCH", body: JSON.stringify({ opened: true }) }),
    markAllRead: (token: string | null) => apiRequest("/api/notifications/mark-all-read", { token, method: "POST", body: "{}" }),
  },
};
