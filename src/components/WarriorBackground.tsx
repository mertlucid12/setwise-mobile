import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, useWindowDimensions } from 'react-native';

/**
 * Embers drifting up the screen - the forge behind the auth screen.
 *
 * The reference implementation for this used Skia + Reanimated. Neither is a
 * dependency here, and Skia in particular needs a CanvasKit WASM payload on
 * web (where this app also runs), so the same effect is rebuilt on core RN
 * Animated: 30 particles, each looping a single 0->1 driver that feeds
 * translateY and opacity. Both are native-driver properties, so the whole
 * thing animates off the JS thread.
 *
 * Each ember gets its own delay, duration and horizontal drift so they never
 * pulse in lockstep, which is what would give away that it's 30 copies of one
 * animation.
 *
 * Honours the OS reduce-motion setting by not animating at all - a field of
 * moving particles is exactly what that setting exists to switch off.
 */
const EMBER_COUNT = 30;
const RISE_MS = 5000;
const EMBER_COLOR = '#FF9D3D';

interface EmberSpec {
  x: number;
  size: number;
  delay: number;
  duration: number;
  drift: number;
  peakOpacity: number;
}

function Ember({ spec, height }: { spec: EmberSpec; height: number }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(spec.delay),
        Animated.timing(progress, {
          toValue: 1,
          duration: spec.duration,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [progress, spec.delay, spec.duration]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -(height + 40)],
  });
  const translateX = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, spec.drift, 0],
  });
  // Fades in fast, burns out slowly - an ember that appeared at full
  // brightness would read as a dot switching on.
  const opacity = progress.interpolate({
    inputRange: [0, 0.1, 1],
    outputRange: [0, spec.peakOpacity, 0],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: -spec.size,
        left: spec.x,
        width: spec.size,
        height: spec.size,
        borderRadius: spec.size / 2,
        backgroundColor: EMBER_COLOR,
        opacity,
        transform: [{ translateY }, { translateX }],
      }}
    />
  );
}

export default function WarriorBackground() {
  const { width, height } = useWindowDimensions();
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled?.().then((enabled) => {
      if (!cancelled) setReduceMotion(!!enabled);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Keyed off width only: re-rolling the field on every height change would
  // restart every ember when the keyboard opens.
  const embers = useMemo<EmberSpec[]>(
    () =>
      Array.from({ length: EMBER_COUNT }, () => ({
        x: Math.random() * width,
        size: 2 + Math.random() * 3,
        delay: Math.random() * RISE_MS,
        duration: RISE_MS + Math.random() * 3500,
        drift: (Math.random() - 0.5) * 40,
        peakOpacity: 0.35 + Math.random() * 0.45,
      })),
    [width]
  );

  if (reduceMotion) return null;

  return (
    <Animated.View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {embers.map((spec, i) => (
        <Ember key={i} spec={spec} height={height} />
      ))}
    </Animated.View>
  );
}
