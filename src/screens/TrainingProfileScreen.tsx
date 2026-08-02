import React, { useEffect, useState } from 'react';
import { Keyboard, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box, VStack, HStack, Heading, Text, Input, InputField, Pressable, Spinner } from '@gluestack-ui/themed';
import Icon from '@/components/Icon';
import CheckboxGroup from '@/components/CheckboxGroup';
import { useAppToast } from '@/components/AppToast';
import { useProfile } from '@/hooks/useProfile';
import { useI18n } from '@/i18n';
import { colors, cardShadow } from '@/theme';
import { ExperienceLevel, Gender, MainGoal } from '@/types';

/**
 * Gender, goal, experience level and goal weight - the answers collected once
 * during onboarding.
 *
 * These lived inline on the profile screen, which meant four long question
 * blocks sat in front of the user every time they opened the tab just to
 * change their name or sign out. They're settings you revisit rarely, so they
 * belong behind a row like body tracking, not in the main column.
 *
 * Every control saves on change; there is no save button because there is no
 * multi-field form to submit - and a re-picked answer that changes nothing is
 * skipped entirely rather than firing a write and a toast.
 */
export default function TrainingProfileScreen() {
  const { t } = useI18n();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { profile, loading, saveProfile } = useProfile();
  const toast = useAppToast();

  const [displayName, setDisplayName] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(profile.displayName ?? '');
    setGoalWeight(profile.goalWeightKg != null ? String(profile.goalWeightKg) : '');
  }, [profile]);

  // Editing your name left the profile tab with the rest of the settings, so
  // it lands here - the one place that still owns "your details". Saves on
  // blur like every other control on this screen; no submit button.
  async function handleNameBlur() {
    Keyboard.dismiss();
    const next = displayName.trim() || null;
    if (next === (profile.displayName ?? null)) return;

    setError(null);
    try {
      await saveProfile({ ...profile, displayName: next });
      toast({ title: t('toast.profileSaved') });
    } catch (err) {
      const message = err instanceof Error ? err.message : t('profile.errSave');
      setError(message);
      toast({ title: t('toast.error'), description: message, variant: 'error' });
    }
  }

  async function update(patch: Partial<{ gender: Gender; mainGoal: MainGoal; experienceLevel: ExperienceLevel }>) {
    const unchanged = (Object.keys(patch) as (keyof typeof patch)[]).every((key) => profile[key] === patch[key]);
    if (unchanged) return;

    setError(null);
    try {
      await saveProfile({ ...profile, ...patch });
      toast({ title: t('toast.profileSaved') });
    } catch (err) {
      const message = err instanceof Error ? err.message : t('profile.errSave');
      setError(message);
      toast({ title: t('toast.error'), description: message, variant: 'error' });
    }
  }

  async function handleGoalWeightBlur() {
    Keyboard.dismiss();
    const next = goalWeight ? parseFloat(goalWeight) : null;
    if (next === profile.goalWeightKg) return;

    setError(null);
    try {
      await saveProfile({ ...profile, goalWeightKg: next });
      toast({ title: t('toast.profileSaved') });
    } catch (err) {
      const message = err instanceof Error ? err.message : t('profile.errSave');
      setError(message);
      toast({ title: t('toast.error'), description: message, variant: 'error' });
    }
  }

  if (loading) {
    return (
      <Box flex={1} bg="transparent" alignItems="center" justifyContent="center">
        <Spinner color="$primary400" />
      </Box>
    );
  }

  return (
    <Box flex={1} bg="transparent" pt={insets.top + 8}>
      <HStack alignItems="center" space="sm" px="$4" mb="$4">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Icon name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <VStack flex={1}>
          <Text color={colors.accent} fontSize={11} fontWeight="$bold" letterSpacing={1.4} textTransform="uppercase">
            {t('profile.account')}
          </Text>
          <Heading color="$textDark0" size="xl">
            {t('profile.trainingProfile')}
          </Heading>
        </VStack>
      </HStack>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <VStack px="$4" pb="$8" space="lg">
          <Text color={colors.textMuted} fontSize={12}>
            {t('profile.trainingProfileHint')}
          </Text>

          <VStack space="xs">
            <Text color={colors.textMuted} fontSize={11} fontWeight="$bold" letterSpacing={1} textTransform="uppercase">
              {t('profile.name')}
            </Text>
            <Input variant="outline" size="md" borderColor={colors.border} borderRadius="$xl" bg={colors.surfaceAlt}>
              <InputField
                placeholder={t('profile.namePlaceholder')}
                placeholderTextColor={colors.textMuted}
                color="$textDark0"
                value={displayName}
                onChangeText={setDisplayName}
                onBlur={handleNameBlur}
              />
            </Input>
          </VStack>

          <CheckboxGroup<Gender>
            label={t('profile.gender')}
            value={profile.gender}
            onChange={(v) => update({ gender: v })}
            options={[
              { key: 'male', label: t('onboarding.male') },
              { key: 'female', label: t('onboarding.female') },
              { key: 'unspecified', label: t('onboarding.unspecified') },
            ]}
          />

          <CheckboxGroup<MainGoal>
            label={t('profile.mainGoal')}
            value={profile.mainGoal}
            onChange={(v) => update({ mainGoal: v })}
            options={[
              { key: 'build_muscle', label: t('onboarding.goalBuildMuscle'), description: t('onboarding.goalBuildMuscleDesc') },
              { key: 'lose_fat', label: t('onboarding.goalLoseFat'), description: t('onboarding.goalLoseFatDesc') },
              { key: 'get_stronger', label: t('onboarding.goalGetStronger'), description: t('onboarding.goalGetStrongerDesc') },
              { key: 'general_fitness', label: t('onboarding.goalGeneralFitness'), description: t('onboarding.goalGeneralFitnessDesc') },
            ]}
          />

          <CheckboxGroup<ExperienceLevel>
            label={t('profile.experienceLevel')}
            value={profile.experienceLevel}
            onChange={(v) => update({ experienceLevel: v })}
            options={[
              { key: 'beginner', label: t('onboarding.beginner'), description: t('onboarding.beginnerDesc') },
              { key: 'intermediate', label: t('onboarding.intermediate'), description: t('onboarding.intermediateDesc') },
              { key: 'advanced', label: t('onboarding.advanced'), description: t('onboarding.advancedDesc') },
            ]}
          />

          <VStack space="xs">
            <Text color={colors.textMuted} fontSize={11} fontWeight="$bold" letterSpacing={1} textTransform="uppercase">
              {t('profile.goalWeight')}
            </Text>
            <Input variant="outline" size="md" borderColor={colors.border} borderRadius="$xl" bg={colors.surfaceAlt}>
              <InputField
                placeholder="72"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                color="$textDark0"
                fontFamily="$mono"
                value={goalWeight}
                onChangeText={setGoalWeight}
                onBlur={handleGoalWeightBlur}
              />
            </Input>
          </VStack>

          {error && (
            <Box bg={colors.surface} borderWidth={1} borderLeftWidth={3} borderColor={colors.border} borderLeftColor={colors.danger} borderRadius="$xl" px="$3" py="$2" {...cardShadow}>
              <Text color={colors.danger} size="sm">
                {error}
              </Text>
            </Box>
          )}
        </VStack>
      </ScrollView>
    </Box>
  );
}
