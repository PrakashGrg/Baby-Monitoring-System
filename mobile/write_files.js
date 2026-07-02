const fs = require('fs');
const path = require('path');

const write = (filePath, content) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content.trimStart());
  console.log('✓ wrote', filePath);
};

// ============================================================
// theme
// ============================================================
write('src/theme/index.js', `
export const colors = {
  primary:        '#5B6EE8',
  primaryLight:   '#EEF0FD',
  primaryDark:    '#3A4FCC',
  accent:         '#FF7A7A',
  accentLight:    '#FFF0F0',
  green:          '#4CAF87',
  greenLight:     '#E8F7F1',
  amber:          '#F5A623',
  amberLight:     '#FEF5E7',
  purple:         '#9B6EE8',
  purpleLight:    '#F3EEFF',
  bg:             '#F5F6FF',
  bgCard:         '#FFFFFF',
  bgDark:         '#1A1D3B',
  textPrimary:    '#1A1D3B',
  textSecondary:  '#6B7280',
  textMuted:      '#9CA3AF',
  textWhite:      '#FFFFFF',
  border:         '#E5E7EB',
  borderLight:    '#F3F4F6',
  danger:         '#EF4444',
  dangerLight:    '#FEF2F2',
  warning:        '#F59E0B',
  warningLight:   '#FFFBEB',
  info:           '#3B82F6',
  infoLight:      '#EFF6FF',
};

export const spacing = { xs:4, sm:8, md:16, lg:24, xl:32, xxl:48 };
export const radius  = { sm:8, md:12, lg:16, xl:24, full:999 };

export const typography = {
  h1:    { fontSize:28, fontWeight:'700', letterSpacing:-0.5 },
  h2:    { fontSize:22, fontWeight:'700', letterSpacing:-0.3 },
  h3:    { fontSize:18, fontWeight:'600' },
  h4:    { fontSize:16, fontWeight:'600' },
  body:  { fontSize:15, fontWeight:'400' },
  small: { fontSize:13, fontWeight:'400' },
  tiny:  { fontSize:11, fontWeight:'500', letterSpacing:0.5 },
  label: { fontSize:12, fontWeight:'600', letterSpacing:0.8 },
};

export const shadow = {
  sm: { shadowColor:'#1A1D3B', shadowOffset:{width:0,height:1},  shadowOpacity:0.06, shadowRadius:4,  elevation:2  },
  md: { shadowColor:'#1A1D3B', shadowOffset:{width:0,height:4},  shadowOpacity:0.10, shadowRadius:12, elevation:5  },
  lg: { shadowColor:'#1A1D3B', shadowOffset:{width:0,height:8},  shadowOpacity:0.15, shadowRadius:24, elevation:10 },
};
`);

// ============================================================
// services/api.js
// ============================================================
write('src/services/api.js', `
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE = 'http://127.0.0.1:8000/api';
export const WS_BASE  = 'ws://127.0.0.1:8000/ws';

const getToken = async () => AsyncStorage.getItem('access_token');
const headers  = async (extra = {}) => ({
  'Content-Type': 'application/json',
  Authorization: \`Bearer \${await getToken()}\`,
  ...extra,
});
const handle = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
};

export const authAPI = {
  login: (username, password) =>
    fetch(\`\${API_BASE}/auth/login/\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }).then(handle),

  register: (data) =>
    fetch(\`\${API_BASE}/auth/register/\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handle),

  me: async () =>
    fetch(\`\${API_BASE}/auth/me/\`, { headers: await headers() }).then(handle),
};

export const babyAPI = {
  list:   async ()         => fetch(\`\${API_BASE}/babies/\`, { headers: await headers() }).then(handle),
  get:    async (id)       => fetch(\`\${API_BASE}/babies/\${id}/\`, { headers: await headers() }).then(handle),
  create: async (data)     => fetch(\`\${API_BASE}/babies/\`, { method:'POST', headers: await headers(), body: JSON.stringify(data) }).then(handle),
  update: async (id, data) => fetch(\`\${API_BASE}/babies/\${id}/\`, { method:'PATCH', headers: await headers(), body: JSON.stringify(data) }).then(handle),
  delete: async (id)       => fetch(\`\${API_BASE}/babies/\${id}/\`, { method:'DELETE', headers: await headers() }),
};

export const activityAPI = {
  list: async (babyId, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetch(\`\${API_BASE}/babies/\${babyId}/activities/?\${q}\`, { headers: await headers() }).then(handle);
  },
  summary:        async (babyId, date) => fetch(\`\${API_BASE}/babies/\${babyId}/summary/?date=\${date}\`, { headers: await headers() }).then(handle),
  weeklyChart:    async (babyId)       => fetch(\`\${API_BASE}/babies/\${babyId}/chart/weekly/\`, { headers: await headers() }).then(handle),
  simulateSensor: async (babyId)       => fetch(\`\${API_BASE}/babies/\${babyId}/sensor/simulate/\`, { headers: await headers() }).then(handle),
};

export const detectionAPI = {
  simulate:    async (babyId)           => fetch(\`\${API_BASE}/detection/\${babyId}/simulate/\`, { headers: await headers() }).then(handle),
  events:      async (babyId)           => fetch(\`\${API_BASE}/detection/\${babyId}/events/\`, { headers: await headers() }).then(handle),
  detectFrame: async (babyId, frameB64) => fetch(\`\${API_BASE}/detection/\${babyId}/frame/\`, { method:'POST', headers: await headers(), body: JSON.stringify({ frame: frameB64 }) }).then(handle),
};

export const notifAPI = {
  list:          async ()              => fetch(\`\${API_BASE}/notifications/\`, { headers: await headers() }).then(handle),
  unreadCount:   async ()              => fetch(\`\${API_BASE}/notifications/unread-count/\`, { headers: await headers() }).then(handle),
  markRead:      async (id)            => fetch(\`\${API_BASE}/notifications/\${id}/read/\`, { method:'POST', headers: await headers() }).then(handle),
  createTest:    async (babyId)        => fetch(\`\${API_BASE}/notifications/test/\`, { method:'POST', headers: await headers(), body: JSON.stringify({ baby_id: babyId }) }).then(handle),
  registerToken: async (token, platform='expo') => fetch(\`\${API_BASE}/notifications/register-token/\`, { method:'POST', headers: await headers(), body: JSON.stringify({ token, platform }) }).then(handle),
};
`);

// ============================================================
// context/AuthContext.js
// ============================================================
write('src/context/AuthContext.js', `
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { bootCheck(); }, []);

  const bootCheck = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        const me = await authAPI.me();
        setUser(me);
      }
    } catch {
      await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const data = await authAPI.login(username, password);
    await AsyncStorage.setItem('access_token', data.access);
    await AsyncStorage.setItem('refresh_token', data.refresh);
    const me = await authAPI.me();
    setUser(me);
    return me;
  };

  const register = async (formData) => {
    await authAPI.register(formData);
    return login(formData.username, formData.password);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
`);

