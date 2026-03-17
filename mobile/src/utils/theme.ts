import { Platform } from 'react-native';

export const Colors = {
  // Core palette
  navy950: '#070d1a',
  navy900: '#0d1629',
  navy800: '#131f3c',
  navy700: '#1a2a52',
  navy600: '#243769',

  coral400: '#ff7c5c',
  coral500: '#ff5f3d',
  coral600: '#e84d2c',

  jade400: '#34d49a',
  jade500: '#1bbf84',

  amber400: '#ffb547',
  amber500: '#f59e0b',

  // Text
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#475569',

  // Borders
  borderSubtle: 'rgba(255,255,255,0.06)',
  borderMedium: 'rgba(255,255,255,0.1)',

  // Risk colors
  riskHigh: '#ff5f3d',
  riskMedium: '#ffb547',
  riskLow: '#1bbf84',
};

export const Fonts = {
  // React Native uses system fonts; we approximate the web aesthetic
  display: Platform.select({ ios: 'Georgia', android: 'serif' }),
  body: Platform.select({ ios: 'System', android: 'sans-serif' }),
  mono: Platform.select({ ios: 'monospace', android: 'monospace' }),
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
};

export function riskColor(level?: string | null): string {
  if (level === 'high') return Colors.riskHigh;
  if (level === 'medium') return Colors.riskMedium;
  return Colors.riskLow;
}

export function riskBg(level?: string | null): string {
  if (level === 'high') return 'rgba(255,95,61,0.12)';
  if (level === 'medium') return 'rgba(255,181,71,0.12)';
  return 'rgba(27,191,132,0.12)';
}
