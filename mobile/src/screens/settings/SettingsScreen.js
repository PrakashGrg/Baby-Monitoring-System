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

  const MenuItem = ({ icon, label, onPress, danger, subtitle }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
        <Ionicons name={icon} size={20} color={danger ? colors.danger : colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      {!danger && <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>

      {/* Profile card */}
      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileInitials}>
            {(user?.first_name?.[0] || user?.username?.[0] || '?').toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>
            {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}
          </Text>
          <Text style={styles.profileEmail}>{user?.email || 'No email set'}</Text>
        </View>
        <TouchableOpacity style={styles.editAvatarBtn}>
          <Ionicons name="pencil-outline" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Account */}
      <Text style={styles.sectionHeader}>Account</Text>
      <View style={styles.menuSection}>
        <MenuItem
          icon="person-outline"
          label="Edit profile"
          subtitle="Update your name and email"
          onPress={() => {}}
        />
        <MenuItem
          icon="notifications-outline"
          label="Notification settings"
          subtitle="Manage alerts and sounds"
          onPress={() => navigation.navigate('Notifications')}
        />
      </View>

      {/* Monitoring */}
      <Text style={styles.sectionHeader}>Monitoring</Text>
      <View style={styles.menuSection}>
        <MenuItem
          icon="videocam-outline"
          label="Camera settings"
          subtitle="Resolution and streaming"
          onPress={() => {}}
        />
        <MenuItem
          icon="thermometer-outline"
          label="Alert thresholds"
          subtitle="Temperature and humidity limits"
          onPress={() => {}}
        />
        <MenuItem
          icon="wifi-outline"
          label="Connection settings"
          subtitle="Server IP and port"
          onPress={() => {}}
        />
      </View>

      {/* About */}
      <Text style={styles.sectionHeader}>About</Text>
      <View style={styles.menuSection}>
        <MenuItem
          icon="information-circle-outline"
          label="App version"
          subtitle="1.0.0 — Final year project"
          onPress={() => {}}
        />
        <MenuItem
          icon="shield-checkmark-outline"
          label="Privacy policy"
          onPress={() => {}}
        />
        <MenuItem
          icon="document-text-outline"
          label="Terms of service"
          onPress={() => {}}
        />
      </View>

      {/* Sign out */}
      <View style={[styles.menuSection, { marginTop: spacing.sm }]}>
        <MenuItem
          icon="log-out-outline"
          label="Sign out"
          onPress={handleLogout}
          danger
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>BabyMonitor v1.0.0</Text>
        <Text style={styles.footerText}>Made with ❤️ for final year project</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: colors.bg },

  profileCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgCard,
    margin: spacing.lg, marginTop: spacing.lg + 16,
    borderRadius: radius.lg, padding: spacing.lg,
    ...shadow.md,
  },
  profileAvatar: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
    marginRight: spacing.md,
  },
  profileInitials: { fontSize: 24, fontWeight: '700', color: '#fff' },
  profileName:     { ...typography.h4, color: colors.textPrimary },
  profileEmail:    { ...typography.small, color: colors.textSecondary, marginTop: 2 },
  editAvatarBtn:   { padding: 8 },

  // Fixed section header — plain text, no outline/stroke
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginHorizontal: spacing.lg,
    marginBottom: 8,
    marginTop: spacing.md,
  },

  menuSection: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    marginHorizontal: spacing.lg,
    overflow: 'hidden',
    ...shadow.sm,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  menuIcon: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  menuIconDanger:  { backgroundColor: colors.dangerLight },
  menuLabel:       { ...typography.body, color: colors.textPrimary },
  menuLabelDanger: { ...typography.body, color: colors.danger },
  menuSubtitle:    { ...typography.tiny, color: colors.textMuted, marginTop: 2 },

  footer:      { alignItems: 'center', padding: spacing.xl },
  footerText:  { ...typography.tiny, color: colors.textMuted, marginBottom: 4 },
});