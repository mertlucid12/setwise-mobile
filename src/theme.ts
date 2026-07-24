import { createConfig } from '@gluestack-style/react';
import { config as defaultConfig } from '@gluestack-ui/config';

/**
 * Setwise brand ramp (forest green) replaces gluestack's default blue
 * "primary" scale, so every themed component (Button, Badge, focus rings,
 * Progress) picks up the brand color automatically. Everything else
 * (backgroundDark*, borderDark*, textDark*) keeps gluestack's default dark
 * palette, which is already a polished neutral scale.
 *
 * Font pairing matches the web dashboard (LiftLog's app/layout.tsx) so the
 * brand looks like one product across platforms: Barlow Condensed (bold
 * condensed, athletic/scoreboard face) carries every Heading; Barlow is the
 * body face. Geist Mono is reserved for numeric readouts (weight, reps,
 * RPE, rest timer) - applied per-instance via fontFamily="$mono" rather
 * than as a global default. Weights loaded in App.tsx must match these
 * names exactly (gluestack's font resolver appends "_{weight}{WeightName}"
 * to match @expo-google-fonts export names).
 */
export const gluestackConfig = createConfig({
  ...defaultConfig,
  tokens: {
    ...defaultConfig.tokens,
    colors: {
      ...defaultConfig.tokens.colors,
      primary0: '#EAF3EC',
      primary50: '#D3E6D8',
      primary100: '#B3D6BC',
      primary200: '#8FC49D',
      primary300: '#6BAF7E',
      primary400: '#4C8C5C',
      primary500: '#2F5D3A',
      primary600: '#264C30',
      primary700: '#1D3B26',
      primary800: '#152B1B',
      primary900: '#0D1B11',
      primary950: '#070F09',
    },
    fonts: {
      ...defaultConfig.tokens.fonts,
      heading: 'Barlow Condensed',
      body: 'Barlow',
      mono: 'Geist Mono',
    },
  },
});

/** Subtle elevation for primary card surfaces - spread onto a Box's props. */
export const cardShadow = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 4,
} as const;

// Standalone tokens for places that can't consume gluestack's style props
// directly (LinearGradient colors, React Navigation's tabBar theme, RN
// Modal/StyleSheet fallbacks).
export const colors = {
  bg: '#0E0E0E',
  surface: '#171613',
  surfaceAlt: '#1C1B19',
  border: '#2A2823',
  primary: '#2F5D3A',
  primaryLight: '#4C8C5C',
  accent: '#D4AF37',
  accentSoft: '#E8CE7A',
  danger: '#E0725C',
  textPrimary: '#FFFFFF',
  textSecondary: '#C7C0AF',
  textMuted: '#8A8578',
};

export const gradients = {
  primary: [colors.primary, colors.primaryLight] as const,
  accent: [colors.accent, colors.accentSoft] as const,
};
