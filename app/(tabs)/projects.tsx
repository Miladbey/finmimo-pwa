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
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { apiRequest, queryClient } from "@/lib/query-client";
import { useAuth } from "@/lib/auth-context";
import Colors from "@/constants/colors";

const projectIcons: Record<string, any> = {
  "Monthly Budget Builder": "pie-chart",
  "Emergency Fund Plan": "shield",
  "Debt Payoff Simulator": "credit-card",
  "Investing Simulator": "bar-chart-2",
  "Retirement Projection": "target",
};

function computeResults(title: string, data: Record<string, string>) {
  const num = (key: string) => parseFloat(data[key] || "0") || 0;

  if (title === "Monthly Budget Builder") {
    const income = num("monthlyIncome");
    const needs = num("rent") + num("utilities") + num("insurance") + num("groceries") + num("transportation");
    const wants = num("dining") + num("entertainment") + num("subscriptions");
    const savings = num("savings");
    const total = needs + wants + savings;
    const remaining = income - total;
    return [
      { label: "Total Expenses", value: `$${total.toLocaleString()}` },
      { label: "Remaining Income", value: `$${remaining.toLocaleString()}`, highlight: remaining >= 0 },
      { label: "Needs", value: `${income > 0 ? Math.round((needs / income) * 100) : 0}%` },
      { label: "Wants", value: `${income > 0 ? Math.round((wants / income) * 100) : 0}%` },
      { label: "Savings", value: `${income > 0 ? Math.round((savings / income) * 100) : 0}%` },
    ];
  }
  if (title === "Emergency Fund Plan") {
    const target = num("monthlyExpenses") * num("targetMonths");
    const needed = Math.max(0, target - num("currentSavings"));
    const months = num("monthlySavingAmount") > 0 ? Math.ceil(needed / num("monthlySavingAmount")) : 0;
    return [
      { label: "Target Amount", value: `$${target.toLocaleString()}` },
      { label: "Amount Needed", value: `$${needed.toLocaleString()}` },
      { label: "Months to Goal", value: `${months} months` },
    ];
  }
  if (title === "Debt Payoff Simulator") {
    const b1 = num("debt1Balance");
    const r1 = num("debt1Rate") / 100 / 12;
    const b2 = num("debt2Balance");
    const r2 = num("debt2Rate") / 100 / 12;
    const extra = num("extraMonthly");
    const totalDebt = b1 + b2;
    const avgRate = totalDebt > 0 ? ((num("debt1Rate") * b1 + num("debt2Rate") * b2) / totalDebt) : 0;
    const estMonths = extra > 0 ? Math.ceil(totalDebt / (num("debt1MinPayment") + num("debt2MinPayment") + extra)) : 0;
    return [
      { label: "Total Debt", value: `$${totalDebt.toLocaleString()}` },
      { label: "Avg Interest Rate", value: `${avgRate.toFixed(1)}%` },
      { label: "Est. Payoff Time", value: `~${estMonths} months` },
      { label: "Extra Payment/mo", value: `$${extra.toLocaleString()}` },
    ];
  }
  if (title === "Investing Simulator") {
    const total = num("totalAmount");
    const monthly = num("monthlyContribution");
    const rate = num("annualReturn") / 100;
    const years = num("years");
    const lumpSum = total * Math.pow(1 + rate, years);
    let dca = 0;
    for (let i = 0; i < years * 12; i++) {
      dca = (dca + monthly) * (1 + rate / 12);
    }
    return [
      { label: "Lump Sum Result", value: `$${Math.round(lumpSum).toLocaleString()}` },
      { label: "DCA Result", value: `$${Math.round(dca).toLocaleString()}` },
      { label: "Difference", value: `$${Math.abs(Math.round(lumpSum - dca)).toLocaleString()}` },
    ];
  }
  if (title === "Retirement Projection") {
    const years = num("retirementAge") - num("currentAge");
    const rate = num("annualReturn") / 100;
    let balance = num("currentSavings");
    const monthly = num("monthlyContribution");
    for (let i = 0; i < years * 12; i++) {
      balance = (balance + monthly) * (1 + rate / 12);
    }
    const totalContributed = num("currentSavings") + monthly * years * 12;
    return [
      { label: "Projected Balance", value: `$${Math.round(balance).toLocaleString()}` },
      { label: "Years to Retirement", value: `${years} years` },
      { label: "Total Contributed", value: `$${Math.round(totalContributed).toLocaleString()}` },
      { label: "Total Growth", value: `$${Math.round(balance - totalContributed).toLocaleString()}` },
    ];
  }
  return [];
}