// ============================================================
// screens/auth/LoginScreen.js
// ============================================================
write('src/screens/auth/LoginScreen.js', `
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius, typography, shadow } from '../../theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [form, setForm]       = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const handleLogin = async () => {
    if (!form.username || !form.password) {
      Alert.alert('Missing fields', 'Please enter your username and password.');
      return;
    }
    setLoading(true);
    try {
      await login(form.username, form.password);
    } catch (e) {
      Alert.alert('Login failed', e?.detail || 'Check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#5B6EE8', '#9B6EE8']} style={styles.gradient}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <View style={styles.hero}>
            <View style={styles.iconWrap}>
              <Ionicons name="moon" size={44} color={colors.primary} />
            </View>
            <Text style={styles.heroTitle}>BabyMonitor</Text>
            <Text style={styles.heroSub}>Keeping watch, so you can rest</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome back</Text>
            <Text style={styles.cardSub}>Sign in to your account</Text>

            <View style={styles.field}>
              <Text style={styles.label}>USERNAME</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="person-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="your_username"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  value={form.username}
                  onChangeText={set('username')}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>PASSWORD</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPass}
                  value={form.password}
                  onChangeText={set('password')}
                />
                <TouchableOpacity onPress={() => setShowPass((v) => !v)} style={styles.eyeBtn}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Sign in</Text>
              }
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.divLine} />
              <Text style={styles.divText}>or</Text>
              <View style={styles.divLine} />
            </View>

            <TouchableOpacity style={styles.outlineBtn} onPress={() => navigation.navigate('Register')}>
              <Text style={styles.outlineBtnText}>Create an account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient:       { flex: 1 },
  scroll:         { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  hero:           { alignItems: 'center', marginBottom: spacing.xl },
  iconWrap:       { width:84, height:84, borderRadius:42, backgroundColor:'#fff', justifyContent:'center', alignItems:'center', marginBottom:spacing.md, ...shadow.lg },
  heroTitle:      { ...typography.h1, color: '#fff', marginBottom: 6 },
  heroSub:        { ...typography.body, color: 'rgba(255,255,255,0.8)' },
  card:           { backgroundColor: colors.bgCard, borderRadius: radius.xl, padding: spacing.xl, ...shadow.lg },
  cardTitle:      { ...typography.h2, color: colors.textPrimary, marginBottom: 4 },
  cardSub:        { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg },
  field:          { marginBottom: spacing.md },
  label:          { ...typography.label, color: colors.textSecondary, marginBottom: 6 },
  inputWrap:      { flexDirection:'row', alignItems:'center', borderWidth:1.5, borderColor:colors.border, borderRadius:radius.md, backgroundColor:colors.bg, paddingHorizontal:12 },
  inputIcon:      { marginRight: 8 },
  input:          { flex:1, height:48, ...typography.body, color:colors.textPrimary },
  eyeBtn:         { padding: 4 },
  btn:            { backgroundColor:colors.primary, borderRadius:radius.md, height:52, justifyContent:'center', alignItems:'center', marginTop:spacing.sm, ...shadow.md },
  btnText:        { ...typography.h4, color: '#fff' },
  divider:        { flexDirection:'row', alignItems:'center', marginVertical:spacing.md },
  divLine:        { flex:1, height:1, backgroundColor:colors.border },
  divText:        { ...typography.small, color:colors.textMuted, marginHorizontal:spacing.sm },
  outlineBtn:     { borderWidth:1.5, borderColor:colors.primary, borderRadius:radius.md, height:52, justifyContent:'center', alignItems:'center' },
  outlineBtnText: { ...typography.h4, color: colors.primary },
});
`);

// ============================================================
// screens/auth/RegisterScreen.js
// ============================================================
write('src/screens/auth/RegisterScreen.js', `
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius, typography, shadow } from '../../theme';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    first_name:'', last_name:'', username:'', email:'', password:'', password2:'',
  });
  const [loading, setLoading] = useState(false);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const handleRegister = async () => {
    if (!form.username || !form.password) {
      Alert.alert('Error', 'Username and password are required.'); return;
    }
    if (form.password !== form.password2) {
      Alert.alert('Error', 'Passwords do not match.'); return;
    }
    setLoading(true);
    try {
      await register(form);
    } catch (e) {
      const msg = Object.values(e || {}).flat().join('\\n') || 'Registration failed.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, icon, fieldKey, ...props }) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <Ionicons name={icon} size={18} color={colors.textMuted} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.textMuted}
          value={form[fieldKey]}
          onChangeText={set(fieldKey)}
          {...props}
        />
      </View>
    </View>
  );

  return (
    <LinearGradient colors={['#5B6EE8', '#9B6EE8']} style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.sub}>Join BabyMonitor today</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.row}>
              <View style={{ flex:1, marginRight:8 }}>
                <Field label="FIRST NAME" icon="person-outline" fieldKey="first_name" placeholder="Jane" />
              </View>
              <View style={{ flex:1 }}>
                <Field label="LAST NAME" icon="person-outline" fieldKey="last_name" placeholder="Doe" />
              </View>
            </View>
            <Field label="USERNAME"        icon="at-outline"           fieldKey="username"  placeholder="jane_doe"           autoCapitalize="none" />
            <Field label="EMAIL"           icon="mail-outline"         fieldKey="email"     placeholder="jane@example.com"   keyboardType="email-address" autoCapitalize="none" />
            <Field label="PASSWORD"        icon="lock-closed-outline"  fieldKey="password"  placeholder="At least 6 chars"  secureTextEntry />
            <Field label="CONFIRM PASSWORD" icon="lock-closed-outline" fieldKey="password2" placeholder="Repeat password"   secureTextEntry />

            <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Create account</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
              <Text style={styles.loginLinkText}>
                Already have an account?{' '}
                <Text style={{ color: colors.primary, fontWeight:'600' }}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll:        { flexGrow:1, padding:spacing.lg, paddingTop:60 },
  back:          { position:'absolute', top:16, left:16, padding:8, zIndex:10 },
  header:        { alignItems:'center', marginBottom:spacing.xl, marginTop:spacing.xl },
  title:         { ...typography.h1, color:'#fff', marginBottom:6 },
  sub:           { ...typography.body, color:'rgba(255,255,255,0.8)' },
  card:          { backgroundColor:'#fff', borderRadius:radius.xl, padding:spacing.xl, ...shadow.lg },
  row:           { flexDirection:'row' },
  field:         { marginBottom:spacing.md },
  label:         { ...typography.label, color:colors.textSecondary, marginBottom:6 },
  inputWrap:     { flexDirection:'row', alignItems:'center', borderWidth:1.5, borderColor:colors.border, borderRadius:radius.md, backgroundColor:colors.bg, paddingHorizontal:12 },
  inputIcon:     { marginRight:8 },
  input:         { flex:1, height:46, ...typography.body, color:colors.textPrimary },
  btn:           { backgroundColor:colors.primary, borderRadius:radius.md, height:52, justifyContent:'center', alignItems:'center', marginTop:spacing.sm, ...shadow.md },
  btnText:       { ...typography.h4, color:'#fff' },
  loginLink:     { alignItems:'center', marginTop:spacing.md },
  loginLinkText: { ...typography.body, color:colors.textSecondary },
});
`);

