export const NOTIFICATION_PREFERENCES = [
  { key: 'validationEnabled', kind: 'VALIDATION', label: 'Feedback on your answers', description: 'When another member marks your answer as helpful or reports that it worked.' },
  { key: 'expansionEnabled', kind: 'EXPANSION', label: 'Questions and replies', description: 'Replies, question updates and requests for your experience.' },
  { key: 'momentumEnabled', kind: 'MOMENTUM', label: 'Account updates', description: 'Updates about your membership and participation.' },
  { key: 'pressureEnabled', kind: 'PRESSURE', label: 'Follow ups and reports', description: 'Question check ins and moderation updates.' },
] as const;
export type NotificationPreferences = { inAppEnabled: boolean } & Record<typeof NOTIFICATION_PREFERENCES[number]['key'], boolean> & { opportunityEnabled?: boolean };
export function enabledNotificationClasses(settings: NotificationPreferences | null) {
  if (settings?.inAppEnabled === false) return [];
  return NOTIFICATION_PREFERENCES.filter(p => settings?.[p.key] !== false).map(p => p.kind);
}
