import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { patientsApi } from '../../services/api';
import { Button, Card, SectionHeader } from '../../components/ui';
import { Colors, Spacing, Radius } from '../../utils/theme';

const VILLAGES = ['Rampur', 'Sitapur', 'Devgarh', 'Chandpur', 'Nandgaon'];
const DISTRICTS = ['Varanasi', 'Lucknow', 'Allahabad'];
const CONDITIONS = ['hypertension', 'diabetes', 'anaemia', 'gestational diabetes', 'preeclampsia', 'heart disease'];

export function NewPatientScreen({ navigation }: any) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: '', age: '', phone: '', emergency_contact: '',
    village: 'Rampur', district: 'Varanasi',
    pregnancy_week: '', expected_due_date: '',
    medical_conditions: [] as string[],
    device_id: '',
  });

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));
  const toggleCondition = (c: string) =>
    set('medical_conditions',
      form.medical_conditions.includes(c)
        ? form.medical_conditions.filter((x) => x !== c)
        : [...form.medical_conditions, c]
    );

  const mutation = useMutation({
    mutationFn: () => patientsApi.create({
      ...form,
      age: parseInt(form.age),
      pregnancy_week: parseInt(form.pregnancy_week),
    }),
    onSuccess: (data) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['patients'] });
      Alert.alert('Patient Registered', `${form.name} has been added successfully.`, [
        { text: 'View Profile', onPress: () => navigation.replace('PatientDetail', { patientId: data.id }) },
        { text: 'Back to List', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.response?.data?.detail || 'Registration failed.');
    },
  });

  const validate = () => {
    if (!form.name.trim()) return 'Name is required';
    if (!form.age || isNaN(parseInt(form.age))) return 'Valid age is required';
    if (!form.phone || form.phone.length < 10) return 'Valid phone number required';
    if (!form.pregnancy_week) return 'Pregnancy week is required';
    if (!form.expected_due_date) return 'Expected due date is required';
    if (!form.emergency_contact) return 'Emergency contact is required';
    return null;
  };

  const handleSubmit = () => {
    const err = validate();
    if (err) { Alert.alert('Validation Error', err); return; }
    mutation.mutate();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Personal */}
        <SectionHeader title="Personal Information" />
        <Card style={styles.formCard}>
          <Field label="Full Name *" value={form.name} onChange={(v) => set('name', v)} placeholder="e.g. Sunita Devi" />
          <Field label="Age *" value={form.age} onChange={(v) => set('age', v)} placeholder="e.g. 24" keyboardType="number-pad" />
          <Field label="Phone *" value={form.phone} onChange={(v) => set('phone', v)} placeholder="10-digit number" keyboardType="phone-pad" />
          <Field label="Emergency Contact *" value={form.emergency_contact} onChange={(v) => set('emergency_contact', v)} placeholder="Phone number" keyboardType="phone-pad" />
        </Card>

        {/* Location */}
        <SectionHeader title="Location" />
        <Card style={styles.formCard}>
          <Text style={styles.label}>Village *</Text>
          <View style={styles.optionRow}>
            {VILLAGES.map((v) => (
              <TouchableOpacity
                key={v}
                onPress={() => set('village', v)}
                style={[styles.optionChip, form.village === v && styles.optionChipActive]}
              >
                <Text style={[styles.optionText, form.village === v && styles.optionTextActive]}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.label, { marginTop: 12 }]}>District *</Text>
          <View style={styles.optionRow}>
            {DISTRICTS.map((d) => (
              <TouchableOpacity
                key={d}
                onPress={() => set('district', d)}
                style={[styles.optionChip, form.district === d && styles.optionChipActive]}
              >
                <Text style={[styles.optionText, form.district === d && styles.optionTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Pregnancy */}
        <SectionHeader title="Pregnancy Details" />
        <Card style={styles.formCard}>
          <Field label="Current Week *" value={form.pregnancy_week} onChange={(v) => set('pregnancy_week', v)} placeholder="e.g. 24" keyboardType="number-pad" />
          <Field label="Expected Due Date *" value={form.expected_due_date} onChange={(v) => set('expected_due_date', v)} placeholder="YYYY-MM-DD" />
        </Card>

        {/* Medical conditions */}
        <SectionHeader title="Medical Conditions" />
        <Card>
          <View style={styles.optionRow}>
            {CONDITIONS.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => toggleCondition(c)}
                style={[styles.optionChip, form.medical_conditions.includes(c) && styles.optionChipDanger]}
              >
                <Text style={[styles.optionText, form.medical_conditions.includes(c) && styles.optionTextDanger]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Device */}
        <SectionHeader title="Device (Optional)" />
        <Card style={styles.formCard}>
          <Field label="Wearable Device ID" value={form.device_id} onChange={(v) => set('device_id', v)} placeholder="e.g. WD-1030" />
        </Card>

        <View style={styles.actions}>
          <Button label="Register Patient" onPress={handleSubmit} loading={mutation.isPending} style={{ flex: 1 }} />
          <Button label="Cancel" onPress={() => navigation.goBack()} variant="ghost" style={{ flex: 1 }} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label, value, onChange, placeholder, keyboardType = 'default',
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; keyboardType?: any;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.navy950 },
  scroll: { padding: Spacing.md, paddingBottom: 48 },
  formCard: { gap: 4 },
  fieldWrap: { marginBottom: 10 },
  label: { fontSize: 11, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 },
  input: {
    backgroundColor: Colors.navy900, borderWidth: 1, borderColor: Colors.borderMedium,
    borderRadius: Radius.sm, paddingHorizontal: 14, paddingVertical: 11,
    color: Colors.textPrimary, fontSize: 14,
  },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: Radius.full, backgroundColor: Colors.navy900,
    borderWidth: 1, borderColor: Colors.borderSubtle,
  },
  optionChipActive: {
    backgroundColor: 'rgba(255,95,61,0.12)', borderColor: Colors.coral500 + '50',
  },
  optionChipDanger: {
    backgroundColor: 'rgba(255,95,61,0.12)', borderColor: Colors.coral500 + '50',
  },
  optionText: { fontSize: 12, color: Colors.textMuted },
  optionTextActive: { color: Colors.coral400 },
  optionTextDanger: { color: Colors.coral400 },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
});
