import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const handlePress = (route: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };

  return (
    <LinearGradient colors={["#0B1A2E", "#0F2847", "#143560"]} style={styles.container}>
      <View style={[styles.content, { paddingTop: topInset + 60, paddingBottom: bottomInset + 20 }]}>
        <View style={styles.heroSection}>
          <View style={styles.iconContainer}>
            <LinearGradient colors={["#00B87C", "#00D68F"]} style={styles.iconGradient}>
              <Feather name="trending-up" size={40} color="#fff" />
            </LinearGradient>
          </View>
          <Text style={styles.title}>FinMimo</Text>
          <Text style={styles.subtitle}>
            Master personal finance{"\n"}one bite-sized lesson at a time
          </Text>
        </View>

        <View style={styles.features}>
          {[
            { icon: "book-open" as const, text: "Interactive lessons" },
            { icon: "zap" as const, text: "Earn XP & streaks" },
            { icon: "bar-chart-2" as const, text: "Track your progress" },
          ].map((feature, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureDot}>
                <Feather name={feature.icon} size={18} color={Colors.light.tint} />
              </View>
              <Text style={styles.featureText}>{feature.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.buttonContainer}>
          <Pressable
            onPress={() => handlePress("/(auth)/signup")}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </Pressable>
          <Pressable
            onPress={() => handlePress("/(auth)/login")}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.secondaryButtonText}>I already have an account</Text>
          </Pressable>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: "space-between" },
  heroSection: { alignItems: "center", gap: 16 },
  iconContainer: { marginBottom: 8 },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 36,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    lineHeight: 24,
  },
  features: { gap: 16, paddingHorizontal: 20 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  featureDot: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(0,184,124,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  featureText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.9)",
  },
  buttonContainer: { gap: 12 },
  primaryButton: {
    backgroundColor: Colors.light.tint,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  secondaryButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.8)",
  },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
});
