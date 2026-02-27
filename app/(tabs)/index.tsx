import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Svg, { Circle } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/lib/auth-context";
import Colors from "@/constants/colors";

function ProgressRing({ progress, size = 64, strokeWidth = 5 }: { progress: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.min(progress, 1));

  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={Colors.light.border}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={Colors.light.tint}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={`${circumference}`}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default function خانهScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const { user } = useAuth();

  const { data, isدر حال بارگذاری, refetch, isRefetching } = useQuery<any>({
    queryKey: ["/api/me"],
    enabled: !!user,
  });

  const stats = data;
  const nextLesson = stats?.nextLesson;
  const dailyGoal = stats?.profile?.dailyGoalMinutes || 10;
  const lessonsForGoal = Math.ceil(dailyGoal / 3);
  const todayProgress = Math.min((stats?.todayLessons || 0) / lessonsForGoal, 1);

  if (isدر حال بارگذاری) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: topInset }]}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: topInset + 16, paddingBottom: 100 }]}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.light.tint} />
      }
    >
      <View style={styles.greetingRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>
            Hello, {stats?.user?.displayName?.split(" ")[0] || "یادگیریer"}
          </Text>
          <Text style={styles.greetingSub}>Keep up the great work!</Text>
        </View>
        <View style={styles.streakBadge}>
          <Feather name="zap" size={18} color={Colors.light.streak} />
          <Text style={styles.streakText}>{stats?.streak?.current || 0}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={styles.statIconWrap}>
            <Feather name="award" size={18} color={Colors.light.xp} />
          </View>
          <Text style={styles.statValue}>{stats?.totalXp || 0}</Text>
          <Text style={styles.statLabel}>Total XP</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statIconWrap}>
            <Feather name="zap" size={18} color={Colors.light.streak} />
          </View>
          <Text style={styles.statValue}>{stats?.todayXp || 0}</Text>
          <Text style={styles.statLabel}>امروز's XP</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statIconWrap}>
            <Feather name="check-circle" size={18} color={Colors.light.tint} />
          </View>
          <Text style={styles.statValue}>{stats?.completedLessons || 0}</Text>
          <Text style={styles.statLabel}>Lessons</Text>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [styles.dailyGoalCard, pressed && { opacity: 0.95 }]}
      >
        <View style={styles.dailyGoalLeft}>
          <Text style={styles.dailyGoalTitle}>هدف روزانه</Text>
          <Text style={styles.dailyGoalSub}>
            {stats?.todayLessons || 0} / {lessonsForGoal} درس امروز
          </Text>
          {todayProgress >= 1 && (
            <View style={styles.completedBadge}>
              <Feather name="check" size={14} color={Colors.light.tint} />
              <Text style={styles.completedText}>تکمیل شد!</Text>
            </View>
          )}
        </View>
        <View style={styles.ringContainer}>
          <ProgressRing progress={todayProgress} size={64} strokeWidth={5} />
          <Text style={styles.ringPercent}>{Math.round(todayProgress * 100)}%</Text>
        </View>
      </Pressable>

      {nextLesson && (
        <Pressable
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push(`/lesson/${nextLesson.lesson.id}` as any);
          }}
          style={({ pressed }) => [pressed && { opacity: 0.95 }]}
        >
          <LinearGradient
            colors={["#0B1A2E", "#143560"]}
            style={styles.continueCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.continueTop}>
              <View style={styles.continuePill}>
                <Text style={styles.continuePillText}>ادامه یادگیریing</Text>
              </View>
              <Feather name="arrow-right" size={20} color="rgba(255,255,255,0.6)" />
            </View>
            <Text style={styles.continueTitle}>{nextLesson.lesson.title}</Text>
            <Text style={styles.continueSub}>
              {nextLesson.skill.title} · {nextLesson.path.title}
            </Text>
          </LinearGradient>
        </Pressable>
      )}

      {!nextLesson && (stats?.completedLessons || 0) > 0 && (
        <View style={styles.allDoneCard}>
          <Feather name="award" size={32} color={Colors.light.accent} />
          <Text style={styles.allDoneTitle}>همه چیز به‌روز است!</Text>
          <Text style={styles.allDoneSub}>
            همه درس‌های موجود را کامل کرده‌اید. Try some practice exercises!
          </Text>
        </View>
      )}

      <Pressable
        onPress={() => {
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push("/(tabs)/practice" as any);
        }}
        style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.95 }]}
      >
        <View style={[styles.actionIcon, { backgroundColor: "rgba(124,58,237,0.1)" }]}>
          <Ionicons name="fitness-outline" size={22} color={Colors.light.xp} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.actionTitle}>تمرین</Text>
          <Text style={styles.actionSub}>Review exercises to strengthen your knowledge</Text>
        </View>
        <Feather name="chevron-right" size={20} color={Colors.light.tabIconDefault} />
      </Pressable>
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
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  greetingSub: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,107,53,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  streakText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.light.streak,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.light.surfaceSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
  },
  dailyGoalCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  dailyGoalLeft: { flex: 1, gap: 4 },
  dailyGoalTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  dailyGoalSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  completedText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.tint,
  },
  ringContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  ringPercent: {
    position: "absolute",
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: Colors.light.tint,
  },
  continueCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  continueTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  continuePill: {
    backgroundColor: "rgba(0,184,124,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  continuePillText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.tint,
  },
  continueTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
    marginBottom: 4,
  },
  continueSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.6)",
  },
  allDoneCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  allDoneTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  allDoneSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  actionCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  actionTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  actionSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
});
