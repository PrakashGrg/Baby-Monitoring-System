import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  StatusBar, Animated,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { detectionAPI } from '../../services/api';
import useCryDetection from '../../hooks/useCryDetection';
import { colors, spacing, radius, typography } from '../../theme';

export default function LiveStreamScreen({ route, navigation }) {
  const { baby } = route.params || {};
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing]               = useState('front');
  const [isStreaming, setIsStreaming]      = useState(false);
  const [detection, setDetection]         = useState(null);
  const cameraRef = useRef(null);
  const pollRef   = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ── Real microphone cry detection ─────────────────────────
  const {
    isCrying: micCrying,
    audioLevel,
    audioPercent,
    isListening,
    permission: micPermission,
  } = useCryDetection(baby, isStreaming);

  // ── Pulse animation when crying ───────────────────────────
  useEffect(() => {
    if (micCrying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 300, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,   duration: 300, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [micCrying]);

  const startDetection = useCallback(() => {
    if (!baby) return;
    setIsStreaming(true);
    // Poll for motion/sleep detection (camera-based simulation)
    pollRef.current = setInterval(async () => {
      try {
        const result = await detectionAPI.simulate(baby.id);
        setDetection(result);
      } catch {}
    }, 2000);
  }, [baby]);

  const stopDetection = () => {
    setIsStreaming(false);
    if (pollRef.current) clearInterval(pollRef.current);
    setDetection(null);
  };

  if (!permission) {
  return <View style={styles.container} />;
}

if (!permission.granted) {
  return (
    <View style={styles.permContainer}>
      <Ionicons
        name="videocam-off-outline"
        size={64}
        color={colors.textMuted}
      />

      <Text style={styles.permTitle}>Camera access needed</Text>

      <Text style={styles.permBody}>
        BabyMonitor needs camera access to stream live video.
      </Text>

      <TouchableOpacity
        style={styles.permBtn}
        onPress={requestPermission}
      >
        <Text style={styles.permBtnText}>Grant access</Text>
      </TouchableOpacity>
    </View>
  );
}

  // Combine real mic detection with simulated motion/sleep
  const isCrying  = micCrying || detection?.cry?.crying;
  const hasMotion = detection?.motion?.detected;
  const state     = detection?.sleep_state?.state;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing={facing}
      />

      <LinearGradient colors={['rgba(0,0,0,0.75)','rgba(0,0,0,0.3)','transparent']} style={styles.topOverlay} />
      <LinearGradient colors={['transparent','rgba(0,0,0,0.5)','rgba(0,0,0,0.85)']} style={styles.bottomOverlay} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <View style={[styles.statusPill, { backgroundColor: isStreaming ? colors.accent : 'rgba(0,0,0,0.5)' }]}>
          {isStreaming && <View style={styles.liveDot} />}
          <Text style={styles.statusPillText}>{isStreaming ? 'LIVE' : 'PAUSED'}</Text>
        </View>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => setFacing((f) => (f === 'front' ? 'back' : 'front'))}
        >
          <Ionicons name="camera-reverse-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Cry alert overlay */}
      {isCrying && (
        <Animated.View style={[styles.cryAlert, { transform: [{ scale: pulseAnim }] }]}>
          <Ionicons name="volume-high" size={18} color="#fff" />
          <Text style={styles.cryAlertText}>🍼 Baby is crying!</Text>
        </Animated.View>
      )}

      {/* Motion alert */}
      {hasMotion && !isCrying && (
        <View style={styles.motionAlert}>
          <Ionicons name="walk" size={14} color="#fff" />
          <Text style={styles.alertChipText}>Motion detected</Text>
        </View>
      )}

      {/* Bottom panel */}
      <View style={styles.bottomPanel}>

        {/* Audio meter */}
        {isStreaming && (
          <View style={styles.audioMeter}>
            <Ionicons
              name={isCrying ? 'volume-high' : isListening ? 'volume-medium' : 'volume-mute'}
              size={16}
              color={isCrying ? colors.accent : '#fff'}
            />
            <View style={styles.meterBar}>
              <Animated.View
                style={[
                  styles.meterFill,
                  {
                    width:           `${audioPercent}%`,
                    backgroundColor: isCrying ? colors.accent
                      : audioPercent > 50 ? colors.amber
                      : colors.green,
                  },
                ]}
              />
            </View>
            <Text style={styles.meterLabel}>
              {isCrying ? 'CRYING' : isListening ? `${Math.round(audioLevel)} dB` : 'MIC OFF'}
            </Text>
          </View>
        )}

        {/* Detection stats */}
        {isStreaming && detection && (
          <View style={styles.statsRow}>
            <StatPill
              icon="moon-outline"
              label={state === 'sleep' ? 'Sleeping' : 'Awake'}
              color={state === 'sleep' ? colors.primary : colors.amber}
            />
            <StatPill
              icon="volume-high-outline"
              label={isCrying ? 'Crying' : 'Quiet'}
              color={isCrying ? colors.accent : colors.green}
            />
            <StatPill
              icon="walk-outline"
              label={hasMotion ? 'Moving' : 'Still'}
              color={hasMotion ? colors.amber : colors.green}
            />
            <StatPill
              icon="mic-outline"
              label={isListening ? 'Mic ON' : 'Mic OFF'}
              color={isListening ? colors.green : colors.textMuted}
            />
          </View>
        )}

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => Alert.alert('Snapshot', 'Snapshot saved!')}
          >
            <Ionicons name="camera-outline" size={22} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mainBtn, isStreaming && styles.mainBtnStop]}
            onPress={isStreaming ? stopDetection : startDetection}
          >
            <Ionicons name={isStreaming ? 'stop' : 'play'} size={28} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.babyName}>
          {baby?.name || 'Baby'} · {baby?.age_in_months || '?'} months old
          {isListening ? ' · 🎤 Listening' : ''}
        </Text>
      </View>
    </View>
  );
}

