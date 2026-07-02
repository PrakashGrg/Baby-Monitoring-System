import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { babyAPI } from '../../services/api';
import { colors, spacing, radius, typography, shadow } from '../../theme';

const GENDERS = [
  { key: 'male',   label: '👦 Boy'   },
  { key: 'female', label: '👧 Girl'  },
  { key: 'other',  label: '🌟 Other' },
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
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date_of_birth)) {
      Alert.alert('Format', 'Date of birth must be YYYY-MM-DD.'); return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        weight: form.weight ? parseFloat(form.weight) : null,
        height: form.height ? parseFloat(form.height) : null,
      };
      if (editing) {
        await babyAPI.update(editing.id, payload);
        Alert.alert('Updated', `${form.name}'s profile has been updated.`, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await babyAPI.create(payload);
        Alert.alert('Added!', `${form.name} has been added.`, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (e) {
      Alert.alert('Error', Object.values(e || {}).flat().join('\n') || 'Something went wrong.');
    } finally { setLoading(false); }
  };

  const handleDelete = () => {
    Alert.alert('Delete?', `This will delete ${editing?.name}'s profile permanently.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => { await babyAPI.delete(editing.id); navigation.navigate('Home'); },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{editing ? 'Edit profile' : 'Add baby'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.body}>
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>
              {form.gender === 'male' ? '👦' : form.gender === 'female' ? '👧' : '🌟'}
            </Text>
          </View>
          <Text style={styles.avatarHint}>Baby avatar</Text>
        </View>

        {/* Name */}
        <View style={styles.fieldBlock}>
          <Text style={styles.label}>BABY'S NAME *</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="person-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. Olivia"
              placeholderTextColor={colors.textMuted}
              value={form.name}
              onChangeText={set('name')}
            />
          </View>
        </View>

        {/* DOB */}
        <View style={styles.fieldBlock}>
          <Text style={styles.label}>DATE OF BIRTH * (YYYY-MM-DD)</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="calendar-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="2024-03-15"
              placeholderTextColor={colors.textMuted}
              value={form.date_of_birth}
              onChangeText={set('date_of_birth')}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Gender */}
        <View style={styles.fieldBlock}>
          <Text style={styles.label}>GENDER</Text>
          <View style={styles.genderRow}>
            {GENDERS.map((g) => (
              <TouchableOpacity
                key={g.key}
                style={[styles.genderChip, form.gender === g.key && styles.genderChipActive]}
                onPress={() => set('gender')(g.key)}
              >
                <Text style={[styles.genderText, form.gender === g.key && styles.genderTextActive]}>
                  {g.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Weight + Height */}
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <View style={styles.fieldBlock}>
              <Text style={styles.label}>WEIGHT (KG)</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="scale-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="3.5"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  value={form.weight}
                  onChangeText={set('weight')}
                />
              </View>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.fieldBlock}>
              <Text style={styles.label}>HEIGHT (CM)</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="resize-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="52"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  value={form.height}
                  onChangeText={set('height')}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Notes — fixed: icon inside row at top, textarea grows below */}
        <View style={styles.fieldBlock}>
          <Text style={styles.label}>NOTES</Text>
          <View style={styles.notesWrap}>
            <View style={styles.notesIconRow}>
              <Ionicons name="document-text-outline" size={18} color={colors.textMuted} />
            </View>
            <TextInput
              style={styles.textarea}
              placeholder="Allergies, doctor notes..."
              placeholderTextColor={colors.textMuted}
              value={form.notes}
              onChangeText={set('notes')}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Save */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.saveBtnText}>{editing ? 'Save changes' : 'Add baby'}</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Delete */}
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
  container:       { flex: 1, backgroundColor: colors.bg },
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  title:           { ...typography.h3, color: colors.textPrimary },
  body:            { padding: spacing.lg },
  avatarWrap:      { alignItems: 'center', marginBottom: spacing.xl },
  avatar:          { width: 90, height: 90, borderRadius: 45, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', ...shadow.md },
  avatarEmoji:     { fontSize: 44 },
  avatarHint:      { ...typography.tiny, color: colors.textMuted, marginTop: 8 },
  row:             { flexDirection: 'row' },
  fieldBlock:      { marginBottom: spacing.md },
  label:           { ...typography.label, color: colors.textSecondary, marginBottom: 6 },
  inputWrap:       { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.bgCard, paddingHorizontal: 12 },
  inputIcon:       { marginRight: 8 },
  input:           { flex: 1, height: 48, ...typography.body, color: colors.textPrimary },
  genderRow:       { flexDirection: 'row', gap: 8 },
  genderChip:      { flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingVertical: 10, alignItems: 'center', backgroundColor: colors.bgCard },
  genderChipActive:{ borderColor: colors.primary, backgroundColor: colors.primaryLight },
  genderText:      { ...typography.small, color: colors.textSecondary },
  genderTextActive:{ color: colors.primary, fontWeight: '700' },

  // Fixed notes field
  notesWrap:       { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.bgCard, paddingHorizontal: 12, paddingTop: 10 },
  notesIconRow:    { marginBottom: 4 },
  textarea:        { ...typography.body, color: colors.textPrimary, minHeight: 100, paddingBottom: 10 },

  saveBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: radius.md, height: 54, gap: 8, marginTop: spacing.md, ...shadow.md },
  saveBtnText:     { ...typography.h4, color: '#fff' },
  deleteBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.danger, borderRadius: radius.md, height: 48, gap: 8, marginTop: spacing.sm, marginBottom: spacing.xl },
  deleteBtnText:   { ...typography.body, color: colors.danger, fontWeight: '600' },
});