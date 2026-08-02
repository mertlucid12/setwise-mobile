import React from 'react';
import { HStack, Box } from '@gluestack-ui/themed';
import { colors } from '@/theme';

/**
 * Progress as discrete cells rather than a continuous bar - the battery-gauge
 * readout the reference uses for streaks, weekly quota and fatigue.
 *
 * The point isn't decoration: a smooth bar invites you to read a percentage
 * you can't actually act on, while cells read as countable units ("four of
 * six sessions"), which is what training progress actually is. So the segment
 * count should map to something real - sessions, days, planned workouts - not
 * be picked for looks.
 *
 * A partially filled segment is never drawn: a cell is earned or it isn't.
 */
interface Props {
  /** Cells filled, clamped into range. */
  value: number;
  /** Total cells. Keep this the real denominator. */
  total: number;
  height?: number;
  /** Fill colour for earned cells. */
  tint?: string;
  gap?: number;
}

export default function SegmentedBar({
  value,
  total,
  height = 10,
  tint = colors.primary,
  gap = 3,
}: Props) {
  const safeTotal = Math.max(1, Math.floor(total));
  const filled = Math.max(0, Math.min(safeTotal, Math.floor(value)));

  return (
    <HStack style={{ gap }}>
      {Array.from({ length: safeTotal }, (_, i) => (
        <Box
          key={i}
          flex={1}
          h={height}
          bg={i < filled ? tint : colors.surfaceHigh}
          borderWidth={i < filled ? 0 : 1}
          borderColor={colors.border}
        />
      ))}
    </HStack>
  );
}
