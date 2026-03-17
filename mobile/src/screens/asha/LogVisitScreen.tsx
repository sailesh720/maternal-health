import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { visitsApi } from '../../services/api';
import { Button, Card, SectionHeader } from '../../components/ui';
import { Colors, Spacing, Radius } from '../../utils/theme';
import { format, addDays } from 'date-fns';

const MEDICINE_OPTIONS = [
  'Iron + Folic Acid tablets',
  'Calcium supplements',
  'Antihypertensive (low dose)',
  'Vitamin D',
  'Antibiotic (prescribed)',
  'None provided',
];

export function LogVisitScreen({ route, navigation }: any) {
  const { patientId } = route.params;
  const qc = useQueryClient();

  const today = format(new Date(), 'yyyy-MM-dd');
  const defaultFollowUp = format(addDays(new Date(), 14), 'yyyy-MM-dd');

  const [notes, setNotes] = useState('');
  const [vitalsRecorded, setVitalsRecorded] = useState(true);
  const [medicine, setMedicine] = useState('');
  const [followUpDate, setFollowUpDate] = useState(defaultFollowUp);

  const mutation = useMutation({
    mutationFn: () =>
      visitsApi.create({
        patient_id: patientId,
        visit_date: today,
        notes: notes || 'Routine visit conducted.',
        vitals_recorded: vitalsRecorded,
        medicine_provided: medicine || undefined,
        follow_up_date: followUpDate,
      }),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['patient-visits', patientId] });
      Alert.alert('Visit Logged', 'Visit has been saved successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: () => {
      Alert.alert('Error', 'Could not save visit. Please try again.');
    },
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <SectionHeader title="Visit Details" />
        <Card>
          <View style={styles.row}>
            <Text style={styles.label}>Visit Date</Text>
            <Text style={styles.value}>{today}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Vitals Recorded</Text>
            <TouchableOpacity
              onPress={() => setVitalsRecorded(!vitalsRecorded)}
              style={[styles.toggle, vitalsRecorded && styles.toggleActive]}
            >
              <Ionicons
                name={vitalsRecorded ? 'checkmark-circle' : 'ellipse-outline'}
                size={22}
                color={vitalsRecorded ? Colors.jade400 : Colors.textMuted}
              />
              <Text style={[styles.toggleText, vitalsRecorded && { color: Colors.jade400 }]}>
                {vitalsRecorded ? 'Yes' : 'No'}
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        <SectionHeader title="Notes" />
        <Card>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            style={styles.notesInput}
            placeholder="Describe the visit, patient condition, observations…"
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </Card>

        <SectionHeader title="Medicine Provided" />
        <Card>
          <View style={styles.medicineGrid}>
            {MEDICINE_OPTIONS.map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => setMedicine(medicine === m ? '' : m)}
                style={[styles.medicineChip, medicine === m && styles.medicineChipActive]}
              >
                <Text style={[styles.medicineText, medicine === m && styles.medicineTextActive]}>
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            value={medicine}
            onChangeText={setMedicine}
            style={[styles.input, { marginTop: 10 }]}
            placeholder="Or type custom medicine…"
            placeholderTextColor={Colors.textMuted}
          />
        </Card>

        <SectionHeader title="Follow-up Date" />
        <Card>
          <TextInput
            value={followUpDate}
            onChangeText={setFollowUpDate}
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={Colors.textMuted}
          />
          <Text style={styles.hint}>Default: 14 days from today</Text>
        </Card>

        <View style={styles.actions}>
          <Button
            label="Save Visit"
            onPress={() => mutation.mutate()}
            loading={mutation.isPending}
            style={{ flex: 1 }}
          />
          <Button
            label="Cancel"
            onPress={() => navigation.goBack()}
            variant="ghost"
            style={{ flex: 1 }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.navy950 },
  scroll: { padding: Spacing.md, paddingBottom: 40 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  divider: { height: 1, backgroundColor: Colors.borderSubtle, marginVertical: 8 },
  label: { fontSize: 13, color: Colors.textMuted },
  value: { fontSize: 13, color: Colors.textPrimary, fontWeight: '500' },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  toggleActive: {},
  toggleText: { fontSize: 13, color: Colors.textMuted },
  notesInput: {
    color: Colors.textPrimary, fontSize: 14, lineHeight: 22,
    minHeight: 100,
  },
  medicineGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  medicineChip: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: Radius.full, backgroundColor: Colors.navy900,
    borderWidth: 1, borderColor: Colors.borderSubtle,
  },
  medicineChipActive: {
    backgroundColor: 'rgba(27,191,132,0.12)',
    borderColor: Colors.jade400 + '50',
  },
  medicineText: { fontSize: 12, color: Colors.textMuted },
  medicineTextActive: { color: Colors.jade400 },
  input: {
    backgroundColor: Colors.navy900, borderWidth: 1, borderColor: Colors.borderMedium,
    borderRadius: Radius.sm, paddingHorizontal: 14, paddingVertical: 11,
    color: Colors.textPrimary, fontSize: 14,
  },
  hint: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
});
