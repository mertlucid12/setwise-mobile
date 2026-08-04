import React from 'react';
import { Box, VStack, HStack, Text } from '@gluestack-ui/themed';
import Icon from '@/components/Icon';
import WarriorCard from '@/components/WarriorCard';
import { NutritionTargets, MissingNutritionInput } from '@/services/nutrition';
import { useI18n } from '@/i18n';
import { colors } from '@/theme';

interface Props {
  targets: NutritionTargets | null;
  missing: MissingNutritionInput[];
}

const MISSING_LABEL_KEY: Record<MissingNutritionInput, string> = {
  weight: 'nutrition.needWeight',
  height: 'nutrition.needHeight',
  birthDate: 'nutrition.needBirthDate',
  gender: 'nutrition.needGender',
  activityLevel: 'nutrition.needActivity',
  goal: 'nutrition.needGoal',
};

function Macro({ label, grams, tint }: { label: string; grams: number; tint: string }) {
  return (
    <VStack flex={1} alignItems="center" space="xs">
      <Text color={tint} fontSize={18} fontWeight="$extrabold" fontFamily="$mono">
        {grams}
      </Text>
      <Text color={colors.textMuted} fontSize={9} fontWeight="$bold" letterSpacing={1} textTransform="uppercase">
        {label}
      </Text>
    </VStack>
  );
}

/**
 * Daily calorie and macro targets, with the working shown.
 *
 * A bare number invites the user to either trust it blindly or dismiss it, so
 * the resting rate and maintenance figures it was built from stay visible -
 * the same reason the load suggestion explains itself rather than just naming
 * a weight. When an input is missing it says which one instead of falling back
 * to an assumed age or sex, because a confident wrong target is worse than no
 * target at all.
 */
export default function NutritionTargetsCard({ targets, missing }: Props) {
  const { t } = useI18n();

  if (!targets) {
    return (
      <WarriorCard cut={14}>
        <VStack space="xs">
          <HStack alignItems="center" space="xs">
            <Icon name="flame" size={14} color={colors.textMuted} />
            <Text color={colors.textMuted} fontSize={11} fontWeight="$bold" letterSpacing={1.2} textTransform="uppercase">
              {t('nutrition.title')}
            </Text>
          </HStack>
          <Text color={colors.textSecondary} fontSize={12}>
            {t('nutrition.incomplete')}
          </Text>
          <VStack space="xs" mt="$1">
            {missing.map((key) => (
              <HStack key={key} alignItems="center" space="xs">
                <Box w={4} h={4} bg={colors.statusWarm} />
                <Text color={colors.textMuted} fontSize={11}>
                  {t(MISSING_LABEL_KEY[key])}
                </Text>
              </HStack>
            ))}
          </VStack>
        </VStack>
      </WarriorCard>
    );
  }

  return (
    <WarriorCard cut={14}>
      <VStack space="sm">
        <HStack alignItems="center" space="xs">
          <Icon name="flame" size={14} color={colors.statusReady} />
          <Text color={colors.accent} fontSize={11} fontWeight="$bold" letterSpacing={1.2} textTransform="uppercase">
            {t('nutrition.title')}
          </Text>
        </HStack>

        <HStack alignItems="baseline" space="xs">
          <Text color="$textDark0" fontSize={34} fontWeight="$extrabold" fontFamily="$mono">
            {targets.target}
          </Text>
          <Text color={colors.textMuted} fontSize={12} fontFamily="$mono">
            {t('nutrition.kcalPerDay')}
          </Text>
        </HStack>

        <HStack
          space="md"
          pt="$3"
          pb="$3"
          borderTopWidth={1}
          borderBottomWidth={1}
          borderColor={colors.border}
        >
          <Macro label={t('nutrition.protein')} grams={targets.proteinG} tint={colors.statusHot} />
          <Macro label={t('nutrition.carbs')} grams={targets.carbsG} tint={colors.statusWarm} />
          <Macro label={t('nutrition.fat')} grams={targets.fatG} tint={colors.statusReady} />
        </HStack>

        {/* The working, so the number can be argued with rather than obeyed. */}
        <VStack space="xs">
          <HStack justifyContent="space-between">
            <Text color={colors.textMuted} fontSize={11}>
              {t('nutrition.bmr')}
            </Text>
            <Text color={colors.textSecondary} fontSize={11} fontFamily="$mono">
              {targets.bmr} {t('nutrition.kcal')}
            </Text>
          </HStack>
          <HStack justifyContent="space-between">
            <Text color={colors.textMuted} fontSize={11}>
              {t('nutrition.maintenance')}
            </Text>
            <Text color={colors.textSecondary} fontSize={11} fontFamily="$mono">
              {targets.maintenance} {t('nutrition.kcal')}
            </Text>
          </HStack>
          <Text color={colors.textMuted} fontSize={10} mt="$1">
            {t('nutrition.basis', { age: targets.age })}
          </Text>
        </VStack>
      </VStack>
    </WarriorCard>
  );
}
