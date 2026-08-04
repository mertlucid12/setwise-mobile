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
 *  2. Geometry - the radius scale is zero. Every existing borderRadius="$lg"
 *     / "$xl" in the app renders as a hard corner; "$full" stays round for
 *     things that are genuinely circular (day cells, avatars, badges). Sharp
 *     edges are the "Iron Discipline" reference's central rule and the
 *     cheapest way to stop reading as a mainstream wellness app.
 *  3. Typography - headings are uppercase, condensed and heavy, tight
 *     tracking.
 *
 * Type follows the same reference: Anton carries every Heading (single 400
 * weight - see the Heading override below), Hanken Grotesk is the body face,
 * and JetBrains Mono is reserved for numeric readouts (weight, reps, RPE,
 * timer) because a monospaced figure reads as measured rather than written.
 *
 * FontResolver must be registered explicitly: gluestack's default config
 * only ships AnimationResolver, and without the font plugin the token value
 * ("Hanken Grotesk") reaches React Native verbatim. Expo registers these
 * faces as "HankenGrotesk_400Regular" / "JetBrainsMono_700Bold", so the bare
 * family name matches nothing and every screen silently falls back to the
 * system font. The plugin rewrites family+weight into those suffixed names,
 * which is why the weights loaded in App.tsx must line up with the weights
 * used here - and why a weight a family doesn't ship (Anton above 400,
 * JetBrains Mono above 800) must never be asked for.
 */
export const gluestackConfig = createConfig({
  ...defaultConfig,
  plugins: [...(defaultConfig.plugins ?? []), new FontResolver()],
  tokens: {
    ...defaultConfig.tokens,
    colors: {
      ...defaultConfig.tokens.colors,
      // "Iron Discipline" reds. 500 is the action colour every primary
      // button and active chip fills with; the light end is the salmon that
      // carries headings and icons; the dark end is a fill for subtle active
      // states (a chip that is on, a day cell with a session in it).
      primary0: '#FFFEFF',
      primary50: '#FFDAD5',
      primary100: '#FFB4AA',
      primary200: '#FF8A7D',
      primary300: '#FF5449',
      primary400: '#F2251C',
      primary500: '#E6211E',
      primary600: '#C0000B',
      primary700: '#930006',
      primary800: '#690003',
      primary900: '#410001',
      primary950: '#2A0001',
    },

    /**
     * Neutral scales, overridden rather than left to gluestack's defaults.
     *
     * This is load-bearing: most screens were written against
     * $backgroundDark900 / $borderDark700 / $textDark400, and gluestack's
     * defaults for those are cool blue-greys. Restyling only the `colors`
     * export below left more than half the app on the old neutral palette,
     * which is why the new direction didn't visibly land. Re-pointing the
     * tokens converts every one of those call sites at once.
     */
    ...({} as Record<string, never>),
    backgroundDark: {
      0: '#FFFFFF',
      50: '#F5F3F3',
      100: '#E5E2E1',
      200: '#C8C6C5',
      300: '#767575',
      400: '#474746',
      500: '#3A3939',
      600: '#353534',
      700: '#2A2A2A',
      800: '#2A2A2A',
      900: '#201F1F',
      950: '#131313',
    },
    borderDark: {
      0: '#FFFFFF',
      50: '#FFDAD5',
      100: '#FFB4AA',
      200: '#E7BDB7',
      300: '#AE8883',
      400: '#AE8883',
      500: '#8A6B67',
      600: '#7A5A56',
      700: '#5D3F3B',
      800: '#5D3F3B',
      900: '#3A2A27',
      950: '#241A18',
    },
    textDark: {
      0: '#E5E2E1',
      50: '#E5E2E1',
      100: '#FFDAD5',
      200: '#E7BDB7',
      300: '#E7BDB7',
      400: '#E7BDB7',
      500: '#AE8883',
      600: '#8A6B67',
      700: '#5D3F3B',
      800: '#3A2A27',
      900: '#241A18',
      950: '#131313',
    },
    radii: {
      ...defaultConfig.tokens.radii,
      xs: 0,
      sm: 0,
      md: 0,
      lg: 0,
      xl: 0,
      '2xl': 0,
      '3xl': 0,
    },
    fonts: {
      ...defaultConfig.tokens.fonts,
      heading: 'Anton',
      body: 'Hanken Grotesk',
      mono: 'JetBrains Mono',
    },
  },
  components: {
    ...defaultConfig.components,
    Heading: {
      ...defaultConfig.components.Heading,
      theme: {
        ...defaultConfig.components.Heading.theme,
        // Anton ships a single 400 face. Asking for $black here would make
        // FontResolver look for "Anton_900Black", which doesn't exist, and
        // every heading in the app would silently fall back to the system
        // font - the weight is already in the typeface itself.
        fontWeight: '$normal',
        letterSpacing: '$sm',
        textTransform: 'uppercase',
      },
    },
  },
});

