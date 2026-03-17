import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/api';
import { Button } from '../../components/ui';
import { Colors, Spacing, Radius, Fonts } from '../../utils/theme';

type LoginMode = 'email' | 'otp';
type OtpStep = 'phone' | 'verify';

const DEMO = [
  { label: 'ASHA', email: 'priya@asha.gov.in', password: 'demo1234' },
  { label: 'Doctor', email: 'anil@hospital.gov.in', password: 'demo1234' },
  { label: 'Admin', email: 'admin@health.gov.in', password: 'admin1234' },
];

export function LoginScreen() {
  const { login } = useAuth();
  const [mode, setMode] = useState<LoginMode>('email');
  const [loading, setLoading] = useState(false);

  // Email login fields
  const [email, setEmail] = useState('admin@health.gov.in');
  const [password, setPassword] = useState('admin1234');
  const [showPw, setShowPw] = useState(false);

  // OTP fields
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpStep, setOtpStep] = useState<OtpStep>('phone');
  const [otpSent, setOtpSent] = useState(false);
  const [demoOtp, setDemoOtp] = useState('');

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      Alert.alert('Login failed', err?.response?.data?.detail || 'Check your credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async () => {
    if (!phone || phone.length < 10) {
      Alert.alert('Invalid phone', 'Enter a valid 10-digit phone number');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.requestOtp(phone);
      setDemoOtp(res.demo_otp);
      setOtpSent(true);
      setOtpStep('verify');
    } catch {
      Alert.alert('Error', 'Could not send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) {
      Alert.alert('Invalid OTP', 'Enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      await authApi.verifyOtp(phone, otp);
      // After OTP verify, log in using phone + fixed demo password
      await login(DEMO[0].email, DEMO[0].password);
    } catch {
      Alert.alert('Invalid OTP', 'The OTP is incorrect or expired');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (d: typeof DEMO[0]) => {
    setEmail(d.email);
    setPassword(d.password);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logo}>
          <View style={styles.logoIcon}>
            <Ionicons name="heart" size={28} color={Colors.coral500} />
          </View>
          <Text style={styles.logoTitle}>MaternaCare</Text>
          <Text style={styles.logoSubtitle}>ASHA Worker Portal</Text>
        </View>

        {/* Mode toggle */}
        <View style={styles.modeToggle}>
          {(['email', 'otp'] as LoginMode[]).map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => setMode(m)}
              style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
            >
              <Text style={[styles.modeBtnText, mode === m && styles.modeBtnTextActive]}>
                {m === 'email' ? 'Email / Password' : 'Phone OTP'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Email login form */}
        {mode === 'email' && (
          <View style={styles.form}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="••••••••"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPw}
              />
              <TouchableOpacity
                onPress={() => setShowPw(!showPw)}
                style={styles.eyeBtn}
              >
                <Ionicons name={showPw ? 'eye-off' : 'eye'} size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Button label="Sign In" onPress={handleEmailLogin} loading={loading} style={styles.submitBtn} />

            {/* Demo quick fill */}
            <Text style={styles.demoLabel}>Demo accounts</Text>
            <View style={styles.demoRow}>
              {DEMO.map((d) => (
                <TouchableOpacity
                  key={d.label}
                  onPress={() => fillDemo(d)}
                  style={styles.demoChip}
                >
                  <Text style={styles.demoChipText}>{d.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* OTP login form */}
        {mode === 'otp' && (
          <View style={styles.form}>
            {otpStep === 'phone' ? (
              <>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  style={styles.input}
                  placeholder="10-digit mobile number"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
                <Button label="Send OTP" onPress={handleRequestOtp} loading={loading} style={styles.submitBtn} />
              </>
            ) : (
              <>
                <Text style={styles.inputLabel}>Enter OTP</Text>
                <Text style={styles.otpHint}>
                  OTP sent to {phone}
                  {demoOtp ? ` — Demo OTP: ${demoOtp}` : ''}
                </Text>
                <TextInput
                  value={otp}
                  onChangeText={setOtp}
                  style={[styles.input, styles.otpInput]}
                  placeholder="123456"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <Button label="Verify OTP" onPress={handleVerifyOtp} loading={loading} style={styles.submitBtn} />
                <TouchableOpacity onPress={() => setOtpStep('phone')} style={styles.backBtn}>
                  <Text style={styles.backBtnText}>← Change number</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.navy950 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: Spacing.lg },
  logo: { alignItems: 'center', marginBottom: 36 },
  logoIcon: {
    width: 64, height: 64, borderRadius: 18,
    backgroundColor: 'rgba(255,95,61,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,95,61,0.25)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  logoTitle: {
    fontSize: 30, fontWeight: '300', color: Colors.textPrimary,
    fontFamily: Fonts.display,
  },
  logoSubtitle: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.navy800,
    borderRadius: Radius.md,
    padding: 4,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  modeBtn: { flex: 1, paddingVertical: 10, borderRadius: Radius.sm, alignItems: 'center' },
  modeBtnActive: { backgroundColor: Colors.navy700 },
  modeBtnText: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
  modeBtnTextActive: { color: Colors.textPrimary },
  form: { gap: Spacing.sm },
  inputLabel: {
    fontSize: 11, color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.7,
    marginBottom: 4, marginTop: 4,
  },
  input: {
    backgroundColor: Colors.navy900,
    borderWidth: 1, borderColor: Colors.borderMedium,
    borderRadius: Radius.md,
    paddingHorizontal: 16, paddingVertical: 13,
    color: Colors.textPrimary, fontSize: 15,
    marginBottom: 4,
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  eyeBtn: { padding: 12 },
  submitBtn: { marginTop: 8 },
  demoLabel: {
    fontSize: 11, color: Colors.textMuted, textAlign: 'center',
    marginTop: 16, marginBottom: 8,
  },
  demoRow: { flexDirection: 'row', gap: 8 },
  demoChip: {
    flex: 1, paddingVertical: 10, borderRadius: Radius.sm,
    backgroundColor: Colors.navy800, borderWidth: 1, borderColor: Colors.borderSubtle,
    alignItems: 'center',
  },
  demoChipText: { fontSize: 12, color: Colors.textSecondary },
  otpHint: {
    fontSize: 12, color: Colors.jade400,
    backgroundColor: 'rgba(27,191,132,0.08)',
    borderRadius: Radius.sm, padding: 10, marginBottom: 4,
  },
  otpInput: { fontSize: 24, letterSpacing: 8, textAlign: 'center' },
  backBtn: { alignItems: 'center', paddingVertical: 10 },
  backBtnText: { fontSize: 13, color: Colors.coral400 },
});
