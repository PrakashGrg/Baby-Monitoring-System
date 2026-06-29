import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { activityAPI } from '../../services/api';
import { colors, spacing, radius, typography, shadow } from '../../theme';

const TYPE_CONFIG = {
  sleep:             { icon: 'moon-outline',           color: colors.primary,  label: 'Sleep' },
  awake:             { icon: 'sunny-outline',           color: colors.amber,    label: 'Awake' },
  cry:               { icon: 'volume-high-outline',     color: colors.accent,   label: 'Crying' },
  motion:            { icon: 'walk-outline',            color: colors.green,    label: 'Motion' },
  temperature_alert: { icon: 'thermometer-outline',     color: colors.danger,   label: 'Temp Alert' },
  humidity_alert:    { icon: 'water-outline',           color: colors.info,     label: 'Humidity Alert' },
  feeding:           { icon: 'restaurant-outline',      color: colors.purple,   label: 'Feeding' },
  diaper:            { icon: 'color-fill-outline',      color: colors.amber,    label: 'Diaper' },
};

const FILTERS = ['All', 'sleep', 'cry', 'motion', 'feeding'];

export default function ActivitiesScreen({ route, navigation }) {
  const { baby } = route.params || {};
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All');

  const load = async () => {
    if (!baby) return;
    try {
      const params = filter !== 'All' ? { type: filter } : {};
      const data = await activityAPI.list(baby.id, params);
      const list = data.results || data;
      setActivities(Array.isArray(list) ? list : []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, [filter]);

  const renderItem = ({ item }) => {
    const cfg = TYPE_CONFIG[item.activity_type] || TYPE_CONFIG.sleep;
    return (
      <View style={styles.card}>
        <View style={[styles.icon, { backgroundColor: cfg.color + '20' }]}>
          <Ionicons name={cfg.icon} size={20} color={cfg.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.activity_type_display || cfg.label}</Text>
          {item.description ? <Text style={styles.cardDesc}>{item.description}</Text> : null}
          {item.duration_minutes ? (
            <Text style={styles.cardMeta}>Duration: {item.duration_minutes} min</Text>
          ) : null}
        </View>
        <View style={styles.timeCol}>
          <Text style={styles.time}>
            {new Date(item.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </Text>
          <Text style={styles.date}>
            {new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </Text>
          {item.severity && item.severity !== 'low' && (
            <View style={[styles.severityPill, {
              backgroundColor: item.severity === 'high' ? colors.dangerLight : colors.warningLight,
            }]}>
              <Text style={[styles.severityText, {
                color: item.severity === 'high' ? colors.danger : colors.warning,
              }]}>{item.severity}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{baby?.name}'s Activity</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={activities}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="list-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No activity found</Text>
              <Text style={styles.emptySubText}>Activities will appear here as they're detected.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 60, paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
    backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title:     { ...typography.h3, color: colors.textPrimary },
  filterRow: { flexDirection: 'row', padding: spacing.md, gap: 8 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.full,
    backgroundColor: colors.bgCard, borderWidth: 1.5, borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText:       { ...typography.small, color: colors.textSecondary, fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  list:      { padding: spacing.md },
  card: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: colors.bgCard, borderRadius: radius.md,
    padding: spacing.md, marginBottom: 8, ...shadow.sm,
  },
  icon:      { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardTitle: { ...typography.small, fontWeight: '700', color: colors.textPrimary },
  cardDesc:  { ...typography.tiny, color: colors.textSecondary, marginTop: 2 },
  cardMeta:  { ...typography.tiny, color: colors.textMuted, marginTop: 2 },
  timeCol:   { alignItems: 'flex-end', minWidth: 60 },
  time:      { ...typography.tiny, color: colors.textMuted, fontWeight: '600' },
  date:      { ...typography.tiny, color: colors.textMuted },
  severityPill: { borderRadius: radius.full, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4 },
  severityText: { ...typography.tiny, fontWeight: '700' },
  empty:     { alignItems: 'center', padding: spacing.xl * 2 },
  emptyText: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.md },
  emptySubText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: 8 },
});