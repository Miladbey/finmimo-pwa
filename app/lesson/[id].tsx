import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
  TextInput,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { apiRequest, queryClient } from "@/lib/query-client";
import { useAuth } from "@/lib/auth-context";
import Colors from "@/constants/colors";

type CardItem =
  | { type: "read"; text: string }
  | { type: "exercise"; exercise: any };

export default function LessonPlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;
  const { user } = useAuth();
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | boolean | null>(null);
  const [numericAnswer, setNumericAnswer] = useState("");
  const [feedback, setFeedback] = useState<any>(null);
  const [completed, setCompleted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalExercises, setTotalExercises] = useState(0);

  const { data: lesson, isدر حال بارگذاری } = useQuery<any>({
    queryKey: ["/api/lessons", id],
    enabled: !!user && !!id,
  });

  const attemptMutation = useMutation({
    mutationFn: async (body: any) => {
      const res = await apiRequest("POST", "/api/attempts", body);
      return res.json();
    },
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/lessons/${id}/complete`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
    },
  });

  if (isدر حال بارگذاری) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: topInset }]}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  if (!lesson) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: topInset }]}>
        <Text>Lesson not found</Text>
      </View>
    );
  }

  const contentCards: any[] = lesson.contentJson || [];
  const exercises: any[] = lesson.exercises || [];

  const allCards: CardItem[] = [
    ...contentCards.map((c: any) => ({ type: "read" as const, text: c.text })),
    ...exercises.map((ex: any) => ({ type: "exercise" as const, exercise: ex })),
  ];

  const currentCard = allCards[currentCardIndex];
  const isLastCard = currentCardIndex >= allCards.length - 1;
  const progress = allCards.length > 0 ? (currentCardIndex + 1) / allCards.length : 0;

  const handleارسالAnswer = async () => {
    if (!currentCard || currentCard.type !== "exercise") return;
    const ex = currentCard.exercise;

    let answer: any;
    if (ex.type === "multiple_choice") answer = { selected: selectedAnswer };
    else if (ex.type === "true_false") answer = { selected: selectedAnswer };
    else if (ex.type === "numeric") answer = { value: numericAnswer };

    try {
      const result = await attemptMutation.mutateAsync({ exerciseId: ex.id, answer });
      setFeedback(result);
      setTotalExercises((c) => c + 1);
      if (result.isCorrect) {
        setCorrectCount((c) => c + 1);
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch {}
  };

  const handleبعدی = async () => {
    if (isLastCard) {
      await completeMutation.mutateAsync();
      setCompleted(true);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }
    setCurrentCardIndex((i) => i + 1);
    setSelectedAnswer(null);
    setNumericAnswer("");
    setFeedback(null);
  };

  if (completed) {
    return (
      <View style={[styles.container, { paddingTop: topInset }]}>
        <View style={styles.completedContainer}>
          <Animated.View entering={FadeIn.duration(500)} style={styles.completedIcon}>
            <Feather name="check-circle" size={56} color={Colors.light.tint} />
          </Animated.View>
          <Animated.Text entering={FadeInDown.delay(200)} style={styles.completedTitle}>
            درس کامل شد!
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(400)} style={styles.completedSub}>
            {lesson.title}
          </Animated.Text>
          <Animated.View entering={FadeInDown.delay(600)} style={styles.completedStats}>
            <View style={styles.completedStat}>
              <Feather name="award" size={20} color={Colors.light.xp} />
              <Text style={styles.completedStatText}>+5 XP</Text>
            </View>
            {totalExercises > 0 && (
              <View style={styles.completedStat}>
                <Feather name="check" size={20} color={Colors.light.tint} />
                <Text style={styles.completedStatText}>
                  {correctCount}/{totalExercises} correct
                </Text>
              </View>
            )}
          </Animated.View>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.doneButton, pressed && { opacity: 0.9 }]}
          >
            <Text style={styles.doneText}>ادامه</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const options = currentCard?.type === "exercise" ? (currentCard.exercise.optionsJson as string[] | null) : null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.scrollContent, { paddingTop: topInset + 16, paddingBottom: bottomInset + 20 }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <Feather name="x" size={22} color={Colors.light.text} />
        </Pressable>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.cardCount}>
          {currentCardIndex + 1}/{allCards.length}
        </Text>
      </View>

      <Text style={styles.lessonTitle}>{lesson.title}</Text>

      {currentCard?.type === "read" && (
        <Animated.View entering={FadeInDown.duration(300)} style={styles.readCard}>
          <Feather name="book-open" size={20} color={Colors.light.tint} style={{ marginBottom: 8 }} />
          <Text style={styles.readText}>{currentCard.text}</Text>
        </Animated.View>
      )}

      {currentCard?.type === "exercise" && (
        <Animated.View entering={FadeInDown.duration(300)}>
          <Text style={styles.exercisePrompt}>{currentCard.exercise.prompt}</Text>

          {currentCard.exercise.type === "multiple_choice" && options && (
            <View style={styles.optionsContainer}>
              {options.map((option: string, i: number) => (
                <Pressable
                  key={i}
                  onPress={() => {
                    if (feedback) return;
                    setSelectedAnswer(i);
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={[
                    styles.optionButton,
                    selectedAnswer === i && !feedback && styles.optionSelected,
                    feedback && i === selectedAnswer && feedback.isCorrect && styles.optionCorrect,
                    feedback && i === selectedAnswer && !feedback.isCorrect && styles.optionنادرست,
                    feedback && !feedback.isCorrect && i === (feedback.correctAnswer as any)?.correct && styles.optionCorrect,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedAnswer === i && !feedback && { color: Colors.light.tint },
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {currentCard.exercise.type === "true_false" && (
            <View style={styles.tfContainer}>
              {[true, false].map((val) => (
                <Pressable
                  key={String(val)}
                  onPress={() => {
                    if (feedback) return;
                    setSelectedAnswer(val);
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={[
                    styles.tfButton,
                    selectedAnswer === val && !feedback && styles.optionSelected,
                    feedback && selectedAnswer === val && feedback.isCorrect && styles.optionCorrect,
                    feedback && selectedAnswer === val && !feedback.isCorrect && styles.optionنادرست,
                  ]}
                >
                  <Feather
                    name={val ? "check" : "x"}
                    size={22}
                    color={
                      selectedAnswer === val
                        ? feedback
                          ? feedback.isCorrect
                            ? Colors.light.correct
                            : Colors.light.incorrect
                          : Colors.light.tint
                        : Colors.light.textSecondary
                    }
                  />
                  <Text style={styles.tfText}>{val ? "True" : "False"}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {currentCard.exercise.type === "numeric" && (
            <TextInput
              style={styles.numericInput}
              value={numericAnswer}
              onChangeText={setNumericAnswer}
              keyboardType="numeric"
              placeholder="Enter your answer"
              placeholderTextColor={Colors.light.tabIconDefault}
              editable={!feedback}
            />
          )}

          {feedback && (
            <View style={[styles.feedbackCard, feedback.isCorrect ? styles.feedbackCorrect : styles.feedbackنادرست]}>
              <View style={styles.feedbackHeader}>
                <Feather
                  name={feedback.isCorrect ? "check-circle" : "x-circle"}
                  size={20}
                  color={feedback.isCorrect ? Colors.light.correct : Colors.light.incorrect}
                />
                <Text style={[styles.feedbackTitle, { color: feedback.isCorrect ? Colors.light.correct : Colors.light.incorrect }]}>
                  {feedback.isCorrect ? "درست است!" : "Not quite"}
                </Text>
              </View>
              <Text style={styles.feedbackExplanation}>{feedback.explanation}</Text>
              {feedback.hint && !feedback.isCorrect && (
                <Text style={styles.feedbackHint}>Hint: {feedback.hint}</Text>
              )}
            </View>
          )}

          {!feedback && (
            <Pressable
              onPress={handleارسالAnswer}
              disabled={selectedAnswer === null && !numericAnswer}
              style={({ pressed }) => [
                styles.submitButton,
                (selectedAnswer === null && !numericAnswer) && { opacity: 0.4 },
                pressed && { opacity: 0.9 },
              ]}
            >
              <Text style={styles.submitText}>بررسی پاسخ</Text>
            </Pressable>
          )}
        </Animated.View>
      )}

      {(currentCard?.type === "read" || feedback) && (
        <Pressable
          onPress={handleبعدی}
          style={({ pressed }) => [styles.nextButton, pressed && { opacity: 0.9 }]}
        >
          <Text style={styles.nextText}>
            {isLastCard ? "Complete Lesson" : "ادامه"}
          </Text>
          <Feather name={isLastCard ? "check" : "arrow-right"} size={18} color="#fff" />
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  scrollContent: { paddingHorizontal: 20, flexGrow: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.light.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  closeButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: Colors.light.tint,
    borderRadius: 3,
  },
  cardCount: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.textSecondary,
    minWidth: 36,
    textAlign: "right",
  },
  lessonTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    marginBottom: 20,
  },
  readCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  readText: {
    fontSize: 17,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
    lineHeight: 26,
  },
  exercisePrompt: {
    fontSize: 19,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
    lineHeight: 28,
    marginBottom: 20,
  },
  optionsContainer: { gap: 10, marginBottom: 20 },
  optionButton: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  optionSelected: { borderColor: Colors.light.tint, backgroundColor: "rgba(0,184,124,0.05)" },
  optionCorrect: { borderColor: Colors.light.correct, backgroundColor: "rgba(0,184,124,0.08)" },
  optionنادرست: { borderColor: Colors.light.incorrect, backgroundColor: "rgba(229,62,62,0.08)" },
  optionText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: Colors.light.text,
  },
  tfContainer: { flexDirection: "row", gap: 12, marginBottom: 20 },
  tfButton: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    gap: 8,
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  tfText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  numericInput: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    fontFamily: "Inter_500Medium",
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
    textAlign: "center",
    marginBottom: 20,
  },
  feedbackCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    gap: 8,
  },
  feedbackCorrect: { backgroundColor: "rgba(0,184,124,0.1)" },
  feedbackنادرست: { backgroundColor: "rgba(229,62,62,0.1)" },
  feedbackHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  feedbackTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  feedbackExplanation: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
    lineHeight: 20,
  },
  feedbackHint: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.light.accent,
    fontStyle: "italic" as const,
  },
  submitButton: {
    backgroundColor: Colors.light.tint,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  submitText: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  nextButton: {
    backgroundColor: Colors.light.navy,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  nextText: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  completedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  completedIcon: { marginBottom: 8 },
  completedTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  completedSub: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  completedStats: {
    flexDirection: "row",
    gap: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  completedStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  completedStatText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  doneButton: {
    backgroundColor: Colors.light.tint,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 48,
    marginTop: 16,
  },
  doneText: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
});
