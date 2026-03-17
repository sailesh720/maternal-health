import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import { LoadingScreen } from '../components/ui';
import { Colors } from '../utils/theme';

// Screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { DashboardScreen } from '../screens/asha/DashboardScreen';
import { PatientListScreen } from '../screens/asha/PatientListScreen';
import { PatientDetailScreen } from '../screens/asha/PatientDetailScreen';
import { NewPatientScreen } from '../screens/asha/NewPatientScreen';
import { LogVisitScreen } from '../screens/asha/LogVisitScreen';
import { AlertsScreen } from '../screens/asha/AlertsScreen';
import { ProfileScreen } from '../screens/asha/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: Colors.navy900 },
  headerTintColor: Colors.textPrimary,
  headerTitleStyle: { fontWeight: '600' as const, fontSize: 16 },
  headerBackTitleVisible: false,
  cardStyle: { backgroundColor: Colors.navy950 },
};

// ── Patients stack ────────────────────────────────
function PatientsStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="PatientList" component={PatientListScreen} options={{ title: 'Patients' }} />
      <Stack.Screen name="PatientDetail" component={PatientDetailScreen} options={{ title: 'Patient Profile' }} />
      <Stack.Screen name="NewPatient" component={NewPatientScreen} options={{ title: 'Register Patient' }} />
      <Stack.Screen name="LogVisit" component={LogVisitScreen} options={{ title: 'Log Visit' }} />
    </Stack.Navigator>
  );
}

// ── Dashboard stack ───────────────────────────────
function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Home" component={DashboardScreen} options={{ title: 'MaternaCare' }} />
      <Stack.Screen name="PatientDetail" component={PatientDetailScreen} options={{ title: 'Patient Profile' }} />
      <Stack.Screen name="Patients" component={PatientListScreen} options={{ title: 'Patients' }} />
      <Stack.Screen name="Alerts" component={AlertsScreen} options={{ title: 'Alerts' }} />
    </Stack.Navigator>
  );
}

// ── Main tab navigator ────────────────────────────
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.navy900,
          borderTopColor: Colors.borderSubtle,
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 60,
        },
        tabBarActiveTintColor: Colors.coral500,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, marginBottom: 2 },
        tabBarIcon: ({ color, size, focused }) => {
          const icons: Record<string, [string, string]> = {
            Dashboard: ['home', 'home-outline'],
            Patients:  ['people', 'people-outline'],
            Alerts:    ['notifications', 'notifications-outline'],
            Profile:   ['person-circle', 'person-circle-outline'],
          };
          const [active, inactive] = icons[route.name] ?? ['help-circle', 'help-circle-outline'];
          return <Ionicons name={(focused ? active : inactive) as any} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardStack} options={{ title: 'Home' }} />
      <Tab.Screen name="Patients"  component={PatientsStack}  options={{ title: 'Patients' }} />
      <Tab.Screen name="Alerts"    component={AlertsScreen}   options={{
        title: 'Alerts',
        headerShown: true,
        headerStyle: { backgroundColor: Colors.navy900 },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: { fontWeight: '600' as const },
      }} />
      <Tab.Screen name="Profile"   component={ProfileScreen}  options={{
        title: 'Profile',
        headerShown: true,
        headerStyle: { backgroundColor: Colors.navy900 },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: { fontWeight: '600' as const },
      }} />
    </Tab.Navigator>
  );
}

// ── Root navigator ────────────────────────────────
export function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <Stack.Screen name="Main" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
