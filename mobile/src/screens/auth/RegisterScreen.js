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
    first_name: '', last_name: '', username: '', email: '', password: '', password2: '',
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
      const msg = Object.values(e || {}).flat().join('\n') || 'Registration failed.';
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
              <View style={{ flex: 1, marginRight: 8 }}>
                <Field label="First Name" icon="person-outline" fieldKey="first_name" placeholder="Jane" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Last Name" icon="person-outline" fieldKey="last_name" placeholder="Doe" />
              </View>
            </View>

            <Field label="Username" icon="at-outline" fieldKey="username"
              placeholder="jane_doe" autoCapitalize="none" />

            <Field label="Email" icon="mail-outline" fieldKey="email"
              placeholder="jane@example.com" keyboardType="email-address" autoCapitalize="none" />

            <Field label="Password" icon="lock-closed-outline" fieldKey="password"
              placeholder="At least 6 characters" secureTextEntry />

            <Field label="Confirm Password" icon="lock-closed-outline" fieldKey="password2"
              placeholder="Repeat password" secureTextEntry />

            <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create account</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
              <Text style={styles.loginLinkText}>Already have an account? <Text style={{ color: colors.primary, fontWeight: '600' }}>Sign in</Text></Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, padding: spacing.lg, paddingTop: 60 },
  back:   { position: 'absolute', top: 16, left: 16, padding: 8, zIndex: 10 },
  header: { alignItems: 'center', marginBottom: spacing.xl, marginTop: spacing.xl },
  title:  { ...typography.h1, color: '#fff', marginBottom: 6 },
  sub:    { ...typography.body, color: 'rgba(255,255,255,0.8)' },
  card:   { backgroundColor: '#fff', borderRadius: radius.xl, padding: spacing.xl, ...shadow.lg },
  row:    { flexDirection: 'row' },
  field:  { marginBottom: spacing.md },
  label:  { ...typography.label, color: colors.textSecondary, marginBottom: 6, textTransform: 'uppercase' },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
    backgroundColor: colors.bg, paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input:     { flex: 1, height: 46, ...typography.body, color: colors.textPrimary },
  btn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    height: 52, justifyContent: 'center', alignItems: 'center', marginTop: spacing.sm, ...shadow.md,
  },
  btnText:     { ...typography.h4, color: '#fff' },
  loginLink:   { alignItems: 'center', marginTop: spacing.md },
  loginLinkText: { ...typography.body, color: colors.textSecondary },
});