// ============================================================
// screens/home/HomeScreen.js
// ============================================================
write('src/screens/home/HomeScreen.js', `
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { babyAPI, activityAPI, detectionAPI, notifAPI } from '../../services/api';
import { colors, spacing, radius, typography, shadow } from '../../theme';

const POLL_INTERVAL = 8000;

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [babies, setBabies]         = useState([]);
  const [activeBaby, setActiveBaby] = useState(null);
  const [sensor, setSensor]         = useState(null);
  const [detection, setDetection]   = useState(null);
  const [unread, setUnread]         = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const list    = await babyAPI.list();
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
      </LinearGradient>

      <View style={styles.body}>
        {babies.length === 0 && (
          <TouchableOpacity style={styles.emptyCard} onPress={() => navigation.navigate('AddBaby')}>
            <Ionicons name="add-circle-outline" size={48} color={colors.primary} />
            <Text style={styles.emptyTitle}>Add your first baby</Text>
            <Text style={styles.emptyBody}>Tap here to create a baby profile and start monitoring</Text>
          </TouchableOpacity>
        )}

        {activeBaby && (
          <>
            <View style={[styles.statusCard, isCrying && styles.statusCardAlert]}>
              <View style={styles.statusLeft}>
                <View style={[styles.stateDot, { backgroundColor: babyState === 'awake' ? colors.amber : colors.primary }]} />
                <View>
                  <Text style={styles.statusLabel}>CURRENT STATE</Text>
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

            <Text style={styles.sectionTitle}>Environment</Text>
            <View style={styles.sensorGrid}>
              <SensorCard icon="thermometer-outline" label="Temperature" value={sensor ? \`\${sensor.temperature}°C\` : '--'} status={tempStatus} ideal="18–24°C" />
              <SensorCard icon="water-outline"       label="Humidity"    value={sensor ? \`\${sensor.humidity}%\`    : '--'} status={humStatus}  ideal="40–60%"  />
            </View>

            <Text style={styles.sectionTitle}>Detection</Text>
            <View style={styles.detectionGrid}>
              <DetectionCard icon="volume-high-outline" label="Audio"  active={isCrying}            activeLabel="Crying"   inactiveLabel="Quiet"    color={colors.accent}  confidence={detection?.cry?.confidence} />
              <DetectionCard icon="walk-outline"        label="Motion" active={hasMotion}            activeLabel="Moving"   inactiveLabel="Still"    color={colors.amber}   confidence={detection?.motion?.confidence} />
              <DetectionCard icon="moon-outline"        label="Sleep"  active={babyState === 'sleep'} activeLabel="Sleeping" inactiveLabel="Awake"   color={colors.primary} confidence={detection?.sleep_state?.confidence} />
            </View>

            <Text style={styles.sectionTitle}>Quick access</Text>
            <View style={styles.actionsGrid}>
              {[
                { icon:'bar-chart-outline', label:'Daily\\nSummary',   screen:'Summary',    params:{ baby: activeBaby } },
                { icon:'list-outline',      label:'Activity\\nHistory', screen:'Activities', params:{ baby: activeBaby } },
                { icon:'person-outline',    label:'Baby\\nProfile',    screen:'BabyProfile',params:{ baby: activeBaby } },
                { icon:'settings-outline',  label:'Settings',          screen:'Settings',   params:{} },
              ].map(({ icon, label, screen, params }) => (
                <TouchableOpacity key={screen} style={styles.actionCard} onPress={() => navigation.navigate(screen, params)}>
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
    <View style={[styles.sensorCard, { borderLeftColor:borderColor, borderLeftWidth:3, backgroundColor:bgColor }]}>
      <Ionicons name={icon} size={22} color={borderColor} />
      <Text style={styles.sensorValue}>{value}</Text>
      <Text style={styles.sensorLabel}>{label}</Text>
      <Text style={styles.sensorIdeal}>Ideal: {ideal}</Text>
    </View>
  );
}

function DetectionCard({ icon, label, active, activeLabel, inactiveLabel, color, confidence }) {
  return (
    <View style={[styles.detCard, active && { borderColor:color, borderWidth:1.5 }]}>
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
  container:       { flex:1, backgroundColor:colors.bg },
  header:          { paddingTop:60, paddingBottom:spacing.xl, paddingHorizontal:spacing.lg },
  headerTop:       { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:spacing.md },
  greeting:        { ...typography.body, color:'rgba(255,255,255,0.8)' },
  userName:        { ...typography.h2, color:'#fff' },
  notifBtn:        { padding:8, position:'relative' },
  badge:           { position:'absolute', top:4, right:4, backgroundColor:colors.accent, borderRadius:8, width:16, height:16, justifyContent:'center', alignItems:'center' },
  badgeText:       { ...typography.tiny, color:'#fff' },
  babyScroll:      { marginTop:spacing.sm },
  babyChip:        { flexDirection:'row', alignItems:'center', backgroundColor:'rgba(255,255,255,0.2)', borderRadius:radius.full, paddingHorizontal:12, paddingVertical:8, marginRight:8 },
  babyChipActive:  { backgroundColor:'#fff' },
  babyAvatar:      { width:24, height:24, borderRadius:12, backgroundColor:colors.primaryLight, justifyContent:'center', alignItems:'center', marginRight:6 },
  babyAvatarText:  { ...typography.tiny, color:colors.primary, fontWeight:'700' },
  babyChipText:    { ...typography.small, color:'rgba(255,255,255,0.9)', fontWeight:'600' },
  babyChipTextActive: { color:colors.primary },
  addBabyChip:     { width:40, height:40, borderRadius:20, backgroundColor:'#fff', justifyContent:'center', alignItems:'center' },
  body:            { padding:spacing.lg },
  emptyCard:       { alignItems:'center', padding:spacing.xl*2, backgroundColor:colors.bgCard, borderRadius:radius.xl, borderWidth:2, borderColor:colors.primaryLight, borderStyle:'dashed' },
  emptyTitle:      { ...typography.h3, color:colors.textPrimary, marginTop:spacing.md },
  emptyBody:       { ...typography.body, color:colors.textSecondary, textAlign:'center', marginTop:8 },
  statusCard:      { flexDirection:'row', justifyContent:'space-between', alignItems:'center', backgroundColor:colors.bgCard, borderRadius:radius.lg, padding:spacing.lg, marginBottom:spacing.lg, ...shadow.md },
  statusCardAlert: { borderWidth:2, borderColor:colors.accent },
  statusLeft:      { flexDirection:'row', alignItems:'center' },
  stateDot:        { width:12, height:12, borderRadius:6, marginRight:12 },
  statusLabel:     { ...typography.tiny, color:colors.textMuted, letterSpacing:1 },
  statusState:     { ...typography.h3, color:colors.textPrimary, marginTop:2 },
  statusMotion:    { ...typography.small, color:colors.amber, marginTop:2 },
  liveBtn:         { flexDirection:'row', alignItems:'center', backgroundColor:colors.accent, borderRadius:radius.full, paddingHorizontal:16, paddingVertical:8, gap:4 },
  liveBtnText:     { ...typography.small, color:'#fff', fontWeight:'700' },
  sectionTitle:    { ...typography.h4, color:colors.textPrimary, marginBottom:spacing.sm, marginTop:4 },
  sensorGrid:      { flexDirection:'row', gap:12, marginBottom:spacing.lg },
  sensorCard:      { flex:1, backgroundColor:colors.bgCard, borderRadius:radius.md, padding:spacing.md, ...shadow.sm },
  sensorValue:     { ...typography.h2, color:colors.textPrimary, marginTop:6 },
  sensorLabel:     { ...typography.small, color:colors.textSecondary },
  sensorIdeal:     { ...typography.tiny, color:colors.textMuted, marginTop:4 },
  detectionGrid:   { flexDirection:'row', gap:10, marginBottom:spacing.lg },
  detCard:         { flex:1, backgroundColor:colors.bgCard, borderRadius:radius.md, padding:12, alignItems:'center', ...shadow.sm },
  detIconWrap:     { width:40, height:40, borderRadius:20, justifyContent:'center', alignItems:'center', marginBottom:6 },
  detLabel:        { ...typography.tiny, color:colors.textSecondary, textTransform:'uppercase', letterSpacing:0.5 },
  detStatus:       { ...typography.small, fontWeight:'600', marginTop:2 },
  detConf:         { ...typography.tiny, marginTop:2 },
  actionsGrid:     { flexDirection:'row', flexWrap:'wrap', gap:12, marginBottom:spacing.xl },
  actionCard:      { width:'47%', backgroundColor:colors.bgCard, borderRadius:radius.md, padding:spacing.md, alignItems:'center', ...shadow.sm },
  actionIconWrap:  { width:48, height:48, borderRadius:24, backgroundColor:colors.primaryLight, justifyContent:'center', alignItems:'center', marginBottom:8 },
  actionLabel:     { ...typography.small, color:colors.textSecondary, textAlign:'center', fontWeight:'600' },
});
`);

