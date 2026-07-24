import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, AccessibilityInfo } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { colors } from '@/theme';

const DRIFT_DURATION_MS = 9000;

/**
 * Ambient backdrop for full-screen views - two soft, slowly drifting glows
 * (brand green + gold) behind the content, instead of a flat dead-black
 * background. Built on core RN Animated + react-native-svg (both already
 * dependencies) rather than reanimated, to avoid another native module.
 * Respects the OS reduce-motion setting by rendering the glows statically.
 */
export default function AnimatedBackground() {
  const drift = useRef(new Animated.Value(0)).current;
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

  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: DRIFT_DURATION_MS, useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: DRIFT_DURATION_MS, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [drift, reduceMotion]);

  const greenX = drift.interpolate({ inputRange: [0, 1], outputRange: [0, 26] });
  const greenY = drift.interpolate({ inputRange: [0, 1], outputRange: [0, -20] });
  const goldX = drift.interpolate({ inputRange: [0, 1], outputRange: [0, -22] });
  const goldY = drift.interpolate({ inputRange: [0, 1], outputRange: [0, 18] });

  return (
    <Animated.View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[styles.blob, { top: -70, right: -90 }, { transform: [{ translateX: greenX }, { translateY: greenY }] }]}
      >
        <Svg width={340} height={340} viewBox="0 0 340 340">
          <Defs>
            <RadialGradient id="glowGreen" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={colors.primaryLight} stopOpacity={0.22} />
              <Stop offset="100%" stopColor={colors.primaryLight} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={170} cy={170} r={170} fill="url(#glowGreen)" />
        </Svg>
      </Animated.View>

      <Animated.View
        style={[styles.blob, { bottom: -80, left: -80 }, { transform: [{ translateX: goldX }, { translateY: goldY }] }]}
      >
        <Svg width={300} height={300} viewBox="0 0 300 300">
          <Defs>
            <RadialGradient id="glowGold" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={colors.accent} stopOpacity={0.13} />
              <Stop offset="100%" stopColor={colors.accent} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={150} cy={150} r={150} fill="url(#glowGold)" />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
  },
});
