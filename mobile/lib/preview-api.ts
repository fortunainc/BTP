/**
 * LOCAL PREVIEW ONLY. In-memory sample content so the app can be reviewed and tested
 * without a server. Loaded only when local preview is enabled in a development build
 * with no API configured (see lib/api.ts). None of this reaches the live community.
 */
import type { BtpApi } from "@/lib/api";
import type { ActivityItem, ContentReport, HelpType, PrivateHelpRequest, QuestionDetail, QuestionFilter, ReactionType, SavedAnswer } from "@/types/question";

const wait = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));
let seq = 100;

const questions: QuestionDetail[] = [
  { id: "preview-1", title: "Monitoring visit next week and I am behind on queries. What do you prioritize in the last three days?", description: "Three days left, about forty open queries across two studies. I can't close all of them. How do you decide what to clear first so the visit goes well?", authorHandle: "quietpine", role: "Site coordinator", topic: "Data integrity", hasVisibleAnswer: true, createdLabel: "2h", answers: [
    { id: "a-1", text: "Sort by what the monitor will open first: eligibility and consent queries, then anything older than thirty days. Send the monitor a short note listing what is still open and when you expect to close it. Monitors respond well to a plan.", role: "CRA or monitor", authorHandle: "northfield", timeLabel: "1h", myReactions: [], askerReportedWorked: false },
    { id: "a-2", text: "Block two hours each morning with the door closed. Close the queries that only need a source check first; they go fast and shrink the list.", role: "Site coordinator", authorHandle: "harborlane", timeLabel: "40m", myReactions: [], askerReportedWorked: false },
  ] },
  { id: "preview-2", title: "How do you keep continuity for a site after repeated monitor changes?", description: "We have had three monitors in a year. Each one asks for the same things again. What has helped you keep the relationship and the history intact?", authorHandle: "northfield", role: "CRA or monitor", topic: "Operational", hasVisibleAnswer: false, createdLabel: "5h", answers: [] },
  { id: "preview-3", title: "Our referrals arrive with no prescreen answers. How do other sites handle the first call?", description: "Referrals come in from a vendor with only a name and number. The first call takes forty minutes. Is there a short script or form others use?", authorHandle: "cedarwalk", role: "Site manager", topic: "Enrollment", hasVisibleAnswer: true, createdLabel: "1d", answers: [
    { id: "a-3", text: "We send a five question form by text before calling. About half fill it in, and those calls take ten minutes.", role: "Recruitment specialist", authorHandle: "brightwater", timeLabel: "20h", myReactions: [], askerReportedWorked: true },
  ] },
  { id: "preview-4", title: "What do you put in a budget for screen failures when the sponsor caps them?", description: "The sponsor pays for one screen failure per three randomized patients. Our rate is higher. How have others negotiated this?", authorHandle: "stonebridge", role: "Site budget and contracts", topic: "Budget/Reimbursement", hasVisibleAnswer: false, createdLabel: "2d", answers: [] },
];
const mine = new Set<string>(["preview-1"]);
const saved = new Map<string, string>();
const activity: ActivityItem[] = [
  { id: "n-1", title: "A CRA or monitor answered your question.", detail: "Monitoring visit next week and I am behind on queries…", displayTime: "12m", read: false, questionId: "preview-1" },
  { id: "n-2", title: "Has anything changed since you shared?", detail: "A quick update helps the next person.", displayTime: "6d", read: true, questionId: "preview-1" },
];
const helpRequests: PrivateHelpRequest[] = [];
const reports: ContentReport[] = [];
let interested = false;
const COMPANY_WORDS = /\b(Pfizer|Merck|Medidata|IQVIA|Novartis|Mercy|Stanford|NYU)\b/g;

const summary = (q: QuestionDetail) => ({ ...q, hasVisibleAnswer: q.answers.length > 0, isAuthor: mine.has(q.id) });
const find = (id: string) => { const q = questions.find((x) => x.id === id); if (!q) throw new Error("This question is no longer available."); return q; };