// ============================================================
// screens/stream/LiveStreamScreen.js
// ============================================================
write('src/screens/stream/LiveStreamScreen.js', `
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { detectionAPI } from '../../services/api';
import { colors, spacing, radius, typography } from '../../theme';

export default function LiveStreamScreen({ route, navigation }) {
  const { baby } = route.params || {};
  const [hasPermission, setHasPermission] = useState(null);
  const [facing, setFacing]               = useState('front');
  const [isStreaming, setIsStreaming]      = useState(false);
  const [detection, setDetection]         = useState(null);
  const cameraRef = useRef(null);
  const pollRef   = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

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
    if (pollRef.current) clearInterval(pollRef.current);
    setDetection(null);
  };

  if (hasPermission === null) return <View style={styles.container} />;

  if (hasPermission === false) {
    return (
      <View style={styles.permContainer}>
        <Ionicons name="videocam-off-outline" size={64} color={colors.textMuted} />
        <Text style={styles.permTitle}>Camera access needed</Text>
        <Text style={styles.permBody}>BabyMonitor needs camera access to stream live video.</Text>
        <TouchableOpacity
          style={styles.permBtn}
          onPress={async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
          }}
        >
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
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        type={facing === 'front' ? CameraType.front : CameraType.back}
      />

      <LinearGradient colors={['rgba(26,29,59,0.8)','transparent']} style={styles.topOverlay} />
      <LinearGradient colors={['transparent','rgba(26,29,59,0.9)']} style={styles.bottomOverlay} />

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

      {isStreaming && detection && (
        <View style={styles.alertRow}>
          {isCrying  && <View style={[styles.alertChip,{backgroundColor:colors.accent}]}><Ionicons name="volume-high" size={14} color="#fff" /><Text style={styles.alertChipText}>Crying detected</Text></View>}
          {hasMotion && <View style={[styles.alertChip,{backgroundColor:colors.amber}]}><Ionicons name="walk" size={14} color="#fff" /><Text style={styles.alertChipText}>Motion</Text></View>}
        </View>
      )}

      <View style={styles.bottomPanel}>
        {isStreaming && detection && (
          <View style={styles.statsRow}>
            <StatPill icon="moon-outline"          label={state === 'sleep' ? 'Sleeping' : 'Awake'} color={state === 'sleep' ? colors.primary : colors.amber} />
            <StatPill icon="volume-medium-outline" label={isCrying ? 'Crying' : 'Quiet'}            color={isCrying ? colors.accent : colors.green} />
            <StatPill icon="walk-outline"          label={hasMotion ? 'Moving' : 'Still'}           color={hasMotion ? colors.amber : colors.green} />
            <StatPill icon="pulse-outline"         label={\`\${Math.round((detection?.cry?.confidence||0)*100)}%\`} color={colors.purple} />
          </View>
        )}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => Alert.alert('Snapshot','Snapshot saved!')}>
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
        <Text style={styles.babyName}>{baby?.name || 'Baby'} · {baby?.age_in_months || '?'} months old</Text>
      </View>
    </View>
  );
}

function StatPill({ icon, label, color }) {
  return (
    <View style={[styles.pill,{borderColor:color}]}>
      <Ionicons name={icon} size={12} color={color} />
      <Text style={[styles.pillText,{color}]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex:1, backgroundColor:'#000' },
  topOverlay:    { position:'absolute', top:0, left:0, right:0, height:140, zIndex:1 },
  bottomOverlay: { position:'absolute', bottom:0, left:0, right:0, height:220, zIndex:1 },
  topBar:        { position:'absolute', top:0, left:0, right:0, flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingTop:56, paddingHorizontal:spacing.lg, zIndex:10 },
  iconBtn:       { width:40, height:40, borderRadius:20, backgroundColor:'rgba(255,255,255,0.15)', justifyContent:'center', alignItems:'center' },
  liveIndicator: { flexDirection:'row', alignItems:'center', gap:6 },
  liveDot:       { width:8, height:8, borderRadius:4, backgroundColor:colors.accent },
  liveTxt:       { ...typography.label, color:'#fff', letterSpacing:2 },
  alertRow:      { position:'absolute', top:120, left:0, right:0, flexDirection:'row', justifyContent:'center', gap:8, zIndex:10 },
  alertChip:     { flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:12, paddingVertical:6, borderRadius:radius.full },
  alertChipText: { ...typography.small, color:'#fff', fontWeight:'700' },
  bottomPanel:   { position:'absolute', bottom:0, left:0, right:0, paddingBottom:48, paddingHorizontal:spacing.lg, zIndex:10 },
  statsRow:      { flexDirection:'row', justifyContent:'center', gap:8, marginBottom:spacing.lg },
  pill:          { flexDirection:'row', alignItems:'center', gap:4, borderWidth:1, borderRadius:radius.full, paddingHorizontal:10, paddingVertical:4 },
  pillText:      { ...typography.tiny, fontWeight:'600' },
  controls:      { flexDirection:'row', justifyContent:'center', alignItems:'center', gap:spacing.xl },
  mainBtn:       { width:72, height:72, borderRadius:36, backgroundColor:colors.primary, justifyContent:'center', alignItems:'center' },
  mainBtnStop:   { backgroundColor:colors.accent },
  babyName:      { ...typography.small, color:'rgba(255,255,255,0.6)', textAlign:'center', marginTop:spacing.md },
  permContainer: { flex:1, justifyContent:'center', alignItems:'center', padding:spacing.xl, backgroundColor:colors.bg },
  permTitle:     { ...typography.h2, color:colors.textPrimary, marginTop:spacing.lg },
  permBody:      { ...typography.body, color:colors.textSecondary, textAlign:'center', marginTop:8, marginBottom:spacing.xl },
  permBtn:       { backgroundColor:colors.primary, borderRadius:radius.md, paddingHorizontal:spacing.xl, paddingVertical:14 },
  permBtnText:   { ...typography.h4, color:'#fff' },
});
`);

