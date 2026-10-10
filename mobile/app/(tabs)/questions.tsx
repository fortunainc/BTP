import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { QuestionCard } from "@/components/QuestionCard";
import { colors, spacing } from "@/constants/theme";
import { previewQuestions } from "@/data/preview";
import { api, liveApiConfigured } from "@/lib/api";
import { useBtpAuth } from "@/lib/auth";
import type { QuestionSummary } from "@/types/question";

export default function QuestionsScreen() {
  const auth = useBtpAuth(); const [questions, setQuestions] = useState<QuestionSummary[]>(previewQuestions); const [query, setQuery] = useState(""); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  const load = useCallback(async () => { if (!liveApiConfigured || !auth.signedIn) return; setLoading(true); setError(""); try { setQuestions(await api.questions.list(await auth.getToken())); } catch (e) { setError(e instanceof Error ? e.message : "Could not load questions"); } finally { setLoading(false); } }, [auth]);
  useEffect(() => { void load(); }, [load]);
  const filtered = useMemo(() => questions.filter((q) => `${q.title} ${q.topic} ${q.role}`.toLowerCase().includes(query.toLowerCase())), [questions, query]);
  return <SafeAreaView edges={["top"]} style={styles.safe}><ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
    <Text style={styles.title}>Questions</Text><View style={styles.search}><Ionicons color={colors.muted} name="search" size={19} /><TextInput onChangeText={setQuery} placeholder="Search questions, topics or roles" placeholderTextColor={colors.muted} style={styles.input} value={query} /></View>
    {!liveApiConfigured && <Text style={styles.preview}>Preview mode · add API and Clerk keys to connect live data</Text>}{error && <Text style={styles.error}>{error}</Text>}{loading && questions.length === 0 && <ActivityIndicator color={colors.accent} />}
    <Text style={styles.section}>Latest from verified members</Text>{filtered.map((question) => <QuestionCard key={question.id} question={question} />)}
  </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ safe:{backgroundColor:colors.background,flex:1},content:{gap:spacing.md,padding:spacing.lg},title:{color:colors.ink,fontSize:30,fontWeight:"700"},search:{alignItems:"center",backgroundColor:colors.surface,borderColor:colors.border,borderRadius:14,borderWidth:1,flexDirection:"row",gap:spacing.sm,paddingHorizontal:spacing.md},input:{color:colors.ink,flex:1,fontSize:15,paddingVertical:14},section:{color:colors.muted,fontSize:13,fontWeight:"700",letterSpacing:.3,marginTop:spacing.sm,textTransform:"uppercase"},preview:{color:colors.muted,fontSize:12},error:{color:colors.danger,fontSize:13} });
