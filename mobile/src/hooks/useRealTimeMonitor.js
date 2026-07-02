import { useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { activityAPI, detectionAPI, notifAPI, WS_BASE } from '../services/api';
import { sendLocalNotification } from './usePushNotifications';

const SENSOR_INTERVAL = 2000;
const NOTIF_INTERVAL  = 5000;
const WS_RECONNECT_MS = 3000;

// Cooldown — don't spam notifications (30 seconds between same type)
const CRY_COOLDOWN    = 120000;  // 2 minutes between cry alerts
const MOTION_COOLDOWN = 60000;   // 1 minute between motion alerts

export default function useRealTimeMonitor(baby) {
  const [sensor, setSensor]       = useState(null);
  const [detection, setDetection] = useState(null);
  const [unread, setUnread]       = useState(0);
  const [wsStatus, setWsStatus]   = useState('disconnected');

  const wsRef          = useRef(null);
  const sensorRef      = useRef(null);
  const notifRef       = useRef(null);
  const reconnectRef   = useRef(null);
  const mountedRef     = useRef(true);
  const prevDetection  = useRef(null);
  const lastCryNotif   = useRef(0);
  const lastMotionNotif= useRef(0);

  const connectWS = useCallback(async () => {
    if (!baby) return;
    const token = await AsyncStorage.getItem('access_token');
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
    }
    const ws = new WebSocket(`${WS_BASE}/stream/${baby.id}/?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      setWsStatus('connected');
    };
    ws.onmessage = (e) => {
      if (!mountedRef.current) return;
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'detection_result') setDetection(msg.data);
      } catch {}
    };
    ws.onerror = () => {
      if (!mountedRef.current) return;
      setWsStatus('reconnecting');
    };
    ws.onclose = () => {
      if (!mountedRef.current) return;
      setWsStatus('reconnecting');
      reconnectRef.current = setTimeout(() => {
        if (mountedRef.current) connectWS();
      }, WS_RECONNECT_MS);
    };
  }, [baby]);

  const startSensorPoll = useCallback(() => {
    if (!baby) return;

    const poll = async () => {
      if (!mountedRef.current) return;
      try {
        const [s, d] = await Promise.all([
          activityAPI.simulateSensor(baby.id),
          detectionAPI.simulate(baby.id),
        ]);

        if (!mountedRef.current) return;

        setSensor(s);

        const prev = prevDetection.current;
        const now  = Date.now();

        // ── Cry notification ─────────────────────────────────
        if (d?.cry?.crying && !prev?.cry?.crying) {
          if (now - lastCryNotif.current > CRY_COOLDOWN) {
            lastCryNotif.current = now;
            sendLocalNotification(
              `🍼 ${baby.name} is crying!`,
              'Your baby needs attention. Tap to check the live feed.',
              { type: 'cry', baby_id: baby.id }
            );
          }
        }

        // ── Motion notification ───────────────────────────────
        if (d?.motion?.detected && !prev?.motion?.detected) {
          if (now - lastMotionNotif.current > MOTION_COOLDOWN) {
            lastMotionNotif.current = now;
            sendLocalNotification(
              `👁️ Motion detected — ${baby.name}`,
              `Movement detected (${Math.round(d.motion.motion_level || 0)}%). Check the live feed.`,
              { type: 'motion', baby_id: baby.id }
            );
          }
        }

        // ── Temperature alert notification ────────────────────
        if (s?.is_temperature_alert) {
          const status = s.temperature < 18 ? 'too cold' : 'too hot';
          sendLocalNotification(
            `🌡️ Temperature alert — ${baby.name}`,
            `Room is ${status} (${s.temperature}°C). Ideal is 18–24°C.`,
            { type: 'temperature', baby_id: baby.id }
          );
        }

        prevDetection.current = d;
        setDetection(d);

      } catch {}
    };

    poll();
    sensorRef.current = setInterval(poll, SENSOR_INTERVAL);
  }, [baby]);

  const startNotifPoll = useCallback(() => {
    const poll = async () => {
      if (!mountedRef.current) return;
      try {
        const u = await notifAPI.unreadCount();
        if (mountedRef.current) setUnread(u.unread || 0);
      } catch {}
    };
    poll();
    notifRef.current = setInterval(poll, NOTIF_INTERVAL);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (!baby) return;
    startSensorPoll();
    startNotifPoll();
    connectWS();
    return () => {
      mountedRef.current = false;
      clearInterval(sensorRef.current);
      clearInterval(notifRef.current);
      clearTimeout(reconnectRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [baby?.id]);

  const refresh = useCallback(async () => {
    if (!baby) return;
    try {
      const [s, d, u] = await Promise.all([
        activityAPI.simulateSensor(baby.id),
        detectionAPI.simulate(baby.id),
        notifAPI.unreadCount(),
      ]);
      setSensor(s);
      setDetection(d);
      setUnread(u.unread || 0);
    } catch {}
  }, [baby]);

  return { sensor, detection, unread, wsStatus, refresh };
}