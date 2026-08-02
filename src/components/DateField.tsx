import React, { useState } from 'react';
import { TextInput } from 'react-native';
import { Box, HStack, VStack, Text } from '@gluestack-ui/themed';
import Icon from '@/components/Icon';
import { colors } from '@/theme';

/**
 * Segmented date entry, matching HeroUI's <DateField> shape - a label, a
 * bordered group with a calendar prefix icon, and separate day / month / year
 * segments rather than one free-text box. HeroUI's own component is DOM-based,
 * so this is a native rebuild of the pattern.
 *
 * Segments are the point: typing "07" into a day box can't produce an
 * ambiguous or unparseable date the way "7/8/25" can, and each segment gets a
 * numeric keypad. Values are clamped on blur rather than while typing, so a
 * half-typed "1" on the way to "15" isn't yanked to "01" under the cursor.
 */
interface Props {
  label: string;
  value: Date;
  onChange: (next: Date) => void;
  /** Blocks days after today - check-ins can be back-dated, never forward. */
  maxToday?: boolean;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function Segment({
  value,
  width,
  maxLength,
  onCommit,
}: {
  value: number;
  width: number;
  maxLength: number;
  onCommit: (raw: string) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? String(value).padStart(maxLength, '0');

  return (
    <TextInput
      value={shown}
      onChangeText={(text) => setDraft(text.replace(/[^0-9]/g, '').slice(0, maxLength))}
      onFocus={() => setDraft('')}
      onBlur={() => {
        if (draft !== null && draft !== '') onCommit(draft);
        setDraft(null);
      }}
      keyboardType="number-pad"
      selectTextOnFocus
      style={{
        width,
        color: colors.textPrimary,
        fontSize: 15,
        fontFamily: 'GeistMono_500Medium',
        textAlign: 'center',
        paddingVertical: 0,
      }}
    />
  );
}

export default function DateField({ label, value, onChange, maxToday = false }: Props) {
  function commit(part: 'day' | 'month' | 'year', raw: string) {
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n)) return;

    const year = part === 'year' ? clamp(n, 2000, 2100) : value.getFullYear();
    const month = part === 'month' ? clamp(n, 1, 12) - 1 : value.getMonth();
    // Clamp the day to the target month so 31 January -> February lands on the
    // 28th/29th instead of silently rolling into March.
    const lastDay = new Date(year, month + 1, 0).getDate();
    const day = clamp(part === 'day' ? n : value.getDate(), 1, lastDay);

    let next = new Date(year, month, day, 12, 0, 0);
    if (maxToday && next.getTime() > Date.now()) next = new Date();
    onChange(next);
  }

  return (
    <VStack space="xs">
      <Text color={colors.textMuted} fontSize={11} fontWeight="$bold" letterSpacing={1} textTransform="uppercase">
        {label}
      </Text>
      <HStack
        alignItems="center"
        space="xs"
        bg={colors.surfaceAlt}
        borderWidth={1}
        borderColor={colors.border}
        borderRadius="$xl"
        px="$3"
        h={46}
      >
        <Icon name="calendar-outline" size={16} color={colors.textMuted} />
        <HStack alignItems="center">
          <Segment value={value.getDate()} width={26} maxLength={2} onCommit={(raw) => commit('day', raw)} />
          <Text color={colors.textMuted} fontSize={15}>
            /
          </Text>
          <Segment value={value.getMonth() + 1} width={26} maxLength={2} onCommit={(raw) => commit('month', raw)} />
          <Text color={colors.textMuted} fontSize={15}>
            /
          </Text>
          <Segment value={value.getFullYear()} width={46} maxLength={4} onCommit={(raw) => commit('year', raw)} />
        </HStack>
      </HStack>
    </VStack>
  );
}
