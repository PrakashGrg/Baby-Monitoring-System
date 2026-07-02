import { useState, useEffect, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { sendLocalNotification } from './usePushNotifications';

// ── Thresholds ────────────────────────────────────────────────────────────────
const CRY_THRESHOLD      = -20;   // dBFS — above this = crying
const LOUD_THRESHOLD     = -10;   // dBFS — above this = very loud cry
const SAMPLE_INTERVAL_MS = 500;   // check every 500ms
const CRY_CONFIRM_COUNT  = 3;     // need 3 consecutive loud samples to confirm cry
const CRY_COOLDOWN_MS    = 60000; // 1 minute between notifications

export default function useCryDetection(baby, enabled = false) {
  const [isCrying, setIsCrying]       = useState(false);
  const [audioLevel, setAudioLevel]   = useState(-60);
  const [permission, setPermission]   = useState(null);
  const [isListening, setIsListening] = useState(false);

  const recordingRef    = useRef(null);
  const intervalRef     = useRef(null);
  const cryCountRef     = useRef(0);
  const lastNotifRef    = useRef(0);
  const mountedRef      = useRef(true);

  // ── Request microphone permission ─────────────────────────
  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      setPermission(status === 'granted');
      if (status !== 'granted') {
        console.log('[CRY] Microphone permission denied');
      }
    })();
    return () => { mountedRef.current = false; };
  }, []);

  // ── Start/stop based on enabled prop ─────────────────────
  useEffect(() => {
    if (enabled && permission) {
      startListening();
    } else {
      stopListening();
    }
    return () => stopListening();
  }, [enabled, permission]);

  const startListening = useCallback(async () => {
    if (isListening || !permission) return;
    try {
      // Set audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS:   true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status) => {
          if (!mountedRef.current) return;
          if (status.isRecording && status.metering !== undefined) {
            const db = status.metering; // dBFS value
            setAudioLevel(db);
            analyzeAudio(db);
          }
        },
        SAMPLE_INTERVAL_MS
      );

      recordingRef.current = recording;
      setIsListening(true);
      console.log('[CRY] Microphone listening started');
    } catch (e) {
      console.log('[CRY] Error starting microphone:', e.message);
    }
  }, [permission, isListening]);

  const stopListening = useCallback(async () => {
    if (!recordingRef.current) return;
    try {
      clearInterval(intervalRef.current);
      await recordingRef.current.stopAndUnloadAsync();
      recordingRef.current = null;
      setIsListening(false);
      setIsCrying(false);
      setAudioLevel(-60);
      cryCountRef.current = 0;
      console.log('[CRY] Microphone listening stopped');
    } catch (e) {
      console.log('[CRY] Error stopping microphone:', e.message);
    }
  }, []);

  const analyzeAudio = useCallback((db) => {
    if (!mountedRef.current) return;

    if (db > CRY_THRESHOLD) {
      cryCountRef.current += 1;
    } else {
      // Fade out — reduce count gradually
      cryCountRef.current = Math.max(0, cryCountRef.current - 1);
    }

    const crying = cryCountRef.current >= CRY_CONFIRM_COUNT;
    setIsCrying(crying);

    // Send notification with cooldown
    if (crying && baby) {
      const now = Date.now();
      if (now - lastNotifRef.current > CRY_COOLDOWN_MS) {
        lastNotifRef.current = now;
        const intensity = db > LOUD_THRESHOLD ? 'loudly' : 'softly';
        sendLocalNotification(
          `🍼 ${baby.name} is crying!`,
          `Your baby is crying ${intensity}. Tap to open the live feed.`,
          { type: 'cry', baby_id: baby?.id, db }
        );
        console.log(`[CRY] Cry detected! dBFS: ${db}`);
      }
    }
  }, [baby]);

  // ── dBFS to visual percentage ─────────────────────────────
  const audioPercent = Math.max(0, Math.min(100, ((audioLevel + 60) / 60) * 100));

  return {
    isCrying,
    audioLevel,
    audioPercent,
    isListening,
    permission,
    startListening,
    stopListening,
  };
}