// ============================================================
// screens/summary/SummaryScreen.js
// ============================================================
write('src/screens/summary/SummaryScreen.js', `
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions,
} from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { activityAPI } from '../../services/api';
import { colors, spacing, radius, typography, shadow } from '../../theme';

const SW = Dimensions.get('window').width - spacing.lg * 2;

const chartConfig = {
  backgroundColor: colors.bgCard,
  backgroundGradientFrom: colors.bgCard,
  backgroundGradientTo: colors.bgCard,
  decimalPlaces: 0,
  color: (opacity = 1) => \`rgba(91,110,232,\${opacity})\`,
  labelColor: () => colors.textSecondary,
  style: { borderRadius: 16 },
};

export default function SummaryScreen({ route, navigation }) {
  const { baby } = route.params || {};
  const [summary, setSummary]   = useState(null);
  const [weekly, setWeekly]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [date, setDate]         = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (!baby) { setLoading(false); return; }
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
    const h = Math.floor(m / 60), min = m % 60;
    return h > 0 ? \`\${h}h \${min}m\` : \`\${min}m\`;
  };

  const shiftDate = (n) => {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    if (d <= new Date()) setDate(d.toISOString().slice(0, 10));
  };

  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color={colors.primary} /></View>;

  if (!baby) {
    return (
      <View style={styles.loading}>
        <Ionicons name="moon-outline" size={64} color={colors.textMuted} />
        <Text style={{ ...typography.h3, color:colors.textSecondary, marginTop:16 }}>Select a baby first</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom:40 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Daily Summary</Text>
        <View style={{ width:24 }} />
      </View>

      <View style={styles.dateRow}>
        <TouchableOpacity onPress={() => shiftDate(-1)} style={styles.dateArrow}>
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.dateLabel}>
          {new Date(date).toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}
        </Text>
        <TouchableOpacity onPress={() => shiftDate(1)} style={styles.dateArrow}>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {summary && (
        <View style={styles.statGrid}>
          <StatCard icon="moon-outline"        color={colors.primary} label="Total sleep"   value={fmtMins(summary.total_sleep_minutes)} />
          <StatCard icon="sunny-outline"       color={colors.amber}   label="Awake time"    value={fmtMins(summary.total_awake_minutes)} />
          <StatCard icon="volume-high-outline" color={colors.accent}  label="Cry events"    value={\`\${summary.cry_count}×\`} />
          <StatCard icon="walk-outline"        color={colors.green}   label="Motion events" value={\`\${summary.motion_count}×\`} />
          <StatCard icon="thermometer-outline" color={colors.warning} label="Avg temp"      value={\`\${summary.avg_temperature}°C\`} />
          <StatCard icon="water-outline"       color={colors.info}    label="Avg humidity"  value={\`\${summary.avg_humidity}%\`} />
        </View>
      )}

      {weekly && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Sleep this week (minutes)</Text>
          <BarChart
            data={{ labels: weekly.labels, datasets:[{ data: weekly.sleep_minutes.map(v => v||0) }] }}
            width={SW} height={180} chartConfig={chartConfig} style={styles.chart} showValuesOnTopOfBars fromZero
          />
        </View>
      )}

      {weekly && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Cry & Motion this week</Text>
          <LineChart
            data={{
              labels: weekly.labels,
              datasets: [
                { data: weekly.cry_counts.map(v=>v||0),    color:()=>colors.accent, strokeWidth:2 },
                { data: weekly.motion_counts.map(v=>v||0), color:()=>colors.amber,  strokeWidth:2 },
              ],
              legend: ['Crying','Motion'],
            }}
            width={SW} height={180}
            chartConfig={{ ...chartConfig, color:(op)=>\`rgba(255,122,122,\${op})\` }}
            style={styles.chart} bezier fromZero
          />
        </View>
      )}

      {summary?.activities?.length > 0 && (
        <View style={styles.actSection}>
          <Text style={styles.sectionTitle}>Recent activity</Text>
          {summary.activities.slice(0,8).map((a) => <ActivityRow key={a.id} activity={a} />)}
        </View>
      )}
    </ScrollView>
  );
}

function StatCard({ icon, color, label, value }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon,{backgroundColor:color+'20'}]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActivityRow({ activity }) {
  const iconMap  = { sleep:'moon-outline', awake:'sunny-outline', cry:'volume-high-outline', motion:'walk-outline', temperature_alert:'thermometer-outline', feeding:'restaurant-outline', diaper:'water-outline' };
  const colorMap = { sleep:colors.primary, awake:colors.amber, cry:colors.accent, motion:colors.green, temperature_alert:colors.danger, feeding:colors.purple, diaper:colors.info };
  const color = colorMap[activity.activity_type] || colors.textSecondary;
  const icon  = iconMap[activity.activity_type]  || 'ellipse-outline';
  return (
    <View style={styles.actRow}>
      <View style={[styles.actIcon,{backgroundColor:color+'20'}]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <View style={{ flex:1 }}>
        <Text style={styles.actType}>{activity.activity_type_display}</Text>
        {activity.description ? <Text style={styles.actDesc}>{activity.description}</Text> : null}
      </View>
      <Text style={styles.actTime}>
        {new Date(activity.timestamp).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex:1, backgroundColor:colors.bg },
  loading:      { flex:1, justifyContent:'center', alignItems:'center', backgroundColor:colors.bg },
  header:       { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingTop:60, paddingHorizontal:spacing.lg, paddingBottom:spacing.md },
  title:        { ...typography.h3, color:colors.textPrimary },
  dateRow:      { flexDirection:'row', alignItems:'center', justifyContent:'center', marginBottom:spacing.lg },
  dateArrow:    { padding:8 },
  dateLabel:    { ...typography.body, color:colors.textPrimary, fontWeight:'600', flex:1, textAlign:'center' },
  statGrid:     { flexDirection:'row', flexWrap:'wrap', paddingHorizontal:spacing.lg, gap:12, marginBottom:spacing.lg },
  statCard:     { width:'30%', flexGrow:1, backgroundColor:colors.bgCard, borderRadius:radius.md, padding:12, alignItems:'center', ...shadow.sm },
  statIcon:     { width:36, height:36, borderRadius:18, justifyContent:'center', alignItems:'center', marginBottom:6 },
  statValue:    { ...typography.h3, color:colors.textPrimary },
  statLabel:    { ...typography.tiny, color:colors.textSecondary, textAlign:'center', marginTop:2 },
  chartCard:    { backgroundColor:colors.bgCard, borderRadius:radius.lg, marginHorizontal:spacing.lg, marginBottom:spacing.md, padding:spacing.md, ...shadow.sm },
  chartTitle:   { ...typography.h4, color:colors.textPrimary, marginBottom:spacing.md },
  chart:        { borderRadius:12 },
  actSection:   { paddingHorizontal:spacing.lg, marginTop:spacing.sm },
  sectionTitle: { ...typography.h4, color:colors.textPrimary, marginBottom:spacing.sm },
  actRow:       { flexDirection:'row', alignItems:'center', backgroundColor:colors.bgCard, borderRadius:radius.md, padding:12, marginBottom:8, ...shadow.sm },
  actIcon:      { width:32, height:32, borderRadius:16, justifyContent:'center', alignItems:'center', marginRight:12 },
  actType:      { ...typography.small, color:colors.textPrimary, fontWeight:'600' },
  actDesc:      { ...typography.tiny, color:colors.textSecondary, marginTop:2 },
  actTime:      { ...typography.tiny, color:colors.textMuted },
});
`);

