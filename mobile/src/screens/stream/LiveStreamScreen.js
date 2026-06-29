import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, Dimensions, Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { detectionAPI } from '../../services/api';
import { colors, spacing, radius, typography } from '../../theme';

const { width, height } = Dimensions.get('window');

export default function LiveStreamScreen({ route, navigation }) {
  const { baby } = route.params || {};
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState('front');
  const [isStreaming, setIsStreaming] = useState(false);
  const [detection, setDetection] = useState(null);
  const cameraRef = useRef(null);
  const pollRef   = useRef(null);
  const wsRef     = useRef(null);

  const stopPolling = () => { if (pollRef.current) clearInterval(pollRef.current); };

  const startDetection = useCallback(() => {
    if (!baby) return;
    setIsStreaming(true);
    pollRef.current = setInterval(async () => {
      try {
        const result = await detectionAPI.simulate(baby.id);
        setDetection(result);
      } catch {}
    }, 3000);
  }, [baby]);

  const stopDetection = () => {
    setIsStreaming(false);
    stopPolling();
    setDetection(null);
  };

  useEffect(() => {
    return () => { stopPolling(); wsRef.current?.close(); };
  }, []);

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.permContainer}>
        <Ionicons name="videocam-off-outline" size={64} color={colors.textMuted} />
        <Text style={styles.permTitle}>Camera access needed</Text>
        <Text style={styles.permBody}>BabyMonitor needs camera access to stream live video.</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isCrying  = detection?.cry?.crying;
  const hasMotion = detection?.motion?.detected;
  const state     = detection?.sleep_state?.state;

  return (
    <View style={styles.container}>
      {/* Camera */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing={facing}
      />

      {/* Dark gradient overlays */}
      <LinearGradient
        colors={['rgba(26,29,59,0.8)', 'transparent']}
        style={styles.topOverlay}
      />
      <LinearGradient
        colors={['transparent', 'rgba(26,29,59,0.9)']}
        style={styles.bottomOverlay}
      />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.liveIndicator}>
          {isStreaming && <View style={styles.liveDot} />}
          <Text style={styles.liveTxt}>{isStreaming ? 'LIVE' : 'PAUSED'}</Text>
        </View>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => setFacing((f) => (f === 'front' ? 'back' : 'front'))}
        >
          <Ionicons name="camera-reverse-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Detection overlays */}
      {isStreaming && detection && (
        <View style={styles.alertRow}>
          {isCrying && (
            <View style={[styles.alertChip, { backgroundColor: colors.accent }]}>
              <Ionicons name="volume-high" size={14} color="#fff" />
              <Text style={styles.alertChipText}>Crying detected</Text>
            </View>
          )}
          {hasMotion && (
            <View style={[styles.alertChip, { backgroundColor: colors.amber }]}>
              <Ionicons name="walk" size={14} color="#fff" />
              <Text style={styles.alertChipText}>Motion</Text>
            </View>
          )}
        </View>
      )}

      {/* Bottom panel */}
      <View style={styles.bottomPanel}>
        {isStreaming && detection && (
          <View style={styles.statsRow}>
            <StatPill
              icon="moon-outline"
              label={state === 'sleep' ? 'Sleeping' : 'Awake'}
              color={state === 'sleep' ? colors.primary : colors.amber}
            />
            <StatPill
              icon="volume-medium-outline"
              label={isCrying ? 'Crying' : 'Quiet'}
              color={isCrying ? colors.accent : colors.green}
            />
            <StatPill
              icon="walk-outline"
              label={hasMotion ? 'Moving' : 'Still'}
              color={hasMotion ? colors.amber : colors.green}
            />
            <StatPill
              icon="pulse-outline"
              label={`${Math.round((detection?.cry?.confidence || 0) * 100)}%`}
              color={colors.purple}
            />
          </View>
        )}

        <View style={styles.controls}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => Alert.alert('Snapshot', 'Snapshot saved!')}>
            <Ionicons name="camera-outline" size={22} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mainBtn, isStreaming && styles.mainBtnStop]}
            onPress={isStreaming ? stopDetection : startDetection}
          >
            <Ionicons name={isStreaming ? 'stop' : 'play'} size={28} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => notifAPI?.createTest?.(baby?.id)}
          >
            <Ionicons name="notifications-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.babyName}>
          {baby?.name || 'Baby'} · {baby?.age_in_months || '?'} months old
        </Text>
      </View>
    </View>
  );
}

const StatPill = ({ icon, label, color }) => (
  <View style={[styles.pill, { borderColor: color }]}>
    <Ionicons name={icon} size={12} color={color} />
    <Text style={[styles.pillText, { color }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#000' },
  topOverlay:   { position: 'absolute', top: 0, left: 0, right: 0, height: 140, zIndex: 1 },
  bottomOverlay:{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 220, zIndex: 1 },
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 56, paddingHorizontal: spacing.lg, zIndex: 10,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center',
  },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent,
  },
  liveTxt: { ...typography.label, color: '#fff', letterSpacing: 2 },
  alertRow: {
    position: 'absolute', top: 120, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 8, zIndex: 10,
  },
  alertChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full,
  },
  alertChipText: { ...typography.small, color: '#fff', fontWeight: '700' },
  bottomPanel:  {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingBottom: 48, paddingHorizontal: spacing.lg, zIndex: 10,
  },
  statsRow:  { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: spacing.lg },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderRadius: radius.full,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  pillText:  { ...typography.tiny, fontWeight: '600' },
  controls:  { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.xl },
  mainBtn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  mainBtnStop: { backgroundColor: colors.accent },
  babyName:  { ...typography.small, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: spacing.md },
  permContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, backgroundColor: colors.bg },
  permTitle: { ...typography.h2, color: colors.textPrimary, marginTop: spacing.lg },
  permBody:  { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: 8, marginBottom: spacing.xl },
  permBtn:   { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.xl, paddingVertical: 14 },
  permBtnText: { ...typography.h4, color: '#fff' },
});