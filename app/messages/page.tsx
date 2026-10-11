import { redirect } from 'next/navigation';

/**
 * Legacy direct messaging is intentionally unavailable during the invite-only
 * beta. Private-help requests use the founder-mediated workflow instead.
 */
export default function MessagesPage() {
  redirect('/');
}
