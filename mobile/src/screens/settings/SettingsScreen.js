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
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: logout },
    ]);
  };

  const MenuItem = ({ icon, label, onPress, danger, badge }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
        <Ionicons name={icon} size={20} color={danger ? colors.danger : colors.primary} />
      </View>
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
      {badge && <View style={styles.badge}><Text style={styles.badgeText}>{badge}</Text></View>}
      {!danger && <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Profile card */}
      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileInitials}>
            {(user?.first_name?.[0] || user?.username?.[0] || '?').toUpperCase()}
          </Text>
        </View>
        <View>
          <Text style={styles.profileName}>
            {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}
          </Text>
          <Text style={styles.profileEmail}>{user?.email || 'No email set'}</Text>
        </View>
      </View>

      {/* Account section */}
      <Text style={styles.sectionHeader}>Account</Text>
      <View style={styles.menuSection}>
        <MenuItem icon="person-outline" label="Edit profile" onPress={() => {}} />
        <MenuItem icon="notifications-outline" label="Notification settings" onPress={() => navigation.navigate('Notifications')} />
      </View>

      {/* Monitoring section */}
      <Text style={styles.sectionHeader}>Monitoring</Text>
      <View style={styles.menuSection}>
        <MenuItem icon="videocam-outline" label="Camera settings" onPress={() => {}} />
        <MenuItem icon="thermometer-outline" label="Alert thresholds" onPress={() => {}} />
        <MenuItem icon="wifi-outline" label="Connection settings" onPress={() => {}} />
      </View>

      {/* About section */}
      <Text style={styles.sectionHeader}>About</Text>
      <View style={styles.menuSection}>
        <MenuItem icon="information-circle-outline" label="App version 1.0.0" onPress={() => {}} />
        <MenuItem icon="shield-checkmark-outline" label="Privacy policy" onPress={() => {}} />
        <MenuItem icon="document-text-outline" label="Terms of service" onPress={() => {}} />
      </View>

      {/* Sign out */}
      <View style={[styles.menuSection, { marginTop: spacing.md }]}>
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
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 60, paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
    backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title:        { ...typography.h3, color: colors.textPrimary },
  profileCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgCard, margin: spacing.lg,
    borderRadius: radius.lg, padding: spacing.lg, ...shadow.md,
  },
  profileAvatar: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md,
  },
  profileInitials: { ...typography.h2, color: '#fff' },
  profileName:     { ...typography.h4, color: colors.textPrimary },
  profileEmail:    { ...typography.small, color: colors.textSecondary, marginTop: 2 },
  sectionHeader: {
    ...typography.label, color: colors.textMuted, textTransform: 'uppercase',
    letterSpacing: 1, marginHorizontal: spacing.lg, marginBottom: 8, marginTop: spacing.sm,
  },
  menuSection:  {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    marginHorizontal: spacing.lg, overflow: 'hidden', ...shadow.sm,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  menuIcon:       {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  menuIconDanger: { backgroundColor: colors.dangerLight },
  menuLabel:      { ...typography.body, color: colors.textPrimary, flex: 1 },
  menuLabelDanger:{ color: colors.danger },
  badge: {
    backgroundColor: colors.accent, borderRadius: radius.full,
    paddingHorizontal: 8, paddingVertical: 2, marginRight: 8,
  },
  badgeText:     { ...typography.tiny, color: '#fff' },
  footer:        { alignItems: 'center', padding: spacing.xl },
  footerText:    { ...typography.tiny, color: colors.textMuted, marginBottom: 4 },
});