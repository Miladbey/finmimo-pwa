import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
  TextInput,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { apiRequest, queryClient } from "@/lib/query-client";
import { useAuth } from "@/lib/auth-context";
import Colors from "@/constants/colors";

export default function PracticeScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | boolean | null>(null);
  const [numericAnswer, setNumericAnswer] = useState("");
  const [feedback, setFeedback] = useState<any>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);

  const { data: queue, isLoading, refetch } = useQuery<any[]>({
    queryKey: ["/api/practice/queue"],
    enabled: !!user && sessionStarted,
  });

  const attemptMutation = useMutation({
    mutationFn: async (body: any) => {
      const res = await apiRequest("POST", "/api/attempts", body);
      return res.json();
    },
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/practice/complete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
    },
  });

  const currentExercise = queue?.[currentIndex];

  const handleSubmit = async () => {
    if (!currentExercise) return;

    let answer: any;
    if (currentExercise.type === "multiple_choice") {
      answer = { selected: selectedAnswer };
    } else if (currentExercise.type === "true_false") {
      answer = { selected: selectedAnswer };
    } else if (currentExercise.type === "numeric") {
      answer = { value: numericAnswer };
    }

    try {
      const result = await attemptMutation.mutateAsync({
        exerciseId: currentExercise.id,
        answer,
      });
      setFeedback(result);
      setAnsweredCount((c) => c + 1);
      if (result.isCorrect) {
        setCorrectCount((c) => c + 1);
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch {}
  };

  const handleNext = () => {
    setFeedback(null);
    setSelectedAnswer(null);
    setNumericAnswer("");
    if (currentIndex + 1 >= (queue?.length || 0)) {
      setSessionComplete(true);
      completeMutation.mutate();
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handleNewSession = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setNumericAnswer("");
    setFeedback(null);
    setCorrectCount(0);
    setAnsweredCount(0);
    setSessionComplete(false);
    refetch();
  };

  if (!sessionStarted) {
    return (
      <View style={[styles.container, { paddingTop: topInset + 16 }]}>
        <View style={styles.startContainer}>
          <View style={styles.startIcon}>
            <Feather name="repeat" size={40} color={Colors.light.xp} />
          </View>
          <Text style={styles.startTitle}>Practice Mode</Text>
          <Text style={styles.startDesc}>
            Review exercises you've encountered before. Focus on areas where you need improvement.
          </Text>
          <Text style={styles.startReward}>+15 XP per session</Text>
          <Pressable
            onPress={() => {
              setSessionStarted(true);
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
            style={({ pressed }) => [styles.startButton, pressed && { opacity: 0.9 }]}
          >
            <Text style={styles.startButtonText}>Start Practice</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: topInset }]}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  if (!queue || queue.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: topInset + 16 }]}>
        <View style={styles.startContainer}>
          <Feather name="book-open" size={40} color={Colors.light.textSecondary} />
          <Text style={styles.startTitle}>No exercises yet</Text>
          <Text style={styles.startDesc}>Complete some lessons first to unlock practice mode.</Text>
        </View>
      </View>
    );
  }

  if (sessionComplete) {
    return (
      <View style={[styles.container, { paddingTop: topInset + 16 }]}>
        <View style={styles.startContainer}>
          <Feather name="award" size={48} color={Colors.light.accent} />
          <Text style={styles.startTitle}>Session Complete!</Text>
          <Text style={styles.scoreText}>
            {correctCount} / {answeredCount} correct
          </Text>
          <Text style={styles.startReward}>+15 XP earned</Text>
          <Pressable
            onPress={handleNewSession}
            style={({ pressed }) => [styles.startButton, pressed && { opacity: 0.9 }]}
          >
            <Text style={styles.startButtonText}>Practice Again</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const options = currentExercise?.optionsJson as string[] | null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.exerciseContent, { paddingTop: topInset + 16, paddingBottom: 100 }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.progressHeader}>
        <Text style={styles.progressText}>
          {currentIndex + 1} / {queue.length}
        </Text>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${((currentIndex + 1) / queue.length) * 100}%` },
            ]}
          />
        </View>
      </View>

      <Text style={styles.exercisePrompt}>{currentExercise.prompt}</Text>

      {currentExercise.type === "multiple_choice" && options && (
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
                feedback && i === selectedAnswer && !feedback.isCorrect && styles.optionIncorrect,
                feedback && !feedback.isCorrect && i === (feedback.correctAnswer as any)?.correct && styles.optionCorrect,
              ]}
            >
              <Text
                style={[
                  styles.optionText,
                  selectedAnswer === i && !feedback && styles.optionTextSelected,
                  feedback && i === selectedAnswer && feedback.isCorrect && styles.optionTextCorrect,
                  feedback && i === selectedAnswer && !feedback.isCorrect && styles.optionTextIncorrect,
                ]}
              >
                {option}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {currentExercise.type === "true_false" && (
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
                feedback && selectedAnswer === val && !feedback.isCorrect && styles.optionIncorrect,
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
              <Text
                style={[
                  styles.tfText,
                  selectedAnswer === val && !feedback && { color: Colors.light.tint },
                ]}
              >
                {val ? "True" : "False"}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {currentExercise.type === "numeric" && (
        <View style={styles.numericContainer}>
          <TextInput
            style={styles.numericInput}
            value={numericAnswer}
            onChangeText={setNumericAnswer}
            keyboardType="numeric"
            placeholder="Enter your answer"
            placeholderTextColor={Colors.light.tabIconDefault}
            editable={!feedback}
          />
        </View>
      )}

      {feedback && (
        <View style={[styles.feedbackCard, feedback.isCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect]}>
          <View style={styles.feedbackHeader}>
            <Feather
              name={feedback.isCorrect ? "check-circle" : "x-circle"}
              size={20}
              color={feedback.isCorrect ? Colors.light.correct : Colors.light.incorrect}
            />
            <Text style={[styles.feedbackTitle, { color: feedback.isCorrect ? Colors.light.correct : Colors.light.incorrect }]}>
              {feedback.isCorrect ? "Correct!" : "Not quite"}
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
          onPress={handleSubmit}
          disabled={selectedAnswer === null && !numericAnswer}
          style={({ pressed }) => [
            styles.submitButton,
            (selectedAnswer === null && !numericAnswer) && styles.submitDisabled,
            pressed && { opacity: 0.9 },
          ]}
        >
          <Text style={styles.submitText}>Check Answer</Text>
        </Pressable>
      )}

      {feedback && (
        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [styles.nextButton, pressed && { opacity: 0.9 }]}
        >
          <Text style={styles.nextText}>
            {currentIndex + 1 >= queue.length ? "Finish Session" : "Next Question"}
          </Text>
          <Feather name="arrow-right" size={18} color="#fff" />
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  centered: { justifyContent: "center", alignItems: "center" },
  startContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  startIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "rgba(124,58,237,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  startTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  startDesc: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  startReward: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.xp,
    marginTop: 4,
  },
  startButton: {
    backgroundColor: Colors.light.tint,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 40,
    marginTop: 16,
  },
  startButtonText: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  scoreText: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  exerciseContent: { paddingHorizontal: 20 },
  progressHeader: { marginBottom: 24, gap: 8 },
  progressText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.textSecondary,
  },
  progressBarBg: {
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
  exercisePrompt: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
    lineHeight: 28,
    marginBottom: 24,
  },
  optionsContainer: { gap: 10, marginBottom: 24 },
  optionButton: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  optionSelected: { borderColor: Colors.light.tint, backgroundColor: "rgba(0,184,124,0.05)" },
  optionCorrect: { borderColor: Colors.light.correct, backgroundColor: "rgba(0,184,124,0.08)" },
  optionIncorrect: { borderColor: Colors.light.incorrect, backgroundColor: "rgba(229,62,62,0.08)" },
  optionText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: Colors.light.text,
  },
  optionTextSelected: { color: Colors.light.tint },
  optionTextCorrect: { color: Colors.light.correct },
  optionTextIncorrect: { color: Colors.light.incorrect },
  tfContainer: { flexDirection: "row", gap: 12, marginBottom: 24 },
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
  numericContainer: { marginBottom: 24 },
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
  },
  feedbackCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    gap: 8,
  },
  feedbackCorrect: { backgroundColor: "rgba(0,184,124,0.1)" },
  feedbackIncorrect: { backgroundColor: "rgba(229,62,62,0.1)" },
  feedbackHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  feedbackTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
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
  },
  submitDisabled: { opacity: 0.4 },
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
  },
  nextText: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
});
