import { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppScreen } from '@/components/AppScreen';
import { useBtpAuth } from '@/lib/auth';
import { apiRequest } from '@/lib/api';
import { colors } from '@/constants/theme';
export default function PrivateHelpScreen() {
  const { requestId } = useLocalSearchParams<{ requestId?: string }>();
  const { getToken } = useBtpAuth(); const [details, setDetails] = useState(''); const [busy, setBusy] = useState(false);
  async function submit() {
    if (busy || !details.trim()) return; setBusy(true);
    try { await apiRequest('/api/help-requests', { token: await getToken(), method: requestId ? 'PATCH' : 'POST', body: JSON.stringify(requestId ? { id: requestId, feedback: details } : { helpType: 'INTERVIEW_PREP', details }) }); Alert.alert(requestId ? 'Feedback received' : 'Request received', requestId ? 'Your feedback is visible only to you and authorized BTP staff.' : 'BTP will review your request privately. You can see its status under You.'); router.back(); }
    catch (e) { Alert.alert('Request not submitted', e instanceof Error ? e.message : 'Please retry.'); } finally { setBusy(false); }
  }
  return <AppScreen><Text style={{ fontSize: 28, color: colors.ink }}>{requestId ? "Private help feedback" : "Interview preparation"}</Text><Text style={{ color: colors.muted }}>{requestId ? "Tell BTP what helped and what could improve." : "Tell BTP what you need help preparing for."} Do not include patient information, employer names, confidential materials, or identifying details. No community question is required.</Text><TextInput accessibilityLabel="Help request details" multiline maxLength={2000} value={details} onChangeText={setDetails} placeholder="What would you like help with?" style={{ minHeight: 160, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 16, color: colors.ink }}/><Pressable disabled={busy || !details.trim()} onPress={() => void submit()} style={{ backgroundColor: colors.accent, borderRadius: 12, padding: 16 }}><Text style={{ color: colors.white }}>{busy ? 'Submitting…' : requestId ? 'Submit feedback' : 'Request private help'}</Text></Pressable><Pressable onPress={() => router.back()}><Text style={{ color: colors.accent }}>Cancel</Text></Pressable><View><Text style={{ color: colors.muted }}>Requests are reviewed manually during beta. Availability, scope and any fee must be agreed before help begins.</Text></View></AppScreen>;
}
