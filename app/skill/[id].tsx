import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/lib/auth-context";
import Colors from "@/constants/colors";

export default function SkillDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;
  const { user } = useAuth();

  const { data: skill, isدر حال بارگذاری } = useQuery<any>({
    queryKey: ["/api/skills", id],
    enabled: !!user && !!id,
  });

  if (isدر حال بارگذاری) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: topInset }]}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  if (!skill) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: topInset }]}>
        <Text style={styles.errorText}>Skill not found</Text>
      </View>
    );
  }

  const lessons = skill.lessons || [];
  const completedCount = lessons.filter((l: any) => l.progress?.status === "completed").length;

  const isLessonUnlocked = (index: number) => {
    if (index === 0) return true;
    const prevLesson = lessons[index - 1];
    return prevLesson.progress?.status === "completed";
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: topInset + 16, paddingBottom: bottomInset + 20 }]}
    >
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Feather name="arrow-left" size={24} color={Colors.light.text} />
      </Pressable>

      <View style={styles.header}>
        <View style={styles.skillIcon}>
          <Feather name={skill.iconName as any || "star"} size={28} color={Colors.light.tint} />
        </View>
        <Text style={styles.skillTitle}>{skill.title}</Text>
        <Text style={styles.skillDesc}>{skill.description}</Text>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>{completedCount} / {lessons.length} lessons completed</Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0}%` },
              ]}
            />
          </View>
        </View>
      </View>

      <View style={styles.lessonsList}>
        {lessons.map((lesson: any, index: number) => {
          const unlocked = isLessonUnlocked(index);
          const completed = lesson.progress?.status === "completed";

          return (
            <Pressable
              key={lesson.id}
              onPress={() => {
                if (!unlocked) return;
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/lesson/${lesson.id}` as any);
              }}
              style={({ pressed }) => [
                styles.lessonCard,
                !unlocked && styles.locked,
                pressed && unlocked && { opacity: 0.95 },
              ]}
            >
              <View style={[styles.lessonNumber, completed ? styles.lessonComplete : unlocked ? styles.lessonActive : styles.lessonInactive]}>
                {completed ? (
                  <Feather name="check" size={16} color="#fff" />
                ) : (
                  <Text style={[styles.lessonNumText, !unlocked && { color: Colors.light.tabIconDefault }]}>
                    {index + 1}
                  </Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.lessonTitle, !unlocked && styles.lockedText]}>{lesson.title}</Text>
                <Text style={[styles.lessonSub, !unlocked && styles.lockedText]}>
                  {completed ? "Completed" : unlocked ? "Ready to learn" : "Locked"}
                </Text>
              </View>
              {unlocked && !completed && (
                <Feather name="play-circle" size={22} color={Colors.light.tint} />
              )}
              {!unlocked && (
                <Feather name="lock" size={18} color={Colors.light.tabIconDefault} />
              )}
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  content: { paddingHorizontal: 20 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.light.background,
  },
  errorText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: -8,
  },
  header: {
    alignItems: "center",
    gap: 8,
    marginBottom: 28,
    paddingHorizontal: 20,
  },
  skillIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: "rgba(0,184,124,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  skillTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    textAlign: "center",
  },
  skillDesc: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  progressInfo: { width: "100%", gap: 6, marginTop: 8 },
  progressText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.light.tint,
    borderRadius: 3,
  },
  lessonsList: { gap: 10 },
  lessonCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  locked: { opacity: 0.5 },
  lessonNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  lessonComplete: { backgroundColor: Colors.light.tint },
  lessonActive: { backgroundColor: Colors.light.surfaceSecondary },
  lessonInactive: { backgroundColor: Colors.light.surfaceSecondary },
  lessonNumText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  lessonTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  lessonSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  lockedText: { color: Colors.light.tabIconDefault },
});