export default function ProjectsScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const { user } = useAuth();
  const [activeProject, setActiveProject] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [results, setResults] = useState<any[]>([]);

  const { data: paths } = useQuery<any[]>({ queryKey: ["/api/paths"], enabled: !!user });
  const firstPathId = paths?.[0]?.id;
  const { data: pathData, isLoading } = useQuery<any>({
    queryKey: ["/api/paths", firstPathId],
    enabled: !!firstPathId,
  });

  const skills = pathData?.skills || [];
  const skillIds = skills.map((s: any) => s.id);

  const skillQueries = useQuery<any>({
    queryKey: ["/api/skills", skillIds[0]],
    enabled: !!skillIds[0],
  });

  const submitMutation = useMutation({
    mutationFn: async ({ projectId, data }: { projectId: string; data: any }) => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/submit`, { data });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const handleCompute = () => {
    if (!activeProject) return;
    const computed = computeResults(activeProject.title, formData);
    setResults(computed);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleSubmit = async () => {
    if (!activeProject) return;
    try {
      await submitMutation.mutateAsync({ projectId: activeProject.id, data: formData });
      setActiveProject(null);
      setFormData({});
      setResults([]);
    } catch {}
  };

  if (activeProject) {
    const schema = activeProject.schemaJson as any;
    const fields = schema.fields || [];

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: topInset + 16, paddingBottom: 100 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => { setActiveProject(null); setFormData({}); setResults([]); }} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={Colors.light.text} />
        </Pressable>

        <Text style={styles.projectTitle}>{activeProject.title}</Text>
        <Text style={styles.projectDesc}>{activeProject.description}</Text>

        <View style={styles.disclaimerBox}>
          <Feather name="alert-triangle" size={16} color={Colors.light.accent} />
          <Text style={styles.disclaimerText}>Educational simulation only. Not financial advice.</Text>
        </View>

        {fields.map((field: any) => (
          <View key={field.key} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
              {field.label} {field.required && "*"}
            </Text>
            <TextInput
              style={styles.fieldInput}
              value={formData[field.key] || ""}
              onChangeText={(val) => setFormData((prev) => ({ ...prev, [field.key]: val }))}
              keyboardType={field.type === "number" ? "numeric" : "default"}
              placeholder={`Enter ${field.label.toLowerCase()}`}
              placeholderTextColor={Colors.light.tabIconDefault}
            />
          </View>
        ))}

        <Pressable
          onPress={handleCompute}
          style={({ pressed }) => [styles.computeButton, pressed && { opacity: 0.9 }]}
        >
          <Feather name="cpu" size={18} color="#fff" />
          <Text style={styles.computeText}>Calculate Results</Text>
        </Pressable>

        {results.length > 0 && (
          <View style={styles.resultsCard}>
            <Text style={styles.resultsTitle}>Results</Text>
            {results.map((r, i) => (
              <View key={i} style={styles.resultRow}>
                <Text style={styles.resultLabel}>{r.label}</Text>
                <Text style={[styles.resultValue, r.highlight === false && { color: Colors.light.error }]}>
                  {r.value}
                </Text>
              </View>
            ))}
            <Pressable
              onPress={handleSubmit}
              disabled={submitMutation.isPending}
              style={({ pressed }) => [styles.saveButton, pressed && { opacity: 0.9 }]}
            >
              <Text style={styles.saveText}>
                {submitMutation.isPending ? "Saving..." : "Save Project (+20 XP)"}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: topInset }]}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: topInset + 16, paddingBottom: 100 }]}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Text style={styles.screenTitle}>Projects</Text>
      <Text style={styles.screenDesc}>
        Apply what you've learned with guided financial simulations.
      </Text>

      {skills.map((skill: any, index: number) => {
        const iconName = projectIcons[
          index === 0 ? "Monthly Budget Builder" :
          index === 1 ? "Emergency Fund Plan" :
          index === 2 ? "Debt Payoff Simulator" :
          index === 3 ? "Investing Simulator" : "Retirement Projection"
        ] || "folder";

        const projectTitles = [
          "Monthly Budget Builder",
          "Emergency Fund Plan",
          "Debt Payoff Simulator",
          "Investing Simulator",
          "Retirement Projection",
        ];

        return (
          <Pressable
            key={skill.id}
            onPress={async () => {
              try {
                const res = await apiRequest("GET", `/api/skills/${skill.id}`);
                const data = await res.json();
                if (data.project) {
                  setActiveProject(data.project);
                  setFormData({});
                  setResults([]);
                }
              } catch {}
            }}
            style={({ pressed }) => [styles.projectCard, pressed && { opacity: 0.95 }]}
          >
            <View style={[styles.projectIcon, { backgroundColor: `${["#00B87C", "#FFB800", "#E53E3E", "#7C3AED", "#FF6B35"][index]}15` }]}>
              <Feather name={iconName as any} size={22} color={["#00B87C", "#FFB800", "#E53E3E", "#7C3AED", "#FF6B35"][index]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.projectCardTitle}>{projectTitles[index]}</Text>
              <Text style={styles.projectCardSub}>{skill.title}</Text>
            </View>
            <View style={styles.xpBadge}>
              <Text style={styles.xpBadgeText}>+20 XP</Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  centered: { justifyContent: "center", alignItems: "center" },
  content: { paddingHorizontal: 20 },
  screenTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    marginBottom: 4,
  },
  screenDesc: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginBottom: 20,
  },
  projectCard: {
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
  projectIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  projectCardTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  projectCardSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  xpBadge: {
    backgroundColor: "rgba(124,58,237,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  xpBadgeText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.xp,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: -8,
    marginBottom: 8,
  },
  projectTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    marginBottom: 4,
  },
  projectDesc: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginBottom: 16,
  },
  disclaimerBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,184,0,0.1)",
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  disclaimerText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.light.accent,
    flex: 1,
  },
  fieldContainer: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.light.text,
    marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  computeButton: {
    backgroundColor: Colors.light.navy,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  computeText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  resultsCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 12,
  },
  resultsTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  resultLabel: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  resultValue: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  saveButton: {
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  saveText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
});
