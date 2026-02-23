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
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/lib/auth-context";
import Colors from "@/constants/colors";

const skillColors = ["#00B87C", "#FFB800", "#E53E3E", "#7C3AED", "#FF6B35"];

export default function LearnScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const { user } = useAuth();

  const { data: paths, isLoading: pathsLoading } = useQuery<any[]>({
    queryKey: ["/api/paths"],
    enabled: !!user,
  });

  const firstPathId = paths?.[0]?.id;
  const { data: pathData, isLoading: pathLoading } = useQuery<any>({
    queryKey: ["/api/paths", firstPathId],
    enabled: !!firstPathId,
  });

  const { data: meData } = useQuery<any>({
    queryKey: ["/api/me"],
    enabled: !!user,
  });

  const completedLessonIds = new Set(
    (meData?.progress || [])
      .filter((p: any) => p.status === "completed")
      .map((p: any) => p.lessonId)
  );

  const isLoading = pathsLoading || pathLoading;

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: topInset }]}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  const path = pathData;
  const skills = path?.skills || [];

  const getSkillProgress = (skillId: string) => {
    const skillProgress = (meData?.progress || []).filter(
      (p: any) => p.skillId === skillId && p.status === "completed"
    );
    return skillProgress.length;
  };

  const isSkillUnlocked = (index: number) => {
    if (index === 0) return true;
    const prevSkill = skills[index - 1];
    return getSkillProgress(prevSkill.id) >= 6;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: topInset + 16, paddingBottom: 100 }]}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Text style={styles.screenTitle}>Learn</Text>

      {path && (
        <LinearGradient
          colors={["#0B1A2E", "#1A2D47"]}
          style={styles.pathHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.pathIconWrap}>
            <Feather name="trending-up" size={24} color={Colors.light.tint} />
          </View>
          <Text style={styles.pathTitle}>{path.title}</Text>
          <Text style={styles.pathDesc}>{path.description}</Text>
          <View style={styles.pathStats}>
            <Text style={styles.pathStat}>{skills.length} Skills</Text>
            <View style={styles.pathDot} />
            <Text style={styles.pathStat}>{skills.length * 6} Lessons</Text>
          </View>
        </LinearGradient>
      )}

      <View style={styles.skillsList}>
        {skills.map((skill: any, index: number) => {
          const unlocked = isSkillUnlocked(index);
          const progress = getSkillProgress(skill.id);
          const color = skillColors[index % skillColors.length];

          return (
            <Pressable
              key={skill.id}
              onPress={() => {
                if (!unlocked) return;
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/skill/${skill.id}` as any);
              }}
              style={({ pressed }) => [
                styles.skillCard,
                !unlocked && styles.skillLocked,
                pressed && unlocked && { opacity: 0.95 },
              ]}
            >
              <View style={styles.skillLeft}>
                <View style={[styles.skillNumber, { backgroundColor: unlocked ? color : Colors.light.tabIconDefault }]}>
                  <Text style={styles.skillNumberText}>{index + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.skillTitle, !unlocked && styles.lockedText]}>{skill.title}</Text>
                  <Text style={[styles.skillDesc, !unlocked && styles.lockedText]} numberOfLines={1}>
                    {skill.description}
                  </Text>
                  {unlocked && (
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${(progress / 6) * 100}%`, backgroundColor: color }]} />
                    </View>
                  )}
                </View>
              </View>
              {!unlocked ? (
                <Feather name="lock" size={18} color={Colors.light.tabIconDefault} />
              ) : progress >= 6 ? (
                <Feather name="check-circle" size={20} color={Colors.light.tint} />
              ) : (
                <Feather name="chevron-right" size={20} color={Colors.light.tabIconDefault} />
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
  screenTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    marginBottom: 16,
  },
  pathHeader: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    gap: 8,
  },
  pathIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(0,184,124,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  pathTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  pathDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.7)",
    lineHeight: 20,
  },
  pathStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  pathStat: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.5)",
  },
  pathDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  skillsList: { gap: 12 },
  skillCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  skillLocked: { opacity: 0.5 },
  skillLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  skillNumber: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  skillNumberText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  skillTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  skillDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  lockedText: { color: Colors.light.tabIconDefault },
  progressBar: {
    height: 4,
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: 2,
    marginTop: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
});
