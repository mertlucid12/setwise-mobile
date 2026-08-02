import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '@/theme';

/**
 * Catches render crashes anywhere under it. Without one, a thrown error
 * unmounts the whole tree and the user is left staring at a blank screen with
 * nothing to report - which is exactly what the exercise picker crash looked
 * like. Here they get the message and the component stack, which is the
 * difference between "it went white" and a fixable bug report.
 *
 * Deliberately built from bare react-native primitives, not gluestack or the
 * i18n hook: this sits above every provider so it can also catch failures in
 * the providers themselves, and a fallback that needs the thing that just
 * broke is no fallback at all. Its copy stays untranslated for the same
 * reason.
 *
 * Retry just remounts the subtree: enough to recover from a transient render
 * error, and honest about it when the same error throws again immediately.
 */
interface State {
  error: Error | null;
  info: string | null;
}

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Surfaces in the Metro terminal, so the stack is recoverable even if the
    // user only screenshots the screen.
    console.error('[Setwise] render crash:', error, info.componentStack);
    this.setState({ info: info.componentStack ?? null });
  }

  render() {
    const { error, info } = this.state;
    if (!error) return this.props.children;

    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: 64, paddingHorizontal: 20 }}>
        <Text
          style={{
            color: colors.danger,
            fontSize: 12,
            fontWeight: '900',
            letterSpacing: 1.4,
            textTransform: 'uppercase',
          }}
        >
          Something crashed
        </Text>
        <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginTop: 6 }}>
          {error.message || String(error)}
        </Text>

        <ScrollView style={{ flex: 1, marginTop: 12 }}>
          <Text style={{ color: colors.textMuted, fontSize: 11 }}>{info ?? error.stack ?? ''}</Text>
        </ScrollView>

        <TouchableOpacity
          onPress={() => this.setState({ error: null, info: null })}
          style={{
            backgroundColor: colors.primary,
            borderRadius: 6,
            paddingVertical: 14,
            marginBottom: 32,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: 13,
              fontWeight: '900',
              letterSpacing: 1.2,
              textTransform: 'uppercase',
            }}
          >
            Try again
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
}
