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
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import AnimatedBackground from '@/components/AnimatedBackground';
import { useI18n } from '@/i18n';
import { colors, cardShadow } from '@/theme';
import { ExperienceLevel, Gender, MainGoal } from '@/types';

function ChipGroup<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T | null;
  options: { key: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <HStack flexWrap="wrap">
      {options.map((opt) => (
        <Pressable
          key={opt.key}
          onPress={() => onChange(opt.key)}
          bg={value === opt.key ? '$primary500' : '$backgroundDark800'}
          borderColor={value === opt.key ? '$primary500' : '$borderDark700'}
          borderWidth={1}
          borderRadius="$full"
          px="$3"
          py="$2"
          mr="$2"
          mb="$2"
        >
          <Text color={value === opt.key ? '$textDark0' : '$textDark400'} size="xs" fontWeight={value === opt.key ? '$bold' : '$medium'}>
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </HStack>
  );
}

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { t, lang, setLang } = useI18n();
  const { session, signOut } = useAuth();
  const { profile, loading, saveProfile } = useProfile();

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
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await saveProfile({ ...profile, displayName: displayName.trim() || null });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('profile.errSave'));
    } finally {
      setSaving(false);
    }
  }

  async function updateTrainingProfile(patch: Partial<{ gender: Gender; mainGoal: MainGoal; experienceLevel: ExperienceLevel }>) {
    setError(null);
    try {
      await saveProfile({ ...profile, ...patch });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('profile.errSave'));
    }
  }

  async function handleGoalWeightBlur() {
    const next = goalWeight ? parseFloat(goalWeight) : null;
    if (next === profile.goalWeightKg) return;
    setError(null);
    try {
      await saveProfile({ ...profile, goalWeightKg: next });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('profile.errSave'));
    }
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
                <VStack space="xs">
                  <Text color="$textDark400" size="xs">
                    {t('profile.gender')}
                  </Text>
                  <ChipGroup
                    value={profile.gender}
                    onChange={(v) => updateTrainingProfile({ gender: v })}
                    options={[
                      { key: 'male', label: t('onboarding.male') },
                      { key: 'female', label: t('onboarding.female') },
                      { key: 'unspecified', label: t('onboarding.unspecified') },
                    ]}
                  />
                </VStack>

                <VStack space="xs">
                  <Text color="$textDark400" size="xs">
                    {t('profile.mainGoal')}
                  </Text>
                  <ChipGroup
                    value={profile.mainGoal}
                    onChange={(v) => updateTrainingProfile({ mainGoal: v })}
                    options={[
                      { key: 'build_muscle', label: t('onboarding.goalBuildMuscle') },
                      { key: 'lose_fat', label: t('onboarding.goalLoseFat') },
                      { key: 'get_stronger', label: t('onboarding.goalGetStronger') },
                      { key: 'general_fitness', label: t('onboarding.goalGeneralFitness') },
                    ]}
                  />
                </VStack>

                <VStack space="xs">
                  <Text color="$textDark400" size="xs">
                    {t('profile.experienceLevel')}
                  </Text>
                  <ChipGroup
                    value={profile.experienceLevel}
                    onChange={(v) => updateTrainingProfile({ experienceLevel: v })}
                    options={[
                      { key: 'beginner', label: t('onboarding.beginner') },
                      { key: 'intermediate', label: t('onboarding.intermediate') },
                      { key: 'advanced', label: t('onboarding.advanced') },
                    ]}
                  />
                </VStack>

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
              onPress={signOut}
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