export const previewApi: BtpApi = {
  requestDeletion: async () => { await wait(); return undefined; },
  session: async () => ({ authenticated: true, member: { id: "preview", handle: "quietpine", roleCategory: "Site coordinator", roleLabel: "Site coordinator", verificationStatus: "Approved", approved: true } }),
  questions: {
    async page(_t, f: QuestionFilter) {
      await wait();
      const q = (f.query ?? "").trim().toLowerCase();
      const items = questions.filter((x) => (!q || `${x.title} ${x.description}`.toLowerCase().includes(q)) && (!f.category || x.topic.toLowerCase() === f.category.toLowerCase()) && (!f.unanswered || x.answers.length === 0)).map(summary);
      return { items, nextCursor: null };
    },
    async detail(_t, id) { await wait(); const q = find(id); return { ...summary(q), answers: q.answers.map((a) => ({ ...a })) }; },
    async review(_t, description) { await wait(400); let n = 0; const redactedContent = description.replace(COMPANY_WORDS, () => { n += 1; return "[COMPANY]"; }); return { redactedContent, redactionsApplied: n, message: n ? `We removed ${n} detail${n === 1 ? "" : "s"} that could identify you or your site.` : "We found nothing that looks identifying.", piiWarning: null }; },
    async create(_t, description) {
      await wait(400);
      const id = `preview-${++seq}`;
      const pendingReview = description.includes("[COMPANY]");
      if (!pendingReview) { questions.unshift({ id, title: description.slice(0, 140), description, authorHandle: "quietpine", role: "Site coordinator", topic: "Other", hasVisibleAnswer: false, createdLabel: "Just now", answers: [] }); mine.add(id); }
      return { id, message: pendingReview ? "Your question is awaiting review." : "Your question is posted.", pendingReview };
    },
    async answer(_t, id, context) { await wait(); find(id).answers.push({ id: `a-${++seq}`, text: context, role: "Site coordinator", authorHandle: "quietpine", timeLabel: "Just now", isAuthor: true, myReactions: [], askerReportedWorked: false }); return { success: true, message: "", interactionType: "ANSWER", contextRedacted: false, pendingReview: false }; },
    async followState() { return { following: false }; },
    async follow(_t, _id, following) { await wait(); return { following }; },
    async outcome() { await wait(); return undefined; },
    async react(_t, answerId, reaction: ReactionType, on) {
      await wait(200);
      for (const q of questions) {
        const a = q.answers.find((x) => x.id === answerId);
        if (!a) continue;
        if (reaction === "WORKED" && !mine.has(q.id)) throw new Error("Only the person who asked can mark an answer as worked.");
        a.myReactions = on ? Array.from(new Set([...a.myReactions, reaction])) : a.myReactions.filter((r) => r !== reaction);
        if (reaction === "WORKED") a.askerReportedWorked = on;
        if (reaction === "SAVED") { if (on) saved.set(answerId, new Date().toISOString()); else saved.delete(answerId); }
        return a.myReactions;
      }
      throw new Error("Answer not found");
    },
    async report(_t, contentType, _id, reason) { await wait(); reports.unshift({ id: `r-${++seq}`, contentType, reason, status: "Pending", createdAt: new Date().toISOString() }); return { success: true }; },
  },
  help: {
    async list() { await wait(); return helpRequests; },
    async create(_t, helpType: HelpType, details, questionId) { await wait(); helpRequests.unshift({ id: `h-${++seq}`, contributionId: questionId ?? null, helpType, details, status: "NEW", createdAt: new Date().toISOString() }); return undefined; },
    async feedback(_t, id, feedback) { await wait(); const r = helpRequests.find((x) => x.id === id); if (r) r.feedback = feedback; return undefined; },
  },
  reports: { async list() { await wait(); return reports; } },
  saved: {
    async list() {
      await wait();
      const items: SavedAnswer[] = [];
      for (const q of questions) for (const a of q.answers) { const at = saved.get(a.id); if (at) items.push({ answerId: a.id, situationId: q.id, situationTitle: q.title, excerpt: a.text.length > 200 ? `${a.text.slice(0, 200)}…` : a.text, authorHandle: a.authorHandle, authorRole: a.role, savedAt: at }); }
      return items.sort((x, y) => y.savedAt.localeCompare(x.savedAt));
    },
  },
  interest: {
    async get() { await wait(); return { interested, roleLabel: "Site coordinator", yearsExperience: 6 }; },
    async set(_t, value) { await wait(); interested = value; return { interested, roleLabel: "Site coordinator", yearsExperience: 6 }; },
  },
  activity: {
    async list() { await wait(); return activity.map((a) => ({ ...a })); },
    async markRead(_t, id) { const a = activity.find((x) => x.id === id); if (a) a.read = true; return undefined; },
    async markAllRead() { activity.forEach((a) => { a.read = true; }); return undefined; },
  },
};
