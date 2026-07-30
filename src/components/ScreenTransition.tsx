import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

/**
 * Bottom-tab screens stay mounted across tab switches (no navigator-level
 * transition like stack screens get), so tabs used to swap instantly. This
 * fades + slides the screen in on every focus for a subtle transition.
 */
export default function ScreenTransition({ children }: { children: React.ReactNode }) {
  const isFocused = useIsFocused();
  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isFocused) return;
    opacity.setValue(0);
    translateY.setValue(10);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [isFocused]);

  return <Animated.View style={{ flex: 1, opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
}

export function withScreenTransition<P extends object>(Screen: React.ComponentType<P>) {
  return function Transitioned(props: P) {
    return (
      <ScreenTransition>
        <Screen {...props} />
      </ScreenTransition>
    );
  };
}
