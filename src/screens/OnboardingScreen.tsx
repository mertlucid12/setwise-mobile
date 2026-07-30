import React, { useState } from 'react';
import { Keyboard, ScrollView } from 'react-native';
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
  SafeAreaView,
} from '@gluestack-ui/themed';
import Icon, { IconName } from '@/components/Icon';
import { ExperienceLevel, Gender, MainGoal, Profile } from '@/types';
import AnimatedBackground from '@/components/AnimatedBackground';
import { useI18n } from '@/i18n';
import { colors, cardShadow } from '@/theme';

interface Props {
  profile: Profile;
  saveProfile: (next: Profile) => Promise<void>;
}

const TOTAL_STEPS = 4;

function OptionCard({
  icon,
  title,
  description,
  selected,
  onPress,
}: {
  icon: IconName;
  title: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      bg={selected ? '$primary900' : '$backgroundDark900'}
      borderWidth={1}
      borderColor={selected ? colors.accent : '$borderDark800'}
      borderRadius="$xl"
      p="$4"
      flexDirection="row"
      alignItems="center"
      mb="$3"
      {...cardShadow}
    >
      <Box
        w={40}
        h={40}
        borderRadius="$full"
        bg="$backgroundDark800"
        borderWidth={1}
        borderColor={selected ? colors.accent : '$borderDark700'}
        alignItems="center"
        justifyContent="center"
        mr="$3"
      >
        <Icon name={icon} size={19} color={selected ? colors.accent : colors.primaryLight} />
      </Box>
      <VStack flex={1}>
        <Text color="$textDark0" fontWeight="$bold" size="sm">
          {title}
        </Text>
        {description && (
          <Text color="$textDark500" size="xs">
            {description}
          </Text>
        )}
      </VStack>
      {selected && <Icon name="checkmark-circle" size={20} color={colors.accent} />}
    </Pressable>
  );
}

