export type QuestionSummary = {
  id: string;
  title: string;
  role: string;
  topic: string;
  answerCount: number;
  createdLabel: string;
  description?: string;
};

export type Answer = { id: string; text: string; role: string; timeLabel: string };
export type QuestionDetail = QuestionSummary & { description: string; answers: Answer[] };
export type ActivityItem = { id: string; title: string; detail: string; displayTime: string; read: boolean; questionId?: string | null };
