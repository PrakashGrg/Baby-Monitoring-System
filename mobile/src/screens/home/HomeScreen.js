import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, Image, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { babyAPI, activityAPI, detectionAPI, notifAPI } from '../../services/api';
import { colors, spacing, radius, typography, shadow } from '../../theme';

const POLL_INTERVAL = 8000;

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [babies, setBabies] = useState([]);
  const [activeBaby, setActiveBaby] = useState(null);
  const [sensor, setSensor] = useState(null);
  const [detection, setDetection] = useState(null);
  const [unread, setUnread] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await babyAPI.list();
      const results = list.results || list;
      setBabies(results);
      if (results.length > 0 && !activeBaby) setActiveBaby(results[0]);
    } catch {}
  }, []);

  const pollSensors = useCallback(async () => {
    if (!activeBaby) return;
    try {
      const [s, d, u] = await Promise.all([
        activityAPI.simulateSensor(activeBaby.id),
        detectionAPI.simulate(activeBaby.id),
        notifAPI.unreadCount(),
      ]);
      setSensor(s);
      setDetection(d);
      setUnread(u.unread || 0);
    } catch {}
  }, [activeBaby]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    pollSensors();
    const interval = setInterval(pollSensors, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [pollSensors]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    await pollSensors();
    setRefreshing(false);
  };

  const tempStatus = sensor
    ? sensor.temperature < 16 || sensor.temperature > 26 ? 'danger'
    : sensor.temperature < 18 || sensor.temperature > 24 ? 'warning' : 'ok'
    : 'ok';

  const humStatus = sensor
    ? sensor.humidity < 40 || sensor.humidity > 60 ? 'danger'
    : sensor.humidity < 45 || sensor.humidity > 55 ? 'warning' : 'ok'
    : 'ok';

  const babyState = detection?.sleep_state?.state || 'sleep';
  const isCrying  = detection?.cry?.crying;
  const hasMotion = detection?.motion?.detected;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Header */}
      <LinearGradient colors={['#5B6EE8', '#9B6EE8']} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>{greeting()},</Text>
            <Text style={styles.userName}>{user?.first_name || user?.username} 👋</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn} onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={24} color="#fff" />
            {unread > 0 && (
              <View style={styles.badge}><Text style={styles.badgeText}>{unread}</Text></View>
            )}
          </TouchableOpacity>
        </View>

        {/* Baby Selector */}
        {babies.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.babyScroll}>
            {babies.map((b) => (
              <TouchableOpacity
                key={b.id}
                style={[styles.babyChip, activeBaby?.id === b.id && styles.babyChipActive]}
                onPress={() => setActiveBaby(b)}
              >
                <View style={styles.babyAvatar}>
                  <Text style={styles.babyAvatarText}>{b.name[0].toUpperCase()}</Text>
                </View>
                <Text style={[styles.babyChipText, activeBaby?.id === b.id && styles.babyChipTextActive]}>
                  {b.name}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.addBabyChip} onPress={() => navigation.navigate('AddBaby')}>
              <Ionicons name="add" size={20} color={colors.primary} />
            </TouchableOpacity>
          </ScrollView>
        )}
      </LinearGradient>

      <View style={styles.body}>
        {/* No babies */}
        {babies.length === 0 && (
          <TouchableOpacity style={styles.emptyCard} onPress={() => navigation.navigate('AddBaby')}>
            <Ionicons name="add-circle-outline" size={48} color={colors.primary} />
            <Text style={styles.emptyTitle}>Add your first baby</Text>
            <Text style={styles.emptyBody}>Tap here to create a baby profile and start monitoring</Text>
          </TouchableOpacity>
        )}

        {activeBaby && (
          <>
            {/* Status Hero Card */}
            <View style={[styles.statusCard, isCrying && styles.statusCardAlert]}>
              <View style={styles.statusLeft}>
                <View style={[styles.stateDot, { backgroundColor: babyState === 'awake' ? colors.amber : colors.primary }]} />
                <View>
                  <Text style={styles.statusLabel}>Current state</Text>
                  <Text style={styles.statusState}>
                    {isCrying ? '😢 Crying' : babyState === 'awake' ? '👀 Awake' : '😴 Sleeping'}
                  </Text>
                  {hasMotion && <Text style={styles.statusMotion}>• Motion detected</Text>}
                </View>
              </View>
              <TouchableOpacity
                style={styles.liveBtn}
                onPress={() => navigation.navigate('LiveStream', { baby: activeBaby })}
              >
                <Ionicons name="videocam" size={18} color="#fff" />
                <Text style={styles.liveBtnText}>Live</Text>
              </TouchableOpacity>
            </View>

            {/* Sensor Grid */}
            <Text style={styles.sectionTitle}>Environment</Text>
            <View style={styles.sensorGrid}>
              <SensorCard
                icon="thermometer-outline"
                label="Temperature"
                value={sensor ? `${sensor.temperature}°C` : '--'}
                status={tempStatus}
                ideal="18–24°C"
              />
              <SensorCard
                icon="water-outline"
                label="Humidity"
                value={sensor ? `${sensor.humidity}%` : '--'}
                status={humStatus}
                ideal="40–60%"
              />
            </View>

            {/* Detection Cards */}
            <Text style={styles.sectionTitle}>Detection</Text>
            <View style={styles.detectionGrid}>
              <DetectionCard
                icon="volume-high-outline"
                label="Audio"
                active={isCrying}
                activeLabel="Crying"
                inactiveLabel="Quiet"
                color={colors.accent}
                confidence={detection?.cry?.confidence}
              />
              <DetectionCard
                icon="walk-outline"
                label="Motion"
                active={hasMotion}
                activeLabel="Moving"
                inactiveLabel="Still"
                color={colors.amber}
                confidence={detection?.motion?.confidence}
              />
              <DetectionCard
                icon="moon-outline"
                label="Sleep"
                active={babyState === 'sleep'}
                activeLabel="Sleeping"
                inactiveLabel="Awake"
                color={colors.primary}
                confidence={detection?.sleep_state?.confidence}
              />
            </View>

            {/* Quick Actions */}
            <Text style={styles.sectionTitle}>Quick access</Text>
            <View style={styles.actionsGrid}>
              {[
                { icon: 'bar-chart-outline', label: 'Daily\nSummary', screen: 'Summary', params: { baby: activeBaby } },
                { icon: 'list-outline',     label: 'Activity\nHistory', screen: 'Activities', params: { baby: activeBaby } },
                { icon: 'person-outline',    label: 'Baby\nProfile', screen: 'BabyProfile', params: { baby: activeBaby } },
                { icon: 'settings-outline',  label: 'Settings', screen: 'Settings', params: {} },
              ].map(({ icon, label, screen, params }) => (
                <TouchableOpacity
                  key={screen}
                  style={styles.actionCard}
                  onPress={() => navigation.navigate(screen, params)}
                >
                  <View style={styles.actionIconWrap}>
                    <Ionicons name={icon} size={24} color={colors.primary} />
                  </View>
                  <Text style={styles.actionLabel}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

function SensorCard({ icon, label, value, status, ideal }) {
  const borderColor = status === 'danger' ? colors.danger : status === 'warning' ? colors.warning : colors.green;
  const bgColor     = status === 'danger' ? colors.dangerLight : status === 'warning' ? colors.warningLight : colors.greenLight;
  return (
    <View style={[styles.sensorCard, { borderLeftColor: borderColor, borderLeftWidth: 3, backgroundColor: bgColor }]}>
      <Ionicons name={icon} size={22} color={borderColor} />
      <Text style={styles.sensorValue}>{value}</Text>
      <Text style={styles.sensorLabel}>{label}</Text>
      <Text style={styles.sensorIdeal}>Ideal: {ideal}</Text>
    </View>
  );
}

function DetectionCard({ icon, label, active, activeLabel, inactiveLabel, color, confidence }) {
  return (
    <View style={[styles.detCard, active && { borderColor: color, borderWidth: 1.5 }]}>
      <View style={[styles.detIconWrap, { backgroundColor: active ? color + '20' : colors.borderLight }]}>
        <Ionicons name={icon} size={20} color={active ? color : colors.textMuted} />
      </View>
      <Text style={styles.detLabel}>{label}</Text>
      <Text style={[styles.detStatus, { color: active ? color : colors.textMuted }]}>
        {active ? activeLabel : inactiveLabel}
      </Text>
      {active && confidence != null && (
        <Text style={[styles.detConf, { color }]}>{Math.round(confidence * 100)}%</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: colors.bg },
  header:     { paddingTop: 60, paddingBottom: spacing.xl, paddingHorizontal: spacing.lg },
  headerTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  greeting:   { ...typography.body, color: 'rgba(255,255,255,0.8)' },
  userName:   { ...typography.h2, color: '#fff' },
  notifBtn:   { padding: 8, position: 'relative' },
  badge:      {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: colors.accent, borderRadius: 8,
    width: 16, height: 16, justifyContent: 'center', alignItems: 'center',
  },
  badgeText:  { ...typography.tiny, color: '#fff' },
  babyScroll: { marginTop: spacing.sm },
  babyChip:   {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: radius.full,
    paddingHorizontal: 12, paddingVertical: 8, marginRight: 8,
  },
  babyChipActive: { backgroundColor: '#fff' },
  babyAvatar: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 6,
  },
  babyAvatarText: { ...typography.tiny, color: colors.primary, fontWeight: '700' },
  babyChipText:   { ...typography.small, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  babyChipTextActive: { color: colors.primary },
  addBabyChip: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
  },
  body:        { padding: spacing.lg },
  emptyCard:   {
    alignItems: 'center', padding: spacing.xl * 2,
    backgroundColor: colors.bgCard, borderRadius: radius.xl,
    borderWidth: 2, borderColor: colors.primaryLight, borderStyle: 'dashed',
  },
  emptyTitle:  { ...typography.h3, color: colors.textPrimary, marginTop: spacing.md },
  emptyBody:   { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: 8 },
  statusCard:  {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg,
    marginBottom: spacing.lg, ...shadow.md,
  },
  statusCardAlert: { borderWidth: 2, borderColor: colors.accent },
  statusLeft:  { flexDirection: 'row', alignItems: 'center' },
  stateDot:    { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  statusLabel: { ...typography.tiny, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  statusState: { ...typography.h3, color: colors.textPrimary, marginTop: 2 },
  statusMotion:{ ...typography.small, color: colors.amber, marginTop: 2 },
  liveBtn:     {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.accent, borderRadius: radius.full,
    paddingHorizontal: 16, paddingVertical: 8, gap: 4,
  },
  liveBtnText: { ...typography.small, color: '#fff', fontWeight: '700' },
  sectionTitle:{ ...typography.h4, color: colors.textPrimary, marginBottom: spacing.sm, marginTop: 4 },
  sensorGrid:  { flexDirection: 'row', gap: 12, marginBottom: spacing.lg },
  sensorCard:  {
    flex: 1, backgroundColor: colors.bgCard, borderRadius: radius.md,
    padding: spacing.md, ...shadow.sm,
  },
  sensorValue: { ...typography.h2, color: colors.textPrimary, marginTop: 6 },
  sensorLabel: { ...typography.small, color: colors.textSecondary },
  sensorIdeal: { ...typography.tiny, color: colors.textMuted, marginTop: 4 },
  detectionGrid: { flexDirection: 'row', gap: 10, marginBottom: spacing.lg },
  detCard:     {
    flex: 1, backgroundColor: colors.bgCard, borderRadius: radius.md,
    padding: 12, alignItems: 'center', ...shadow.sm,
  },
  detIconWrap: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  detLabel:    { ...typography.tiny, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  detStatus:   { ...typography.small, fontWeight: '600', marginTop: 2 },
  detConf:     { ...typography.tiny, marginTop: 2 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: spacing.xl },
  actionCard:  {
    width: '47%', backgroundColor: colors.bgCard, borderRadius: radius.md,
    padding: spacing.md, alignItems: 'center', ...shadow.sm,
  },
  actionIconWrap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  actionLabel:  { ...typography.small, color: colors.textSecondary, textAlign: 'center', fontWeight: '600' },
});