import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, radius, typography, shadow } from '../theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
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

          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.iconWrap}>
              <Ionicons name="moon" size={44} color={colors.primary} />
            </View>
            <Text style={styles.heroTitle}>BabyMonitor</Text>
            <Text style={styles.heroSub}>Keeping watch, so you can rest</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome back</Text>
            <Text style={styles.cardSub}>Sign in to your account</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Username</Text>
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
              <Text style={styles.label}>Password</Text>
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
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Sign in</Text>
              )}
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
  gradient: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  hero: { alignItems: 'center', marginBottom: spacing.xl },
  iconWrap: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.md, ...shadow.lg,
  },
  heroTitle: { ...typography.h1, color: '#fff', marginBottom: 6 },
  heroSub:  { ...typography.body, color: 'rgba(255,255,255,0.8)' },
  card: {
    backgroundColor: colors.bgCard, borderRadius: radius.xl,
    padding: spacing.xl, ...shadow.lg,
  },
  cardTitle: { ...typography.h2, color: colors.textPrimary, marginBottom: 4 },
  cardSub:   { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg },
  field:     { marginBottom: spacing.md },
  label:     { ...typography.label, color: colors.textSecondary, marginBottom: 6, textTransform: 'uppercase' },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
    backgroundColor: colors.bg, paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input:     { flex: 1, height: 48, ...typography.body, color: colors.textPrimary },
  eyeBtn:    { padding: 4 },
  btn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    height: 52, justifyContent: 'center', alignItems: 'center',
    marginTop: spacing.sm, ...shadow.md,
  },
  btnText:   { ...typography.h4, color: '#fff' },
  divider:   { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.md },
  divLine:   { flex: 1, height: 1, backgroundColor: colors.border },
  divText:   { ...typography.small, color: colors.textMuted, marginHorizontal: spacing.sm },
  outlineBtn: {
    borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.md,
    height: 52, justifyContent: 'center', alignItems: 'center',
  },
  outlineBtnText: { ...typography.h4, color: colors.primary },
});