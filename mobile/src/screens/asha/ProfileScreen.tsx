import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Card, Divider } from '../../components/ui';
import { Colors, Spacing, Radius } from '../../utils/theme';

export function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => await logout(),
      },
    ]);
  };

  const roleLabels: Record<string, string> = {
    asha: 'ASHA Worker',
    doctor: 'Doctor',
    admin: 'Administrator',
  };

  const menuItems = [
    {
      icon: 'people-outline',
      label: 'My Patients',
      onPress: () => navigation.navigate('Patients'),
    },
    {
      icon: 'notifications-outline',
      label: 'Alerts',
      onPress: () => navigation.navigate('Alerts'),
    },
    {
      icon: 'information-circle-outline',
      label: 'App Version',
      value: '1.0.0',
      onPress: () => {},
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0) ?? '?'}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{roleLabels[user?.role ?? ''] ?? user?.role}</Text>
        </View>
        <Text style={styles.email}>{user?.email}</Text>
        {user?.assigned_villages && user.assigned_villages.length > 0 && (
          <Text style={styles.villages}>
            Villages: {user.assigned_villages.join(', ')}
          </Text>
        )}
      </View>

      {/* Menu */}
      <Card style={styles.menuCard}>
        {menuItems.map((item, i) => (
          <View key={item.label}>
            {i > 0 && <Divider />}
            <TouchableOpacity style={styles.menuItem} onPress={item.onPress}>
              <View style={styles.menuIconWrap}>
                <Ionicons name={item.icon as any} size={18} color={Colors.textSecondary} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <View style={styles.menuRight}>
                {item.value && <Text style={styles.menuValue}>{item.value}</Text>}
                <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
              </View>
            </TouchableOpacity>
          </View>
        ))}
      </Card>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color={Colors.coral500} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.navy950 },
  content: { padding: Spacing.md, paddingBottom: 48 },
  profileCard: {
    alignItems: 'center', paddingVertical: 28,
    backgroundColor: Colors.navy800, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.borderSubtle,
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,95,61,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 30, fontWeight: '300', color: Colors.coral400, fontFamily: 'Georgia' },
  name: { fontSize: 20, fontWeight: '600', color: Colors.textPrimary, fontFamily: 'Georgia' },
  roleBadge: {
    marginTop: 6, paddingHorizontal: 14, paddingVertical: 4,
    backgroundColor: 'rgba(255,95,61,0.1)', borderRadius: Radius.full,
    borderWidth: 1, borderColor: 'rgba(255,95,61,0.25)',
  },
  roleText: { fontSize: 12, color: Colors.coral400, fontWeight: '600' },
  email: { fontSize: 13, color: Colors.textMuted, marginTop: 6 },
  villages: { fontSize: 12, color: Colors.jade400, marginTop: 4 },
  menuCard: { marginBottom: Spacing.md, padding: 0, overflow: 'hidden' },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: Spacing.md,
  },
  menuIconWrap: {
    width: 34, height: 34, borderRadius: Radius.sm,
    backgroundColor: Colors.navy900, alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  menuValue: { fontSize: 13, color: Colors.textMuted },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: Radius.md,
    backgroundColor: 'rgba(255,95,61,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,95,61,0.2)',
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: Colors.coral500 },
});