// ============================================================
// screens/baby/AddBabyScreen.js
// ============================================================
write('src/screens/baby/AddBabyScreen.js', `
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { babyAPI } from '../../services/api';
import { colors, spacing, radius, typography, shadow } from '../../theme';

const GENDERS = [
  { key:'male',   label:'👦 Boy'   },
  { key:'female', label:'👧 Girl'  },
  { key:'other',  label:'🌟 Other' },
];

export default function AddBabyScreen({ navigation, route }) {
  const editing = route?.params?.baby;
  const [form, setForm] = useState({
    name:          editing?.name          || '',
    date_of_birth: editing?.date_of_birth || '',
    gender:        editing?.gender        || 'male',
    weight:        editing?.weight?.toString() || '',
    height:        editing?.height?.toString() || '',
    notes:         editing?.notes         || '',
  });
  const [loading, setLoading] = useState(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name || !form.date_of_birth) {
      Alert.alert('Required', 'Name and date of birth are required.'); return;
    }
    if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(form.date_of_birth)) {
      Alert.alert('Format', 'Date of birth must be YYYY-MM-DD.'); return;
    }
    setLoading(true);
    try {
      const payload = { ...form, weight: form.weight ? parseFloat(form.weight) : null, height: form.height ? parseFloat(form.height) : null };
      if (editing) {
        await babyAPI.update(editing.id, payload);
        Alert.alert('Updated', \`\${form.name}'s profile has been updated.\`, [{ text:'OK', onPress:()=>navigation.goBack() }]);
      } else {
        await babyAPI.create(payload);
        Alert.alert('Added!', \`\${form.name} has been added.\`, [{ text:'OK', onPress:()=>navigation.goBack() }]);
      }
    } catch (e) {
      Alert.alert('Error', Object.values(e||{}).flat().join('\\n') || 'Something went wrong.');
    } finally { setLoading(false); }
  };

  const handleDelete = () => {
    Alert.alert('Delete?', \`This will delete \${editing?.name}'s profile permanently.\`, [
      { text:'Cancel', style:'cancel' },
      { text:'Delete', style:'destructive', onPress: async () => { await babyAPI.delete(editing.id); navigation.navigate('Home'); } },
    ]);
  };

  const Field = ({ label, icon, children }) => (
    <View style={styles.fieldBlock}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <Ionicons name={icon} size={18} color={colors.textMuted} style={{ marginRight:8 }} />
        {children}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{editing ? 'Edit profile' : 'Add baby'}</Text>
        <View style={{ width:24 }} />
      </View>

      <View style={styles.body}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>{form.gender==='male'?'👦':form.gender==='female'?'👧':'🌟'}</Text>
          </View>
        </View>

        <Field label="BABY'S NAME *" icon="person-outline">
          <TextInput style={styles.input} placeholder="e.g. Olivia" placeholderTextColor={colors.textMuted} value={form.name} onChangeText={set('name')} />
        </Field>

        <Field label="DATE OF BIRTH * (YYYY-MM-DD)" icon="calendar-outline">
          <TextInput style={styles.input} placeholder="2024-03-15" placeholderTextColor={colors.textMuted} value={form.date_of_birth} onChangeText={set('date_of_birth')} keyboardType="numeric" />
        </Field>

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>GENDER</Text>
          <View style={styles.genderRow}>
            {GENDERS.map((g) => (
              <TouchableOpacity key={g.key} style={[styles.genderChip, form.gender===g.key && styles.genderChipActive]} onPress={()=>set('gender')(g.key)}>
                <Text style={[styles.genderText, form.gender===g.key && styles.genderTextActive]}>{g.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.row}>
          <View style={{ flex:1, marginRight:8 }}>
            <Field label="WEIGHT (KG)" icon="scale-outline">
              <TextInput style={styles.input} placeholder="3.5" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" value={form.weight} onChangeText={set('weight')} />
            </Field>
          </View>
          <View style={{ flex:1 }}>
            <Field label="HEIGHT (CM)" icon="resize-outline">
              <TextInput style={styles.input} placeholder="52" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" value={form.height} onChangeText={set('height')} />
            </Field>
          </View>
        </View>

        <Field label="NOTES" icon="document-text-outline">
          <TextInput style={[styles.input,styles.textarea]} placeholder="Allergies, doctor notes..." placeholderTextColor={colors.textMuted} value={form.notes} onChangeText={set('notes')} multiline numberOfLines={4} textAlignVertical="top" />
        </Field>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <><Ionicons name="checkmark" size={20} color="#fff" /><Text style={styles.saveBtnText}>{editing?'Save changes':'Add baby'}</Text></>
          }
        </TouchableOpacity>

        {editing && (
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
            <Text style={styles.deleteBtnText}>Delete profile</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:      { flex:1, backgroundColor:colors.bg },
  header:         { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingTop:60, paddingHorizontal:spacing.lg, paddingBottom:spacing.md, backgroundColor:colors.bgCard, borderBottomWidth:1, borderBottomColor:colors.border },
  title:          { ...typography.h3, color:colors.textPrimary },
  body:           { padding:spacing.lg },
  avatarWrap:     { alignItems:'center', marginBottom:spacing.xl },
  avatar:         { width:90, height:90, borderRadius:45, backgroundColor:colors.primaryLight, justifyContent:'center', alignItems:'center', ...shadow.md },
  avatarEmoji:    { fontSize:44 },
  row:            { flexDirection:'row' },
  fieldBlock:     { marginBottom:spacing.md },
  label:          { ...typography.label, color:colors.textSecondary, marginBottom:6 },
  inputWrap:      { flexDirection:'row', alignItems:'center', borderWidth:1.5, borderColor:colors.border, borderRadius:radius.md, backgroundColor:colors.bgCard, paddingHorizontal:12 },
  input:          { flex:1, height:48, ...typography.body, color:colors.textPrimary },
  textarea:       { height:100, paddingTop:12 },
  genderRow:      { flexDirection:'row', gap:8 },
  genderChip:     { flex:1, borderWidth:1.5, borderColor:colors.border, borderRadius:radius.md, paddingVertical:10, alignItems:'center', backgroundColor:colors.bgCard },
  genderChipActive:{ borderColor:colors.primary, backgroundColor:colors.primaryLight },
  genderText:     { ...typography.small, color:colors.textSecondary },
  genderTextActive:{ color:colors.primary, fontWeight:'700' },
  saveBtn:        { flexDirection:'row', alignItems:'center', justifyContent:'center', backgroundColor:colors.primary, borderRadius:radius.md, height:54, gap:8, marginTop:spacing.md, ...shadow.md },
  saveBtnText:    { ...typography.h4, color:'#fff' },
  deleteBtn:      { flexDirection:'row', alignItems:'center', justifyContent:'center', borderWidth:1.5, borderColor:colors.danger, borderRadius:radius.md, height:48, gap:8, marginTop:spacing.sm },
  deleteBtnText:  { ...typography.body, color:colors.danger, fontWeight:'600' },
});
`);

