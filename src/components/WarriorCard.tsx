import React from 'react';
import { Box } from '@gluestack-ui/themed';
import { colors, cardShadow } from '@/theme';

/**
 * The armour-plate card: a rectangle with its top-right corner cut away at
 * 45 degrees. It's the signature shape of the "Iron Discipline" reference and
 * the reason the surface reads as machined equipment rather than a rounded
 * content box.
 *
 * CSS does this with `clip-path`, which React Native has no equivalent for.
 * The trick here is a square rotated 45 degrees and centred exactly on the
 * corner: the half that overlaps the card paints it out in the page colour,
 * leaving a clean diagonal, and one of the square's own borders becomes the
 * bevel line along that diagonal.
 *
 * `pageBg` therefore has to match whatever sits behind the card, since the
 * notch is painted, not cut. It defaults to the app background.
 */
interface Props {
  children: React.ReactNode;
  /** Length of the diagonal cut. 0 renders a plain rectangle. */
  cut?: number;
  /** Colour behind the card - the notch is painted in it. */
  pageBg?: string;
  bg?: string;
  borderColor?: string;
  padding?: number;
  /** Adds the 1px top highlight that suggests a milled edge. */
  beveled?: boolean;
  flex?: number;
  mb?: number;
}

export default function WarriorCard({
  children,
  cut = 18,
  pageBg = colors.bg,
  bg = colors.surface,
  borderColor = colors.border,
  padding = 14,
  beveled = true,
  flex,
  mb,
}: Props) {
  return (
    <Box
      flex={flex}
      mb={mb}
      bg={bg}
      borderWidth={1}
      borderColor={borderColor}
      // The top border is the bevel highlight when asked for, otherwise it
      // stays the same hairline as the other three sides.
      borderTopColor={beveled ? 'rgba(255, 255, 255, 0.07)' : borderColor}
      p={padding}
      position="relative"
      overflow="hidden"
      {...cardShadow}
    >
      {children}

      {cut > 0 && (
        <Box
          position="absolute"
          top={-cut}
          right={-cut}
          w={cut * 2}
          h={cut * 2}
          bg={pageBg}
          borderBottomWidth={1}
          borderBottomColor={borderColor}
          style={{ transform: [{ rotate: '45deg' }] }}
          pointerEvents="none"
        />
      )}
    </Box>
  );
}
