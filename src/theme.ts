import { createConfig } from '@gluestack-style/react';
import { FontResolver } from '@gluestack-style/react/lib/commonjs/plugins';
import { config as defaultConfig } from '@gluestack-ui/config';

/**
 * Setwise runs a "warrior" direction: this is a training app, not a wellness
 * app, so the whole system is tuned to read as forceful rather than calm.
 * Three levers carry it, all set here so screens inherit it for free:
 *
 *  1. Colour - blood crimson for action, battle gold reserved for earned
 *     moments (PRs, today's marker). Danger moves to a hot orange because a
 *     crimson primary would otherwise be indistinguishable from an error.
 *  2. Geometry - the radius scale is cut down hard. Every existing
 *     borderRadius="$lg" / "$xl" in the app sharpens automatically; "$full"
 *     stays round for things that are genuinely circular (day cells, badges).
 *  3. Typography - headings are uppercase, Black weight, tight tracking.
 *
 * Fonts match the web dashboard (LiftLog) so both platforms read as one
 * brand: Barlow Condensed carries every Heading, Barlow is the body face,
 * Geist Mono is reserved for numeric readouts (weight, reps, RPE, timer).
 *
 * FontResolver must be registered explicitly: gluestack's default config
 * only ships AnimationResolver, and without the font plugin the token value
 * ("Barlow") reaches React Native verbatim. Expo registers these faces as
 * "Barlow_400Regular" / "BarlowCondensed_900Black", so the bare family name
 * matches nothing and every screen silently falls back to the system font.
 * The plugin rewrites family+weight into those suffixed names, which is why
 * the weights loaded in App.tsx must line up with the weights used here.
 */
export const gluestackConfig = createConfig({
  ...defaultConfig,
  plugins: [...(defaultConfig.plugins ?? []), new FontResolver()],
  tokens: {
    ...defaultConfig.tokens,
    colors: {
      ...defaultConfig.tokens.colors,
      primary0: '#FCEAEC',
      primary50: '#F6CED2',
      primary100: '#EDA7AE',
      primary200: '#E37D88',
      primary300: '#D75261',
      primary400: '#C22F3E',
      primary500: '#A31621',
      primary600: '#89121B',
      primary700: '#6D0E16',
      primary800: '#500A10',
      primary900: '#33060A',
      primary950: '#1A0305',
    },
    radii: {
      ...defaultConfig.tokens.radii,
      xs: 0,
      sm: 2,
      md: 3,
      lg: 4,
      xl: 6,
      '2xl': 8,
      '3xl': 10,
    },
    fonts: {
      ...defaultConfig.tokens.fonts,
      heading: 'Barlow Condensed',
      body: 'Barlow',
      mono: 'Geist Mono',
    },
  },
  components: {
    ...defaultConfig.components,
    Heading: {
      ...defaultConfig.components.Heading,
      theme: {
        ...defaultConfig.components.Heading.theme,
        fontWeight: '$black',
        letterSpacing: '$sm',
        textTransform: 'uppercase',
      },
    },
  },
});

/** Hard-edged elevation - deeper and tighter than a soft material shadow. */
export const cardShadow = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.5,
  shadowRadius: 6,
  elevation: 6,
} as const;

// Standalone tokens for places that can't consume gluestack style props
// directly (LinearGradient colors, React Navigation's tabBar theme, SVG
// fills, StyleSheet fallbacks).
export const colors = {
  bg: '#0A0908',
  surface: '#14110F',
  surfaceAlt: '#1B1714',
  border: '#332C26',
  primary: '#A31621',
  primaryLight: '#D62839',
  accent: '#D4AF37',
  accentSoft: '#E8CE7A',
  danger: '#FF6B35',
  textPrimary: '#FFFFFF',
  textSecondary: '#C9C0B6',
  textMuted: '#8A8078',
};

export const gradients = {
  primary: [colors.primary, colors.primaryLight] as const,
  accent: [colors.accent, colors.accentSoft] as const,
};