// ============================================================
// screens/activities/ActivitiesScreen.js
// ============================================================
write('src/screens/activities/ActivitiesScreen.js', `
import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { activityAPI } from '../../services/api';
import { colors, spacing, radius, typography, shadow } from '../../theme';

const TYPE_CONFIG = {
  sleep:             { icon:'moon-outline',          color:colors.primary },
  awake:             { icon:'sunny-outline',          color:colors.amber   },
  cry:               { icon:'volume-high-outline',    color:colors.accent  },
  motion:            { icon:'walk-outline',           color:colors.green   },
  temperature_alert: { icon:'thermometer-outline',    color:colors.danger  },
  humidity_alert:    { icon:'water-outline',          color:colors.info    },
  feeding:           { icon:'restaurant-outline',     color:colors.purple  },
  diaper:            { icon:'color-fill-outline',     color:colors.amber   },
};

const FILTERS = ['All','sleep','cry','motion','feeding'];

export default function ActivitiesScreen({ route, navigation }) {
  const { baby }  = route.params || {};
  const [activities, setActivities] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter]         = useState('All');

  const load = async () => {
    if (!baby) { setLoading(false); return; }
    try {
      const params = filter !== 'All' ? { type:filter } : {};
      const data   = await activityAPI.list(baby.id, params);
      const list   = data.results || data;
      setActivities(Array.isArray(list) ? list : []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, [filter]);

  const renderItem = ({ item }) => {
    const cfg   = TYPE_CONFIG[item.activity_type] || { icon:'ellipse-outline', color:colors.textSecondary };
    return (
      <View style={styles.card}>
        <View style={[styles.icon,{backgroundColor:cfg.color+'20'}]}>
          <Ionicons name={cfg.icon} size={20} color={cfg.color} />
        </View>
        <View style={{ flex:1 }}>
          <Text style={styles.cardTitle}>{item.activity_type_display}</Text>
          {item.description ? <Text style={styles.cardDesc}>{item.description}</Text> : null}
          {item.duration_minutes ? <Text style={styles.cardMeta}>Duration: {item.duration_minutes} min</Text> : null}
        </View>
        <View style={styles.timeCol}>
          <Text style={styles.time}>{new Date(item.timestamp).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}</Text>
          <Text style={styles.date}>{new Date(item.timestamp).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</Text>
          {item.severity && item.severity !== 'low' && (
            <View style={[styles.severityPill,{backgroundColor:item.severity==='high'?colors.dangerLight:colors.warningLight}]}>
              <Text style={[styles.severityText,{color:item.severity==='high'?colors.danger:colors.warning}]}>{item.severity}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{baby?.name || 'Baby'}'s Activity</Text>
        <View style={{ width:24 }} />
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity key={f} style={[styles.filterChip, filter===f && styles.filterChipActive]} onPress={()=>setFilter(f)}>
            <Text style={[styles.filterText, filter===f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase()+f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading
        ? <ActivityIndicator size="large" color={colors.primary} style={{ marginTop:40 }} />
        : (
          <FlatList
            data={activities}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);load();}} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="list-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyText}>No activity found</Text>
              </View>
            }
          />
        )
      }
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex:1, backgroundColor:colors.bg },
  header:           { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingTop:60, paddingHorizontal:spacing.lg, paddingBottom:spacing.md, backgroundColor:colors.bgCard, borderBottomWidth:1, borderBottomColor:colors.border },
  title:            { ...typography.h3, color:colors.textPrimary },
  filterRow:        { flexDirection:'row', padding:spacing.md, gap:8 },
  filterChip:       { paddingHorizontal:14, paddingVertical:7, borderRadius:radius.full, backgroundColor:colors.bgCard, borderWidth:1.5, borderColor:colors.border },
  filterChipActive: { backgroundColor:colors.primary, borderColor:colors.primary },
  filterText:       { ...typography.small, color:colors.textSecondary, fontWeight:'600' },
  filterTextActive: { color:'#fff' },
  list:             { padding:spacing.md },
  card:             { flexDirection:'row', alignItems:'flex-start', backgroundColor:colors.bgCard, borderRadius:radius.md, padding:spacing.md, marginBottom:8, ...shadow.sm },
  icon:             { width:40, height:40, borderRadius:20, justifyContent:'center', alignItems:'center', marginRight:12 },
  cardTitle:        { ...typography.small, fontWeight:'700', color:colors.textPrimary },
  cardDesc:         { ...typography.tiny, color:colors.textSecondary, marginTop:2 },
  cardMeta:         { ...typography.tiny, color:colors.textMuted, marginTop:2 },
  timeCol:          { alignItems:'flex-end', minWidth:60 },
  time:             { ...typography.tiny, color:colors.textMuted, fontWeight:'600' },
  date:             { ...typography.tiny, color:colors.textMuted },
  severityPill:     { borderRadius:radius.full, paddingHorizontal:6, paddingVertical:2, marginTop:4 },
  severityText:     { ...typography.tiny, fontWeight:'700' },
  empty:            { alignItems:'center', padding:spacing.xl*2 },
  emptyText:        { ...typography.h3, color:colors.textPrimary, marginTop:spacing.md },
});
`);

// ============================================================
// screens/notifications/NotificationsScreen.js
// ============================================================
write('src/screens/notifications/NotificationsScreen.js', `
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { notifAPI } from '../../services/api';
import { colors, spacing, radius, typography, shadow } from '../../theme';

const TYPE_CONFIG = {
  cry:         { icon:'volume-high-outline',    color:colors.accent   },
  motion:      { icon:'walk-outline',           color:colors.amber    },
  temperature: { icon:'thermometer-outline',    color:colors.danger   },
  humidity:    { icon:'water-outline',          color:colors.info     },
  sleep:       { icon:'moon-outline',           color:colors.primary  },
  summary:     { icon:'bar-chart-outline',      color:colors.green    },
};

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);

  const load = async () => {
    try {
      const list = await notifAPI.list();
      setNotifications(Array.isArray(list) ? list : list.results || []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const handleMarkRead = async (id) => {
    await notifAPI.markRead(id);
    setNotifications((prev) => prev.map((n) => n.id===id ? {...n,read:true} : n));
  };

  const unread = notifications.filter((n) => !n.read).length;

  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Notifications</Text>
          {unread > 0 && <Text style={styles.unreadText}>{unread} unread</Text>}
        </View>
        <View style={{ width:24 }} />
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);load();}} />}>
        {notifications.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptyBody}>Alerts will appear here when your baby needs attention.</Text>
          </View>
        )}
        {notifications.map((n) => {
          const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.summary;
          return (
            <TouchableOpacity
              key={n.id}
              style={[styles.notifCard, !n.read && styles.notifCardUnread]}
              onPress={() => handleMarkRead(n.id)}
            >
              <View style={[styles.notifIcon,{backgroundColor:cfg.color+'20'}]}>
                <Ionicons name={cfg.icon} size={22} color={cfg.color} />
              </View>
              <View style={styles.notifBody}>
                <View style={styles.notifTop}>
                  <Text style={styles.notifTitle}>{n.title}</Text>
                  {!n.read && <View style={[styles.unreadDot,{backgroundColor:cfg.color}]} />}
                </View>
                <Text style={styles.notifText}>{n.body}</Text>
                <View style={styles.notifMeta}>
                  {n.baby && <Text style={styles.notifBaby}>{n.baby}</Text>}
                  <Text style={styles.notifTime}>
                    {new Date(n.created_at).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
        <View style={{ height:40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex:1, backgroundColor:colors.bg },
  loading:         { flex:1, justifyContent:'center', alignItems:'center', backgroundColor:colors.bg },
  header:          { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingTop:60, paddingHorizontal:spacing.lg, paddingBottom:spacing.md, backgroundColor:colors.bgCard, borderBottomWidth:1, borderBottomColor:colors.border },
  title:           { ...typography.h3, color:colors.textPrimary },
  unreadText:      { ...typography.tiny, color:colors.primary },
  empty:           { alignItems:'center', padding:spacing.xxl*2 },
  emptyTitle:      { ...typography.h3, color:colors.textPrimary, marginTop:spacing.lg },
  emptyBody:       { ...typography.body, color:colors.textSecondary, textAlign:'center', marginTop:8 },
  notifCard:       { flexDirection:'row', backgroundColor:colors.bgCard, marginHorizontal:spacing.lg, marginTop:spacing.sm, borderRadius:radius.lg, padding:spacing.md, ...shadow.sm },
  notifCardUnread: { borderLeftWidth:3, borderLeftColor:colors.primary },
  notifIcon:       { width:44, height:44, borderRadius:22, justifyContent:'center', alignItems:'center', marginRight:12 },
  notifBody:       { flex:1 },
  notifTop:        { flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  notifTitle:      { ...typography.small, fontWeight:'700', color:colors.textPrimary, flex:1 },
  unreadDot:       { width:8, height:8, borderRadius:4 },
  notifText:       { ...typography.small, color:colors.textSecondary, marginTop:4 },
  notifMeta:       { flexDirection:'row', justifyContent:'space-between', marginTop:6 },
  notifBaby:       { ...typography.tiny, color:colors.primary, fontWeight:'600' },
  notifTime:       { ...typography.tiny, color:colors.textMuted },
});
`);

