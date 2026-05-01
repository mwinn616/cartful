export const Colors = {
  background: '#0F0F0F',
  surface: '#1A1A1A',
  accent: '#4ECDC4',
  textPrimary: '#FFFFFF',
  textSecondary: '#888888',
  danger: '#E53E3E',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const Typography = {
  heading: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: Colors.textPrimary,
  },
  body: {
    fontSize: 16,
    fontWeight: 'normal' as const,
    color: Colors.textPrimary,
  },
  caption: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
} as const;

export const Radii = {
  card: 12,
  button: 8,
} as const;
