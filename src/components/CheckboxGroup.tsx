import React from 'react';
import { Box, HStack, VStack, Text, Pressable } from '@gluestack-ui/themed';
import Icon from '@/components/Icon';
import { colors } from '@/theme';

/**
 * Question-and-answer control, shaped after HeroUI's
 * <CheckboxGroup><Checkbox><Label/><Description/> - a group label, then one
 * row per option carrying its own label and optional description. HeroUI is
 * web-only, so this is a native rebuild of the pattern rather than a wrapper.
 *
 * `multiple` switches the semantics honestly: a square box for "pick any", a
 * round one for "pick one". Users read the shape before they read the text, so
 * a round control that accepted several answers would be a lie.
 *
 * Chips work for short mutually-exclusive tags, but onboarding-style questions
 * need room for a sentence of explanation per answer - that's what this is for.
 */
export interface CheckOption<T extends string> {
  key: T;
  label: string;
  description?: string;
}

interface SingleProps<T extends string> {
  label?: string;
  options: CheckOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  multiple?: false;
}

interface MultiProps<T extends string> {
  label?: string;
  options: CheckOption<T>[];
  value: T[];
  onChange: (value: T[]) => void;
  multiple: true;
}

export default function CheckboxGroup<T extends string>(props: SingleProps<T> | MultiProps<T>) {
  const { label, options } = props;
  const multiple = props.multiple === true;

  function isChecked(key: T): boolean {
    return multiple ? (props as MultiProps<T>).value.includes(key) : (props as SingleProps<T>).value === key;
  }

  function toggle(key: T) {
    if (!multiple) {
      (props as SingleProps<T>).onChange(key);
      return;
    }
    const current = (props as MultiProps<T>).value;
    (props as MultiProps<T>).onChange(
      current.includes(key) ? current.filter((k) => k !== key) : [...current, key]
    );
  }

  return (
    <VStack space="xs">
      {label && (
        <Text color={colors.textMuted} fontSize={11} fontWeight="$bold" letterSpacing={1} textTransform="uppercase">
          {label}
        </Text>
      )}
      {options.map((option) => {
        const checked = isChecked(option.key);
        return (
          <Pressable
            key={option.key}
            onPress={() => toggle(option.key)}
            bg={checked ? '#410001' : colors.surfaceAlt}
            borderWidth={1}
            borderColor={checked ? colors.primary : colors.border}
            borderRadius="$xl"
            px="$3"
            py="$3"
          >
            <HStack space="sm" alignItems="center">
              <Box
                w={20}
                h={20}
                borderRadius={multiple ? '$md' : '$full'}
                borderWidth={checked ? 0 : 1.5}
                borderColor={colors.border}
                bg={checked ? colors.primary : 'transparent'}
                alignItems="center"
                justifyContent="center"
              >
                {checked && <Icon name="checkmark" size={13} color="#FFFFFF" strokeWidth={3} />}
              </Box>
              <VStack flex={1}>
                <Text color={checked ? '$textDark0' : colors.textSecondary} size="sm" fontWeight="$bold">
                  {option.label}
                </Text>
                {option.description && (
                  <Text color={colors.textMuted} fontSize={11} mt="$0.5">
                    {option.description}
                  </Text>
                )}
              </VStack>
            </HStack>
          </Pressable>
        );
      })}
    </VStack>
  );
}