// ============================================================
// screens/settings/SettingsScreen.js
// ============================================================
write('src/screens/settings/SettingsScreen.js', `
import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius, typography, shadow } from '../../theme';

export default function SettingsScreen({ navigation }) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text:'Cancel', style:'cancel' },
      { text:'Sign out', style:'destructive', onPress:logout },
    ]);
  };

  const MenuItem = ({ icon, label, onPress, danger }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
        <Ionicons name={icon} size={20} color={danger ? colors.danger : colors.primary} />
      </View>
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
      {!danger && <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width:24 }} />
      </View>

      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileInitials}>
            {(user?.first_name?.[0] || user?.username?.[0] || '?').toUpperCase()}
          </Text>
        </View>
        <View>
          <Text style={styles.profileName}>
            {user?.first_name ? \`\${user.first_name} \${user.last_name}\` : user?.username}
          </Text>
          <Text style={styles.profileEmail}>{user?.email || 'No email set'}</Text>
        </View>
      </View>

      <Text style={styles.sectionHeader}>ACCOUNT</Text>
      <View style={styles.menuSection}>
        <MenuItem icon="person-outline"        label="Edit profile"            onPress={()=>{}} />
        <MenuItem icon="notifications-outline" label="Notification settings"   onPress={()=>navigation.navigate('Notifications')} />
      </View>

      <Text style={styles.sectionHeader}>MONITORING</Text>
      <View style={styles.menuSection}>
        <MenuItem icon="videocam-outline"      label="Camera settings"         onPress={()=>{}} />
        <MenuItem icon="thermometer-outline"   label="Alert thresholds"        onPress={()=>{}} />
        <MenuItem icon="wifi-outline"          label="Connection settings"     onPress={()=>{}} />
      </View>

      <Text style={styles.sectionHeader}>ABOUT</Text>
      <View style={styles.menuSection}>
        <MenuItem icon="information-circle-outline" label="App version 1.0.0" onPress={()=>{}} />
        <MenuItem icon="shield-checkmark-outline"   label="Privacy policy"    onPress={()=>{}} />
        <MenuItem icon="document-text-outline"      label="Terms of service"  onPress={()=>{}} />
      </View>

      <View style={[styles.menuSection, { marginTop:spacing.md }]}>
        <MenuItem icon="log-out-outline" label="Sign out" onPress={handleLogout} danger />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>BabyMonitor v1.0.0</Text>
        <Text style={styles.footerText}>Made with ❤️ for final year project</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:      { flex:1, backgroundColor:colors.bg },
  header:         { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingTop:60, paddingHorizontal:spacing.lg, paddingBottom:spacing.md, backgroundColor:colors.bgCard, borderBottomWidth:1, borderBottomColor:colors.border },
  title:          { ...typography.h3, color:colors.textPrimary },
  profileCard:    { flexDirection:'row', alignItems:'center', backgroundColor:colors.bgCard, margin:spacing.lg, borderRadius:radius.lg, padding:spacing.lg, ...shadow.md },
  profileAvatar:  { width:60, height:60, borderRadius:30, backgroundColor:colors.primary, justifyContent:'center', alignItems:'center', marginRight:spacing.md },
  profileInitials:{ ...typography.h2, color:'#fff' },
  profileName:    { ...typography.h4, color:colors.textPrimary },
  profileEmail:   { ...typography.small, color:colors.textSecondary, marginTop:2 },
  sectionHeader:  { ...typography.label, color:colors.textMuted, letterSpacing:1, marginHorizontal:spacing.lg, marginBottom:8, marginTop:spacing.sm },
  menuSection:    { backgroundColor:colors.bgCard, borderRadius:radius.lg, marginHorizontal:spacing.lg, overflow:'hidden', ...shadow.sm },
  menuItem:       { flexDirection:'row', alignItems:'center', padding:spacing.md, borderBottomWidth:1, borderBottomColor:colors.borderLight },
  menuIcon:       { width:36, height:36, borderRadius:18, backgroundColor:colors.primaryLight, justifyContent:'center', alignItems:'center', marginRight:12 },
  menuIconDanger: { backgroundColor:colors.dangerLight },
  menuLabel:      { ...typography.body, color:colors.textPrimary, flex:1 },
  menuLabelDanger:{ color:colors.danger },
  footer:         { alignItems:'center', padding:spacing.xl },
  footerText:     { ...typography.tiny, color:colors.textMuted, marginBottom:4 },
});
`);

// ============================================================
// App.js (Root Navigator)
// ============================================================
write('App.js', `
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { colors, typography } from './src/theme';

import LoginScreen         from './src/screens/auth/LoginScreen';
import RegisterScreen      from './src/screens/auth/RegisterScreen';
import HomeScreen          from './src/screens/home/HomeScreen';
import LiveStreamScreen    from './src/screens/stream/LiveStreamScreen';
import SummaryScreen       from './src/screens/summary/SummaryScreen';
import ActivitiesScreen    from './src/screens/activities/ActivitiesScreen';
import AddBabyScreen       from './src/screens/baby/AddBabyScreen';
import NotificationsScreen from './src/screens/notifications/NotificationsScreen';
import SettingsScreen      from './src/screens/settings/SettingsScreen';

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

const TAB_ICONS = {
  Home:       ['home',      'home-outline'      ],
  Summary:    ['bar-chart', 'bar-chart-outline' ],
  Activities: ['list',      'list-outline'      ],
  Settings:   ['settings',  'settings-outline'  ],
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 84,
          paddingBottom: 24,
          paddingTop: 8,
        },
        tabBarActiveTintColor:   colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { ...typography.tiny, marginTop: 2 },
        tabBarIcon: ({ focused, color }) => {
          const [active, inactive] = TAB_ICONS[route.name] || ['ellipse','ellipse-outline'];
          return <Ionicons name={focused ? active : inactive} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home"       component={HomeScreen}       />
      <Tab.Screen name="Summary"    component={SummaryScreen}    initialParams={{ baby:null }} />
      <Tab.Screen name="Activities" component={ActivitiesScreen} initialParams={{ baby:null }} />
      <Tab.Screen name="Settings"   component={SettingsScreen}   />
    </Tab.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown:false }}>
      <Stack.Screen name="Main"          component={MainTabs}           />
      <Stack.Screen name="LiveStream"    component={LiveStreamScreen}   />
      <Stack.Screen name="AddBaby"       component={AddBabyScreen}      />
      <Stack.Screen name="BabyProfile"   component={AddBabyScreen}      />
      <Stack.Screen name="Notifications" component={NotificationsScreen}/>
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown:false }}>
      <Stack.Screen name="Login"    component={LoginScreen}    />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  return user ? <AppStack /> : <AuthStack />;
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
`);

console.log('\\n✅ All files written successfully!');