export default function OnboardingScreen({ profile, saveProfile }: Props) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [gender, setGender] = useState<Gender | null>(null);
  const [mainGoal, setMainGoal] = useState<MainGoal | null>(null);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | null>(null);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canProceed =
    (step === 0 && gender !== null) ||
    (step === 1 && mainGoal !== null) ||
    (step === 2 && experienceLevel !== null) ||
    step === 3;

  function goNext() {
    if (!canProceed) {
      setError(t('onboarding.errRequired'));
      return;
    }
    setError(null);
    Keyboard.dismiss();
    setStep((s) => s + 1);
  }

  function goBack() {
    setError(null);
    Keyboard.dismiss();
    setStep((s) => Math.max(0, s - 1));
  }

  async function handleFinish() {
    Keyboard.dismiss();
    setSaving(true);
    setError(null);
    try {
      await saveProfile({
        ...profile,
        gender,
        mainGoal,
        experienceLevel,
        weightKg: weight ? parseFloat(weight) : profile.weightKg,
        heightCm: height ? parseFloat(height) : profile.heightCm,
        goalWeightKg: goalWeight ? parseFloat(goalWeight) : null,
        onboardingCompleted: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('onboarding.errSave'));
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Box flex={1} bg="$backgroundDark950">
        <AnimatedBackground />
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Box px="$4" pt="$4" pb="$8">
            <HStack alignItems="center" space="sm" mb="$5">
              {step > 0 && (
                <Pressable onPress={goBack} hitSlop={8}>
                  <Icon name="chevron-back" size={22} color={colors.textMuted} />
                </Pressable>
              )}
              <HStack flex={1} space="xs">
                {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                  <Box
                    key={i}
                    flex={1}
                    h={4}
                    borderRadius="$full"
                    bg={i <= step ? colors.accent : '$backgroundDark800'}
                  />
                ))}
              </HStack>
            </HStack>

            {step === 0 && (
              <VStack>
                <Heading color="$textDark0" size="xl" mb="$1">
                  {t('onboarding.genderTitle')}
                </Heading>
                <Text color="$textDark500" size="sm" mb="$5">
                  {t('onboarding.genderSubtitle')}
                </Text>
                <OptionCard
                  icon="male"
                  title={t('onboarding.male')}
                  selected={gender === 'male'}
                  onPress={() => setGender('male')}
                />
                <OptionCard
                  icon="female"
                  title={t('onboarding.female')}
                  selected={gender === 'female'}
                  onPress={() => setGender('female')}
                />
                <OptionCard
                  icon="help-circle-outline"
                  title={t('onboarding.unspecified')}
                  selected={gender === 'unspecified'}
                  onPress={() => setGender('unspecified')}
                />
              </VStack>
            )}

            {step === 1 && (
              <VStack>
                <Heading color="$textDark0" size="xl" mb="$1">
                  {t('onboarding.goalTitle')}
                </Heading>
                <Text color="$textDark500" size="sm" mb="$5">
                  {t('onboarding.goalSubtitle')}
                </Text>
                <OptionCard
                  icon="barbell"
                  title={t('onboarding.goalBuildMuscle')}
                  description={t('onboarding.goalBuildMuscleDesc')}
                  selected={mainGoal === 'build_muscle'}
                  onPress={() => setMainGoal('build_muscle')}
                />
                <OptionCard
                  icon="flame"
                  title={t('onboarding.goalLoseFat')}
                  description={t('onboarding.goalLoseFatDesc')}
                  selected={mainGoal === 'lose_fat'}
                  onPress={() => setMainGoal('lose_fat')}
                />
                <OptionCard
                  icon="trending-up"
                  title={t('onboarding.goalGetStronger')}
                  description={t('onboarding.goalGetStrongerDesc')}
                  selected={mainGoal === 'get_stronger'}
                  onPress={() => setMainGoal('get_stronger')}
                />
                <OptionCard
                  icon="heart"
                  title={t('onboarding.goalGeneralFitness')}
                  description={t('onboarding.goalGeneralFitnessDesc')}
                  selected={mainGoal === 'general_fitness'}
                  onPress={() => setMainGoal('general_fitness')}
                />
              </VStack>
            )}

            {step === 2 && (
              <VStack>
                <Heading color="$textDark0" size="xl" mb="$1">
                  {t('onboarding.currentTitle')}
                </Heading>
                <Text color="$textDark500" size="sm" mb="$5">
                  {t('onboarding.currentSubtitle')}
                </Text>

                <Text color="$textDark400" size="xs" fontWeight="$bold" textTransform="uppercase" letterSpacing={0.5} mb="$2">
                  {t('onboarding.experienceLevel')}
                </Text>
                <OptionCard
                  icon="leaf-outline"
                  title={t('onboarding.beginner')}
                  description={t('onboarding.beginnerDesc')}
                  selected={experienceLevel === 'beginner'}
                  onPress={() => setExperienceLevel('beginner')}
                />
                <OptionCard
                  icon="fitness-outline"
                  title={t('onboarding.intermediate')}
                  description={t('onboarding.intermediateDesc')}
                  selected={experienceLevel === 'intermediate'}
                  onPress={() => setExperienceLevel('intermediate')}
                />
                <OptionCard
                  icon="medal-outline"
                  title={t('onboarding.advanced')}
                  description={t('onboarding.advancedDesc')}
                  selected={experienceLevel === 'advanced'}
                  onPress={() => setExperienceLevel('advanced')}
                />

                <HStack space="md" mt="$2">
                  <VStack space="xs" flex={1}>
                    <Text color="$textDark400" size="xs">
                      {t('onboarding.currentWeight')}
                    </Text>
                    <Input variant="outline" size="md" borderColor="$borderDark700" borderRadius="$lg" bg="$backgroundDark800">
                      <InputField
                        placeholder="78"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="numeric"
                        color="$textDark0"
                        value={weight}
                        onChangeText={setWeight}
                      />
                    </Input>
                  </VStack>
                  <VStack space="xs" flex={1}>
                    <Text color="$textDark400" size="xs">
                      {t('onboarding.height')}
                    </Text>
                    <Input variant="outline" size="md" borderColor="$borderDark700" borderRadius="$lg" bg="$backgroundDark800">
                      <InputField
                        placeholder="178"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="numeric"
                        color="$textDark0"
                        value={height}
                        onChangeText={setHeight}
                      />
                    </Input>
                  </VStack>
                </HStack>
              </VStack>
            )}

            {step === 3 && (
              <VStack>
                <Heading color="$textDark0" size="xl" mb="$1">
                  {t('onboarding.futureTitle')}
                </Heading>
                <Text color="$textDark500" size="sm" mb="$5">
                  {t('onboarding.futureSubtitle')}
                </Text>
                <VStack space="xs">
                  <Text color="$textDark400" size="xs">
                    {t('onboarding.goalWeight')}
                  </Text>
                  <Input variant="outline" size="md" borderColor="$borderDark700" borderRadius="$lg" bg="$backgroundDark800">
                    <InputField
                      placeholder="72"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      color="$textDark0"
                      value={goalWeight}
                      onChangeText={setGoalWeight}
                    />
                  </Input>
                </VStack>
                <Text color="$textDark600" size="xs" mt="$3">
                  {t('onboarding.futureHint')}
                </Text>
              </VStack>
            )}

            {error && (
              <Text color={colors.danger} size="sm" mt="$4">
                {error}
              </Text>
            )}

            <Button
              borderRadius="$lg"
              bg="$primary500"
              mt="$6"
              onPress={step === TOTAL_STEPS - 1 ? handleFinish : goNext}
              isDisabled={saving || (step < TOTAL_STEPS - 1 && !canProceed)}
            >
              <ButtonText>
                {saving ? '...' : step === TOTAL_STEPS - 1 ? t('onboarding.finish') : t('onboarding.next')}
              </ButtonText>
            </Button>
          </Box>
        </ScrollView>
      </Box>
    </SafeAreaView>
  );
}
