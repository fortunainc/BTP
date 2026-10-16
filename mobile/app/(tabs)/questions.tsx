import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { QuestionCard } from "@/components/QuestionCard";
import { colors, spacing } from "@/constants/theme";
import { api, liveApiConfigured } from "@/lib/api";
import { useBtpAuth } from "@/lib/auth";
import type { QuestionSummary } from "@/types/question";

export default function QuestionsScreen() {
  const auth = useBtpAuth(); const { getToken, signedIn } = auth; const [questions, setQuestions] = useState<QuestionSummary[]>([]); const [query, setQuery] = useState(""); const [loading, setLoading] = useState(liveApiConfigured); const [error, setError] = useState("");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const generation = useRef(0);
  const load = useCallback(async (cursor: string | null = null) => {
    if (!liveApiConfigured || !signedIn) return;
    const current = ++generation.current;
    setLoading(true); setError("");
    try { const result = await api.questions.page(await getToken(), query, cursor);
      if (current !== generation.current) return;
      setQuestions(previous => cursor ? [...previous, ...result.items.filter(item => !previous.some(old => old.id === item.id))] : result.items);
      setNextCursor(result.nextCursor);
    } catch (e) { if (current === generation.current) setError(e instanceof Error ? e.message : "Could not load questions"); }
    finally { if (current === generation.current) setLoading(false); }
  }, [getToken, signedIn, query]);
  useEffect(() => { const timer = setTimeout(() => { void load(); }, 300); return () => { clearTimeout(timer); generation.current++; }; }, [load]);
  const filtered = questions;
  return <SafeAreaView edges={["top"]} style={styles.safe}><ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}>
    <Text style={styles.title}>Questions</Text><View style={styles.search}><Ionicons color={colors.muted} name="search" size={19} /><TextInput onChangeText={setQuery} placeholder="Search questions and topics" placeholderTextColor={colors.muted} style={styles.input} value={query} /></View>
    {!liveApiConfigured && <Text style={styles.preview}>Preview mode · add API and Clerk keys to connect live data</Text>}
    <Text style={styles.section}>Latest from verified members</Text>{loading ? <View style={styles.state}><ActivityIndicator color={colors.accent}/><Text style={styles.stateText}>Loading questions…</Text></View> : error ? <View style={styles.state}><Text style={styles.errorTitle}>Questions are unavailable</Text><Text style={styles.stateText}>{error}</Text><Pressable onPress={() => void load()} style={styles.retry}><Text style={styles.retryText}>Retry</Text></Pressable></View> : questions.length === 0 ? <View style={styles.state}><Text style={styles.emptyTitle}>No questions found</Text><Text style={styles.stateText}>Try another search or ask a question.</Text></View> : filtered.length === 0 ? <View style={styles.state}><Text style={styles.emptyTitle}>No matches</Text><Text style={styles.stateText}>Try a different search.</Text></View> : filtered.map((question) => <QuestionCard key={question.id} question={question} />)}
    {nextCursor && !loading && !error && <Pressable style={styles.retry} onPress={() => void load(nextCursor)}><Text style={styles.retryText}>Load more</Text></Pressable>}
  </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { backgroundColor:colors.background,flex:1},content: { gap:spacing.md,padding:spacing.lg},title: { fontFamily: "Geist", color:colors.ink,fontSize:30,fontWeight:"700"},search: { alignItems:"center",backgroundColor:colors.surface,borderColor:colors.border,borderRadius:14,borderWidth:1,flexDirection:"row",gap:spacing.sm,paddingHorizontal:spacing.md},input: { fontFamily: "Geist", color:colors.ink,flex:1,fontSize:15,paddingVertical:14},section: { fontFamily: "Geist", color:colors.muted,fontSize:13,fontWeight:"700",letterSpacing:.3,marginTop:spacing.sm,textTransform:"uppercase"},preview: { fontFamily: "Geist", color:colors.muted,fontSize:12},state: { alignItems:"center",backgroundColor:colors.surface,borderColor:colors.border,borderRadius:18,borderWidth:1,gap:spacing.sm,padding:spacing.lg},stateText: { fontFamily: "Geist", color:colors.muted,fontSize:14,lineHeight:20,textAlign:"center"},errorTitle: { fontFamily: "Geist", color:colors.danger,fontSize:16,fontWeight:"700"},emptyTitle: { fontFamily: "Geist", color:colors.ink,fontSize:16,fontWeight:"700"},retry: { borderColor:colors.accent,borderRadius:12,borderWidth:1,paddingHorizontal:spacing.lg,paddingVertical:spacing.sm},retryText: { fontFamily: "Geist", color:colors.accent,fontWeight:"700"} });
