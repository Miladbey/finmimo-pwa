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
import { useAuth } from "@/lib/auth-context";
import Colors from "@/constants/colors";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const { user, logout } = useAuth();

  const { data: stats, isLoading } = useQuery<any>({
    queryKey: ["/api/me"],
    enabled: !!user,
  });

  const handleLogout = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await logout();
    router.replace("/(auth)/welcome");
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: topInset }]}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  const achievements = stats?.achievements || [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: topInset + 16, paddingBottom: 100 }]}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Text style={styles.screenTitle}>Profile</Text>

      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {(stats?.user?.displayName || "U").charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.displayName}>{stats?.user?.displayName}</Text>
        <Text style={styles.email}>{stats?.user?.email}</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.gridItem}>
          <View style={[styles.gridIcon, { backgroundColor: "rgba(124,58,237,0.1)" }]}>
            <Feather name="award" size={20} color={Colors.light.xp} />
          </View>
          <Text style={styles.gridValue}>{stats?.totalXp || 0}</Text>
          <Text style={styles.gridLabel}>Total XP</Text>
        </View>
        <View style={styles.gridItem}>
          <View style={[styles.gridIcon, { backgroundColor: "rgba(255,107,53,0.1)" }]}>
            <Feather name="zap" size={20} color={Colors.light.streak} />
          </View>
          <Text style={styles.gridValue}>{stats?.streak?.current || 0}</Text>
          <Text style={styles.gridLabel}>Day Streak</Text>
        </View>
        <View style={styles.gridItem}>
          <View style={[styles.gridIcon, { backgroundColor: "rgba(0,184,124,0.1)" }]}>
            <Feather name="check-circle" size={20} color={Colors.light.tint} />
          </View>
          <Text style={styles.gridValue}>{stats?.completedLessons || 0}</Text>
          <Text style={styles.gridLabel}>Lessons</Text>
        </View>
        <View style={styles.gridItem}>
          <View style={[styles.gridIcon, { backgroundColor: "rgba(255,184,0,0.1)" }]}>
            <Feather name="star" size={20} color={Colors.light.accent} />
          </View>
          <Text style={styles.gridValue}>{stats?.streak?.longest || 0}</Text>
          <Text style={styles.gridLabel}>Best Streak</Text>
        </View>
      </View>

      {achievements.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.achievementsList}>
            {achievements.map((a: any, i: number) => (
              <View key={i} style={styles.achievementCard}>
                <View style={styles.achievementIcon}>
                  <Feather name={a.achievement.iconName as any || "award"} size={20} color={Colors.light.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.achievementTitle}>{a.achievement.title}</Text>
                  <Text style={styles.achievementDesc}>{a.achievement.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      <Text style={styles.sectionTitle}>Streak Info</Text>
      <View style={styles.streakCard}>
        <View style={styles.streakRow}>
          <Text style={styles.streakLabel}>Current Streak</Text>
          <Text style={styles.streakValue}>{stats?.streak?.current || 0} days</Text>
        </View>
        <View style={styles.streakRow}>
          <Text style={styles.streakLabel}>Longest Streak</Text>
          <Text style={styles.streakValue}>{stats?.streak?.longest || 0} days</Text>
        </View>
        <View style={styles.streakRow}>
          <Text style={styles.streakLabel}>Streak Freezes</Text>
          <Text style={styles.streakValue}>{stats?.streak?.freezeCount ?? 1} remaining</Text>
        </View>
      </View>

      <Pressable
        onPress={handleLogout}
        style={({ pressed }) => [styles.logoutButton, pressed && { opacity: 0.9 }]}
      >
        <Feather name="log-out" size={18} color={Colors.light.error} />
        <Text style={styles.logoutText}>Sign Out</Text>
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
  screenTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    marginBottom: 16,
  },
  profileCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light.navy,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  avatarText: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  displayName: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  email: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  gridItem: {
    width: "48%" as any,
    backgroundColor: Colors.light.surface,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
    flexGrow: 1,
    flexBasis: "45%",
  },
  gridIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  gridValue: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  gridLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
    marginBottom: 12,
  },
  achievementsList: { gap: 10, marginBottom: 24 },
  achievementCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,184,0,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  achievementTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  achievementDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  streakCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  streakRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  streakLabel: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  streakValue: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(229,62,62,0.08)",
    borderRadius: 14,
    paddingVertical: 16,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.error,
  },
});
