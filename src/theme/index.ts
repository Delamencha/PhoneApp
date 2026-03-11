// Theme constants for Idea Bubble App

export const Colors = {
  // Primary
  primary: '#4A90D9',
  primaryLight: '#7AB5E8',
  primaryDark: '#2E6DB4',

  // Background
  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceVariant: '#EEF1F5',

  // Text
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textOnPrimary: '#FFFFFF',

  // Sidebar
  sidebarBg: '#2C3E50',
  sidebarActive: '#4A90D9',
  sidebarText: '#FFFFFF',
  sidebarTextInactive: '#94A3B8',

  // Bubble time-based colors (keyframes)
  bubbleNew: '#FFFFFF',       // t=0, just created
  bubbleDay: '#FFF8E1',       // t~1 day, light yellow
  bubbleWeek: '#FF9800',      // t~1 week, orange
  bubbleOld: '#F44336',       // t>=2 weeks, red

  // Accents
  danger: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',

  // Misc
  border: '#E5E7EB',
  shadow: '#000000',
  overlay: 'rgba(0,0,0,0.5)',
  placeholder: '#D1D5DB',
};

export const Typography = {
  titleLarge: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
  },
  titleMedium: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: Colors.textPrimary,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: Colors.textPrimary,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400' as const,
    color: Colors.textSecondary,
  },
  caption: {
    fontSize: 10,
    fontWeight: '500' as const,
    color: Colors.textTertiary,
  },
  bubbleLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Shadow = {
  small: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

// Completion status visual config (keyed by CompletionStatus enum value)
export const CompletionColors: Record<number, string> = {
  1: '#EF4444', // Cancelled – red
  2: '#F97316', // Not worth the cost – orange
  3: '#EAB308', // Replaced / encompassed – yellow
  4: '#3B82F6', // Done, average feedback – blue
  5: '#10B981', // Done, great feedback – green
};

export const CompletionLabels: Record<number, string> = {
  1: 'Cancelled',
  2: 'Not worth it',
  3: 'Replaced',
  4: 'Done, OK',
  5: 'Done, Great',
};

// Bubble sizing constants
export const BubbleConfig = {
  minRadius: 28,       // minimum bubble radius in dp
  maxRadius: 70,       // maximum bubble radius in dp (before auto-scale)
  packingDensity: 0.60, // target packing density (60% of screen area)
  sidebarWidth: 52,    // left sidebar width in dp
  fabSize: 56,         // FAB button size
  fabMargin: 16,       // FAB margin from edges
};
