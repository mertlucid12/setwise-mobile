import React from 'react';
import { Button, ButtonText, HStack, Spinner } from '@gluestack-ui/themed';
import Icon, { IconName } from '@/components/Icon';
import { colors, cardShadow } from '@/theme';

/**
 * The app's button vocabulary, mirroring HeroUI's variant set (primary /
 * secondary / tertiary / danger, optional leading icon) so a web mock made
 * with it maps one-to-one onto a screen here. HeroUI itself is DOM + Tailwind
 * and can't render in React Native, so this is a native rebuild rather than a
 * wrapper - the API is what carries over, not the code.
 *
 * Variants are semantic, not decorative:
 *   primary   - the one thing the screen wants you to do (crimson fill)
 *   secondary - a real alternative (outlined, gold)
 *   tertiary  - low-stakes, mostly navigation (bare text)
 *   danger    - destructive, always orange so it can't be confused with the
 *               crimson primary
 */
export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const HEIGHTS: Record<ButtonSize, number> = { sm: 36, md: 46, lg: 54 };
const FONT_SIZES: Record<ButtonSize, number> = { sm: 12, md: 14, lg: 15 };
const ICON_SIZES: Record<ButtonSize, number> = { sm: 14, md: 16, lg: 19 };

interface Props {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  isDisabled?: boolean;
  isLoading?: boolean;
  /** Buttons are inline-width by default; stretch to fill the row instead. */
  full?: boolean;
}

export default function AppButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  isDisabled = false,
  isLoading = false,
  full = false,
}: Props) {
  const height = HEIGHTS[size];

  const skin = {
    primary: { bg: colors.primary, border: colors.primary, content: '#FFFFFF', shadow: true },
    secondary: { bg: 'transparent', border: colors.accent, content: colors.accent, shadow: false },
    tertiary: { bg: 'transparent', border: 'transparent', content: colors.textSecondary, shadow: false },
    danger: { bg: 'transparent', border: colors.danger, content: colors.danger, shadow: false },
  }[variant];

  return (
    <Button
      onPress={onPress}
      isDisabled={isDisabled || isLoading}
      h={height}
      px={variant === 'tertiary' ? '$2' : '$4'}
      bg={skin.bg}
      borderWidth={1}
      borderColor={skin.border}
      borderRadius="$xl"
      opacity={isDisabled ? 0.45 : 1}
      alignSelf={full ? 'stretch' : 'flex-start'}
      {...(skin.shadow ? cardShadow : {})}
    >
      <HStack alignItems="center" space="xs">
        {isLoading ? (
          <Spinner size="small" color={skin.content} />
        ) : (
          icon && <Icon name={icon} size={ICON_SIZES[size]} color={skin.content} />
        )}
        <ButtonText
          color={skin.content}
          fontSize={FONT_SIZES[size]}
          fontWeight="$black"
          letterSpacing={1.2}
          textTransform="uppercase"
        >
          {label}
        </ButtonText>
      </HStack>
    </Button>
  );
}