function StatPill({ icon, label, color }) {
  return (
    <View style={[styles.pill, { borderColor: color, backgroundColor: 'rgba(0,0,0,0.4)' }]}>
      <Ionicons name={icon} size={12} color={color} />
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#000' },
  topOverlay:    { position: 'absolute', top: 0, left: 0, right: 0, height: 160, zIndex: 1 },
  bottomOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 300, zIndex: 1 },

  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 52, paddingHorizontal: spacing.lg, zIndex: 10,
  },
  iconBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.full,
  },
  liveDot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  statusPillText:{ ...typography.label, color: '#fff', letterSpacing: 2 },

  // Cry alert
  cryAlert: {
    position: 'absolute', top: 120, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.accent,
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: radius.full, zIndex: 10,
  },
  cryAlertText:  { ...typography.body, color: '#fff', fontWeight: '700' },

  motionAlert: {
    position: 'absolute', top: 120, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.amber,
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: radius.full, zIndex: 10,
  },
  alertChipText: { ...typography.small, color: '#fff', fontWeight: '700' },

  bottomPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingBottom: 52, paddingHorizontal: spacing.lg, zIndex: 10,
  },

  // Audio meter
  audioMeter: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: radius.md, padding: 10,
  },
  meterBar:  { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' },
  meterFill: { height: '100%', borderRadius: 3 },
  meterLabel:{ ...typography.tiny, color: '#fff', fontWeight: '700', minWidth: 55, textAlign: 'right' },

  statsRow:  { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: spacing.lg },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderRadius: radius.full,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  pillText:    { ...typography.tiny, fontWeight: '600' },
  controls:    { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.xl, marginBottom: spacing.md },
  mainBtn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)',
  },
  mainBtnStop: { backgroundColor: colors.accent },
  babyName:    { ...typography.small, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },

  permContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, backgroundColor: colors.bg },
  permTitle:     { ...typography.h2, color: colors.textPrimary, marginTop: spacing.lg },
  permBody:      { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: 8, marginBottom: spacing.xl },
  permBtn:       { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.xl, paddingVertical: 14 },
  permBtnText:   { ...typography.h4, color: '#fff' },
});