import React from 'react';
import { HStack, VStack, Text, Toast, useToast } from '@gluestack-ui/themed';
import Icon, { IconName } from '@/components/Icon';
import { colors, cardShadow } from '@/theme';

/**
 * App-wide confirmation banner - our answer to HeroUI's <Alert>, which is a DOM
 * component and can't run in React Native. gluestack's toast host handles the
 * queue, stacking and auto-dismiss; everything visual below is ours so the
 * banner carries the same warrior geometry as the rest of the app: hard
 * corners, a thick coloured left bar, uppercase title.
 *
 * Colour is the whole signal, so it stays strict:
 *   success - battle gold, the "you earned it" colour
 *   error   - hot orange (crimson is the brand colour, not the failure one)
 *   info    - crimson, for neutral state changes
 */
type ToastVariant = 'success' | 'error' | 'info';

const VARIANTS: Record<ToastVariant, { accent: string; icon: IconName }> = {
  success: { accent: colors.accent, icon: 'checkmark-circle' },
  error: { accent: colors.danger, icon: 'alert-circle' },
  info: { accent: colors.primaryLight, icon: 'help-circle-outline' },
};

export interface AppToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
}

export function useAppToast() {
  const toast = useToast();

  return React.useCallback(
    ({ title, description, variant = 'success' }: AppToastOptions) => {
      const { accent, icon } = VARIANTS[variant];
      toast.show({
        placement: 'top right',
        duration: variant === 'error' ? 4000 : 2500,
        render: ({ id }) => (
          <Toast
            nativeID={`toast-${id}`}
            action={variant === 'error' ? 'error' : 'success'}
            variant="solid"
            bg={colors.surface}
            borderWidth={1}
            borderLeftWidth={4}
            borderColor={colors.border}
            borderLeftColor={accent}
            borderRadius="$xl"
            px="$3"
            py="$3"
            mt="$2"
            minWidth={260}
            maxWidth={360}
            {...cardShadow}
          >
            <HStack space="sm" alignItems="flex-start">
              <Icon name={icon} size={18} color={accent} />
              <VStack flex={1}>
                <Text
                  color="$textDark0"
                  fontSize={13}
                  fontWeight="$black"
                  letterSpacing={0.8}
                  textTransform="uppercase"
                >
                  {title}
                </Text>
                {description && (
                  <Text color={colors.textSecondary} fontSize={12} mt="$0.5">
                    {description}
                  </Text>
                )}
              </VStack>
            </HStack>
          </Toast>
        ),
      });
    },
    [toast]
  );
}
