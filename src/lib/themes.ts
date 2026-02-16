// Theme types
export type Theme = 'ocean' | 'elite' | 'default';

export interface ThemeConfig {
  name: string;
  description: string;
  colors: {
    primary: string;
    primaryDark: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    surfaceElevated: string;
    text: string;
    textMuted: string;
    border: string;
    success: string;
    warning: string;
    danger: string;
  };
}

export const themes: Record<Theme, ThemeConfig> = {
  default: {
    name: 'Default',
    description: 'Classic red and white Hong Kong style',
    colors: {
      primary: '#dc2626',
      primaryDark: '#991b1b',
      secondary: '#f3f4f6',
      accent: '#fbbf24',
      background: '#f3f4f6',
      surface: '#ffffff',
      surfaceElevated: '#ffffff',
      text: '#111827',
      textMuted: '#6b7280',
      border: '#e5e7eb',
      success: '#16a34a',
      warning: '#f59e0b',
      danger: '#dc2626',
    },
  },
  ocean: {
    name: 'Ocean Professional',
    description: 'Clean teal and blue gradient with professional feel',
    colors: {
      primary: '#0d9488',
      primaryDark: '#0f766e',
      secondary: '#f0fdfa',
      accent: '#14b8a6',
      background: 'linear-gradient(180deg, #f0fdfa 0%, #ccfbf1 50%, #99f6e4 100%)',
      surface: 'rgba(255, 255, 255, 0.9)',
      surfaceElevated: '#ffffff',
      text: '#134e4a',
      textMuted: '#5eead4',
      border: '#99f6e4',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
    },
  },
  elite: {
    name: 'Dark Elite',
    description: 'Sophisticated dark mode with gold accents',
    colors: {
      primary: '#f59e0b',
      primaryDark: '#d97706',
      secondary: '#1f2937',
      accent: '#fbbf24',
      background: '#0f172a',
      surface: 'rgba(31, 41, 55, 0.8)',
      surfaceElevated: '#1f2937',
      text: '#f9fafb',
      textMuted: '#9ca3af',
      border: '#374151',
      success: '#22c55e',
      warning: '#f59e0b',
      danger: '#ef4444',
    },
  },
};
