import React, { useEffect, useState } from 'react';
import { Keyboard, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Input,
  InputField,
  Button,
  ButtonText,
  Pressable,
  Spinner,
  SafeAreaView,
} from '@gluestack-ui/themed';
import Icon from '@/components/Icon';
import { useAppToast } from '@/components/AppToast';
import CheckboxGroup from '@/components/CheckboxGroup';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import AnimatedBackground from '@/components/AnimatedBackground';
import { useI18n } from '@/i18n';
import { colors, cardShadow } from '@/theme';
import { ExperienceLevel, Gender, MainGoal } from '@/types';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { t, lang, setLang } = useI18n();
  const { session, signOut } = useAuth();
  const { profile, loading, saveProfile } = useProfile();
  const toast = useAppToast();

  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [goalWeight, setGoalWeight] = useState('');

  useEffect(() => {
    setDisplayName(profile.displayName ?? '');
    setGoalWeight(profile.goalWeightKg != null ? String(profile.goalWeightKg) : '');
  }, [profile]);

  async function handleSave() {
    Keyboard.dismiss();
    const next = displayName.trim() || null;
    if (next === (profile.displayName ?? null)) return;

    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await saveProfile({ ...profile, displayName: displayName.trim() || null });
      setSaved(true);
      toast({ title: t('toast.profileSaved') });
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('profile.errSave');
      setError(message);
      toast({ title: t('toast.error'), description: message, variant: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function updateTrainingProfile(patch: Partial<{ gender: Gender; mainGoal: MainGoal; experienceLevel: ExperienceLevel }>) {
    // Re-picking the answer you already had isn't a change, so it neither
    // hits the network nor announces anything.
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

  async function handleSignOut() {
    await signOut();
    toast({ title: t('toast.signedOut'), variant: 'info' });
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <Box flex={1} bg="$backgroundDark950" alignItems="center" justifyContent="center">
          <Spinner color="$primary400" />
        </Box>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Box flex={1} bg="$backgroundDark950">
        <AnimatedBackground />
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <Box px="$4" pt="$4" pb="$8">
            <Text color={colors.accent} fontSize={12} fontWeight="$bold" letterSpacing={1.2} textTransform="uppercase">
              {t('profile.account')}
            </Text>
            <Heading color="$textDark0" size="xl" mb="$1">
              {t('profile.title')}
            </Heading>
            <Text color="$textDark500" size="sm" mb="$5">
              {session?.user.email}
            </Text>

            <Box bg="$backgroundDark900" borderWidth={1} borderColor="$borderDark800" borderRadius="$xl" p="$4" mb="$4" {...cardShadow}>
              <VStack space="md">
                <VStack space="xs">
                  <Text color="$textDark400" size="xs">
                    {t('profile.name')}
                  </Text>
                  <Input variant="outline" size="md" borderColor="$borderDark700" borderRadius="$lg" bg="$backgroundDark800">
                    <InputField
                      placeholder={t('profile.namePlaceholder')}
                      placeholderTextColor={colors.textMuted}
                      color="$textDark0"
                      value={displayName}
                      onChangeText={setDisplayName}
                    />
                  </Input>
                </VStack>

                {error && (
                  <Text color={colors.danger} size="sm">
                    {error}
                  </Text>
                )}

                <Button borderRadius="$lg" bg="$primary500" onPress={handleSave} isDisabled={saving}>
                  <ButtonText>{saving ? '...' : saved ? t('common.saved') : t('common.save')}</ButtonText>
                </Button>
              </VStack>
            </Box>

            <Box bg="$backgroundDark900" borderWidth={1} borderColor="$borderDark800" borderRadius="$xl" p="$4" mb="$4" {...cardShadow}>
              <HStack alignItems="center" justifyContent="space-between">
                <Text color="$textDark0" fontWeight="$bold" size="sm">
                  {t('profile.language')}
                </Text>
                <HStack bg="$backgroundDark800" borderRadius="$full" p={2} space="xs">
                  {(['en', 'tr'] as const).map((code) => (
                    <Pressable
                      key={code}
                      onPress={() => setLang(code)}
                      bg={lang === code ? '$primary500' : 'transparent'}
                      borderRadius="$full"
                      px="$3"
                      py="$1"
                    >
                      <Text
                        color={lang === code ? '$textDark0' : '$textDark500'}
                        size="xs"
                        fontWeight={lang === code ? '$bold' : '$medium'}
                      >
                        {code.toUpperCase()}
                      </Text>
                    </Pressable>
                  ))}
                </HStack>
              </HStack>
            </Box>

            <Box bg="$backgroundDark900" borderWidth={1} borderColor="$borderDark800" borderRadius="$xl" p="$4" mb="$4" {...cardShadow}>
              <Text color="$textDark0" fontWeight="$bold" size="sm" mb="$3">
                {t('profile.trainingProfile')}
              </Text>
              <VStack space="md">
                {/* These are questions, not tags, and each answer carries a
                    line of explanation - so they read as a checkbox list
                    rather than a chip row. */}
                <CheckboxGroup<Gender>
                  label={t('profile.gender')}
                  value={profile.gender}
                  onChange={(v) => updateTrainingProfile({ gender: v })}
                  options={[
                    { key: 'male', label: t('onboarding.male') },
                    { key: 'female', label: t('onboarding.female') },
                    { key: 'unspecified', label: t('onboarding.unspecified') },
                  ]}
                />

                <CheckboxGroup<MainGoal>
                  label={t('profile.mainGoal')}
                  value={profile.mainGoal}
                  onChange={(v) => updateTrainingProfile({ mainGoal: v })}
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
                  onChange={(v) => updateTrainingProfile({ experienceLevel: v })}
                  options={[
                    { key: 'beginner', label: t('onboarding.beginner'), description: t('onboarding.beginnerDesc') },
                    { key: 'intermediate', label: t('onboarding.intermediate'), description: t('onboarding.intermediateDesc') },
                    { key: 'advanced', label: t('onboarding.advanced'), description: t('onboarding.advancedDesc') },
                  ]}
                />

                <VStack space="xs">
                  <Text color="$textDark400" size="xs">
                    {t('profile.goalWeight')}
                  </Text>
                  <Input variant="outline" size="md" borderColor="$borderDark700" borderRadius="$lg" bg="$backgroundDark800">
                    <InputField
                      placeholder="72"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      color="$textDark0"
                      value={goalWeight}
                      onChangeText={setGoalWeight}
                      onBlur={handleGoalWeightBlur}
                    />
                  </Input>
                </VStack>
              </VStack>
            </Box>

            <Pressable
              onPress={() => navigation.navigate('BodyTracking' as never)}
              bg="$backgroundDark900"
              borderWidth={1}
              borderColor="$borderDark800"
              borderRadius="$xl"
              p="$4"
              mb="$4"
              flexDirection="row"
              alignItems="center"
              {...cardShadow}
            >
              <Box
                w={40}
                h={40}
                borderRadius="$full"
                bg="$backgroundDark800"
                borderWidth={1}
                borderColor={colors.accent}
                alignItems="center"
                justifyContent="center"
                mr="$3"
              >
                <Icon name="body-outline" size={19} color={colors.primaryLight} />
              </Box>
              <VStack flex={1}>
                <Text color="$textDark0" fontWeight="$bold" size="sm">
                  {t('profile.bodyTracking')}
                </Text>
                <Text color="$textDark500" size="xs">
                  {t('profile.bodyTrackingSub')}
                </Text>
              </VStack>
              <Icon name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>

            <Pressable
              onPress={handleSignOut}
              bg="$backgroundDark900"
              borderWidth={1}
              borderColor="$borderDark800"
              borderRadius="$xl"
              p="$4"
              flexDirection="row"
              alignItems="center"
            >
              <Icon name="log-out-outline" size={18} color={colors.danger} />
              <Text color={colors.danger} fontWeight="$semibold" size="sm" ml="$2">
                {t('profile.signOut')}
              </Text>
            </Pressable>
          </Box>
        </ScrollView>
      </Box>
    </SafeAreaView>
  );
}
