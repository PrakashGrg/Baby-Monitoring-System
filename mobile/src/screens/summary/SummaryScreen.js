import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { activityAPI } from '../../services/api';
import { colors, spacing, radius, typography, shadow } from '../../theme';

const SW = Dimensions.get('window').width - spacing.lg * 2;

const chartConfig = {
  backgroundColor: colors.bgCard,
  backgroundGradientFrom: colors.bgCard,
  backgroundGradientTo: colors.bgCard,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(91,110,232,${opacity})`,
  labelColor: () => colors.textSecondary,
  style: { borderRadius: 16 },
  propsForDots: { r: '4', strokeWidth: '2', stroke: colors.primary },
};

export default function SummaryScreen({ route, navigation }) {
  const { baby } = route.params || {};
  const [summary, setSummary] = useState(null);
  const [weekly, setWeekly] = useState(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (!baby) return;
    (async () => {
      setLoading(true);
      try {
        const [s, w] = await Promise.all([
          activityAPI.summary(baby.id, date),
          activityAPI.weeklyChart(baby.id),
        ]);
        setSummary(s);
        setWeekly(w);
      } catch {}
      setLoading(false);
    })();
  }, [baby, date]);

  const fmtMins = (m) => {
    if (!m) return '0m';
    const h = Math.floor(m / 60);
    const min = m % 60;
    return h > 0 ? `${h}h ${min}m` : `${min}m`;
  };

  const shiftDate = (n) => {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    if (d <= new Date()) setDate(d.toISOString().slice(0, 10));
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Daily Summary</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Date selector */}
      <View style={styles.dateRow}>
        <TouchableOpacity onPress={() => shiftDate(-1)} style={styles.dateArrow}>
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.dateLabel}>
          {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
        <TouchableOpacity onPress={() => shiftDate(1)} style={styles.dateArrow}>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Stat cards */}
      {summary && (
        <View style={styles.statGrid}>
          <StatCard icon="moon-outline"       color={colors.primary} label="Total sleep"  value={fmtMins(summary.total_sleep_minutes)} />
          <StatCard icon="sunny-outline"      color={colors.amber}   label="Awake time"   value={fmtMins(summary.total_awake_minutes)} />
          <StatCard icon="volume-high-outline" color={colors.accent}  label="Cry events"   value={`${summary.cry_count}×`} />
          <StatCard icon="walk-outline"       color={colors.green}   label="Motion events" value={`${summary.motion_count}×`} />
          <StatCard icon="thermometer-outline" color={colors.warning} label="Avg temp"     value={`${summary.avg_temperature}°C`} />
          <StatCard icon="water-outline"      color={colors.info}    label="Avg humidity" value={`${summary.avg_humidity}%`} />
        </View>
      )}

      {/* Weekly sleep bar chart */}
      {weekly && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Sleep this week (minutes)</Text>
          <BarChart
            data={{
              labels: weekly.labels,
              datasets: [{ data: weekly.sleep_minutes.map(v => v || 0) }],
            }}
            width={SW}
            height={180}
            chartConfig={chartConfig}
            style={styles.chart}
            showValuesOnTopOfBars
            fromZero
          />
        </View>
      )}

      {/* Weekly cry line chart */}
      {weekly && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Cry events this week</Text>
          <LineChart
            data={{
              labels: weekly.labels,
              datasets: [
                { data: weekly.cry_counts.map(v => v || 0), color: () => colors.accent, strokeWidth: 2 },
                { data: weekly.motion_counts.map(v => v || 0), color: () => colors.amber, strokeWidth: 2 },
              ],
              legend: ['Crying', 'Motion'],
            }}
            width={SW}
            height={180}
            chartConfig={{ ...chartConfig, color: (op) => `rgba(255,122,122,${op})` }}
            style={styles.chart}
            bezier
            fromZero
          />
        </View>
      )}

      {/* Recent activities */}
      {summary?.activities?.length > 0 && (
        <View style={styles.actSection}>
          <Text style={styles.sectionTitle}>Recent activity</Text>
          {summary.activities.slice(0, 8).map((a) => (
            <ActivityRow key={a.id} activity={a} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function StatCard({ icon, color, label, value }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActivityRow({ activity }) {
  const iconMap = {
    sleep: 'moon-outline', awake: 'sunny-outline', cry: 'volume-high-outline',
    motion: 'walk-outline', temperature_alert: 'thermometer-outline',
    feeding: 'restaurant-outline', diaper: 'water-outline',
  };
  const colorMap = {
    sleep: colors.primary, awake: colors.amber, cry: colors.accent,
    motion: colors.green, temperature_alert: colors.danger,
    feeding: colors.purple, diaper: colors.info,
  };
  const color = colorMap[activity.activity_type] || colors.textSecondary;
  const icon  = iconMap[activity.activity_type] || 'ellipse-outline';

  return (
    <View style={styles.actRow}>
      <View style={[styles.actIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.actType}>{activity.activity_type_display}</Text>
        {activity.description ? <Text style={styles.actDesc}>{activity.description}</Text> : null}
      </View>
      <Text style={styles.actTime}>
        {new Date(activity.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: colors.bg },
  loading:     { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  header:      {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 60, paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
  },
  title:       { ...typography.h3, color: colors.textPrimary },
  dateRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  dateArrow:   { padding: 8 },
  dateLabel:   { ...typography.body, color: colors.textPrimary, fontWeight: '600', flex: 1, textAlign: 'center' },
  statGrid:    { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.lg, gap: 12, marginBottom: spacing.lg },
  statCard:    {
    width: '30%', flexGrow: 1, backgroundColor: colors.bgCard,
    borderRadius: radius.md, padding: 12, alignItems: 'center', ...shadow.sm,
  },
  statIcon:    { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  statValue:   { ...typography.h3, color: colors.textPrimary },
  statLabel:   { ...typography.tiny, color: colors.textSecondary, textAlign: 'center', marginTop: 2 },
  chartCard:   {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    marginHorizontal: spacing.lg, marginBottom: spacing.md, padding: spacing.md, ...shadow.sm,
  },
  chartTitle:  { ...typography.h4, color: colors.textPrimary, marginBottom: spacing.md },
  chart:       { borderRadius: 12 },
  actSection:  { paddingHorizontal: spacing.lg, marginTop: spacing.sm },
  sectionTitle:{ ...typography.h4, color: colors.textPrimary, marginBottom: spacing.sm },
  actRow:      {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgCard, borderRadius: radius.md,
    padding: 12, marginBottom: 8, ...shadow.sm,
  },
  actIcon:     { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  actType:     { ...typography.small, color: colors.textPrimary, fontWeight: '600' },
  actDesc:     { ...typography.tiny, color: colors.textSecondary, marginTop: 2 },
  actTime:     { ...typography.tiny, color: colors.textMuted },
});