/**
 * Depth here is tonal, not atmospheric: surfaces stack in slightly lighter
 * charcoals and the shadow is a tight, near-black offset rather than a soft
 * halo. A blurred drop shadow reads as paper floating on paper, which is the
 * opposite of the machined-plate feel the rest of the system is after.
 */
export const cardShadow = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.65,
  shadowRadius: 2,
  elevation: 4,
} as const;

/**
 * The 1px top highlight that sells a beveled, machined edge. Spread onto a
 * surface that already has a border, it catches light on the top edge the way
 * a milled plate does.
 */
export const bevel = {
  borderTopWidth: 1,
  borderTopColor: 'rgba(255, 255, 255, 0.06)',
} as const;

// Standalone tokens for places that can't consume gluestack style props
// directly (LinearGradient colors, React Navigation's tabBar theme, SVG
// fills, StyleSheet fallbacks).
/**
 * Standalone tokens for places that can't consume gluestack style props
 * (LinearGradient colours, React Navigation's tabBar theme, SVG fills,
 * StyleSheet fallbacks). Values mirror the token scales above.
 *
 * The system runs on exactly two reds and one orange, and each has a job:
 *
 *   primary  (#E6211E) - the action colour. Fills: primary buttons, active
 *                        filter chips, the selected tab, progress segments.
 *   accent   (#FFB4AA) - the highlight. Ink, never fill: headings, kickers,
 *                        icons, the numbers you're meant to read first.
 *   secondary(#FE5F00) - molten orange, reserved for the second category of
 *                        thing (a tag that isn't strength, a live-state
 *                        marker) so it stays meaningful.
 *
 * Surfaces stack in warm-neutral charcoals and every border is the rose-
 * tinted outline - a plain grey border is what made earlier passes read as a
 * generic dark theme rather than this one.
 */
export const colors = {
  bg: '#131313',
  /** Deepest tier - image wells, inputs, anything recessed into a card. */
  well: '#0E0E0E',
  surface: '#201F1F',
  surfaceAlt: '#2A2A2A',
  surfaceHigh: '#353534',
  border: '#5D3F3B',
  /** Brighter outline for elements that need to assert an edge. */
  borderStrong: '#AE8883',
  primary: '#E6211E',
  primaryLight: '#FFB4AA',
  accent: '#FFB4AA',
  accentSoft: '#FFDAD5',
  secondary: '#FE5F00',
  danger: '#FFB4AB',
  textPrimary: '#E5E2E1',
  textSecondary: '#E7BDB7',
  textMuted: '#AE8883',
  /** Text that sits on a primary fill. */
  onPrimary: '#FFFEFF',

  /**
   * Three-stop status ramp, for anything that grades a state from "needs
   * attention" to "where you want to be": muscle recovery, weekly volume
   * against target, and future gauges.
   *
   * These exist because the obvious picks from the palette above do not work
   * for grading. `danger`, `accent` and `primaryLight` all resolve to the same
   * salmon (#FFB4AB / #FFB4AA / #FFB4AA), so a three-state scale built from
   * them renders as one colour. A ramp has to separate on hue *and* lightness
   * to survive a 10px legend dot or a muscle the size of a fingernail, so
   * these step crimson -> ember -> gold with roughly even lightness gaps
   * (L* ~48 / ~65 / ~82) rather than sitting on one hue.
   *
   * Meaning runs hot-to-ready, not hot-to-cold: gold is the earned state the
   * rest of the theme already reserves for PRs, and crimson is the one that
   * wants a decision. All three are forge colours, so the warrior direction
   * holds.
   */
  statusHot: '#E6211E',
  statusWarm: '#FF8A1F',
  statusReady: '#F5C542',
  /** Neutral for "no data yet" - present, but clearly out of the ramp. */
  statusIdle: '#3A3634',
};

export const gradients = {
  primary: [colors.primary, '#930006'] as const,
  accent: [colors.accent, colors.accentSoft] as const,
};
