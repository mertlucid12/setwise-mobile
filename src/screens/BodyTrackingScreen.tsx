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
  InputSlot,
  Button,
  ButtonText,
  Pressable,
  Spinner,
  SafeAreaView,
} from '@gluestack-ui/themed';
import Icon, { IconName } from '@/components/Icon';
import { useAppToast } from '@/components/AppToast';
import AppButton from '@/components/AppButton';
import DateField from '@/components/DateField';
import { useProfile } from '@/hooks/useProfile';
import { useMeasurements } from '@/hooks/useMeasurements';
import LineChart from '@/components/LineChart';
import AnimatedBackground from '@/components/AnimatedBackground';
import { useI18n } from '@/i18n';
import { colors, cardShadow } from '@/theme';

function MeasurementField({
  icon,
  label,
  unit,
  value,
  onChangeText,
}: {
  icon: IconName;
  label: string;
  unit: string;
  value: string;
  onChangeText: (v: string) => void;
}) {
  return (
    <VStack space="xs" flex={1}>
      <HStack alignItems="center" space="xs">
        <Icon name={icon} size={13} color={colors.primaryLight} />
        <Text color="$textDark400" size="xs" fontWeight="$medium">
          {label}
        </Text>
      </HStack>
      <Input variant="outline" size="md" borderColor="$borderDark700" borderRadius="$lg" bg="$backgroundDark800">
        <InputField
          placeholder="0"
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
          color="$textDark0"
          fontFamily="$mono"
          value={value}
          onChangeText={onChangeText}
        />
        <InputSlot pr="$3">
          <Text color="$textDark600" size="xs" fontFamily="$mono">
            {unit}
          </Text>
        </InputSlot>
      </Input>
    </VStack>
  );
}

export default function BodyTrackingScreen() {
  const navigation = useNavigation();
  const { t, dateLocale } = useI18n();
  const { profile, loading, saveProfile } = useProfile();
  const { measurements, loading: measurementsLoading, addMeasurement } = useMeasurements();

  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [checkInWeight, setCheckInWeight] = useState('');
  const [checkInWaist, setCheckInWaist] = useState('');
  const [checkInChest, setCheckInChest] = useState('');
  const [checkInArm, setCheckInArm] = useState('');
  const [checkInSaving, setCheckInSaving] = useState(false);
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [checkInDate, setCheckInDate] = useState(() => new Date());
  const toast = useAppToast();

  useEffect(() => {
    setWeight(profile.weightKg != null ? String(profile.weightKg) : '');
    setHeight(profile.heightCm != null ? String(profile.heightCm) : '');
  }, [profile]);

  async function handleSave() {
    Keyboard.dismiss();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await saveProfile({
        ...profile,
        weightKg: weight ? parseFloat(weight) : null,
        heightCm: height ? parseFloat(height) : null,
      });
      setSaved(true);
      toast({ title: t('toast.profileSaved') });
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('body.errSave');
      setError(message);
      toast({ title: t('toast.error'), description: message, variant: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function handleAddMeasurement() {
    Keyboard.dismiss();
    if (!checkInWeight && !checkInWaist && !checkInChest && !checkInArm) return;
    setCheckInSaving(true);
    setCheckInError(null);
    try {
      await addMeasurement(
        {
          weightKg: checkInWeight ? parseFloat(checkInWeight) : undefined,
          waistCm: checkInWaist ? parseFloat(checkInWaist) : undefined,
          chestCm: checkInChest ? parseFloat(checkInChest) : undefined,
          armCm: checkInArm ? parseFloat(checkInArm) : undefined,
        },
        checkInDate
      );
      setCheckInWeight('');
      setCheckInWaist('');
      setCheckInChest('');
      setCheckInArm('');
      setCheckInDate(new Date());
      toast({
        title: t('toast.measurementSaved'),
        description: checkInDate.toLocaleDateString(dateLocale, { day: 'numeric', month: 'long' }),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : t('body.errSaveMeasurement');
      setCheckInError(message);
      toast({ title: t('toast.error'), description: message, variant: 'error' });
    } finally {
      setCheckInSaving(false);
    }
  }

  const weightSeries = measurements
    .filter((m) => m.weightKg != null)
    .map((m) => ({ timestamp: m.recordedAt, value: m.weightKg as number }));

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <Box flex={1} bg="transparent" alignItems="center" justifyContent="center">
          <Spinner color="$primary400" />
        </Box>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Box flex={1} bg="transparent">
        <AnimatedBackground />
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <Box px="$4" pt="$4" pb="$8">
            <HStack alignItems="center" space="sm" mb="$1">
              <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
                <Icon name="chevron-back" size={22} color={colors.textMuted} />
              </Pressable>
              <Text color={colors.accent} fontSize={12} fontWeight="$bold" letterSpacing={1.2} textTransform="uppercase">
                {t('body.progress')}
              </Text>
            </HStack>
            <Heading color="$textDark0" size="xl" mb="$5">
              {t('body.title')}
            </Heading>

            <Box bg="$backgroundDark900" borderWidth={1} borderColor="$borderDark800" borderRadius="$xl" p="$4" mb="$4" {...cardShadow}>
              <VStack space="md">
                <HStack space="md">
                  <VStack space="xs" flex={1}>
                    <Text color="$textDark400" size="xs">
                      {t('body.weightKg')}
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
                      {t('body.heightCm')}
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

            <HStack alignItems="center" justifyContent="space-between" mb="$2">
              <Text color={colors.accent} fontSize={12} fontWeight="$bold" letterSpacing={1.2} textTransform="uppercase">
                {t('body.measurements')}
              </Text>
              <Text color="$textDark600" size="xs">
                {t('body.newCheckin')}
              </Text>
            </HStack>

            <Box bg="$backgroundDark900" borderWidth={1} borderColor="$borderDark800" borderRadius="$xl" p="$4" mb="$4" {...cardShadow}>
              {measurementsLoading ? (
                <Spinner color="$primary400" />
              ) : (
                <VStack space="md">
                  {weightSeries.length > 1 && (
                    <Box alignItems="center">
                      <LineChart data={weightSeries} width={280} height={110} color={colors.primaryLight} />
                    </Box>
                  )}

                  <VStack space="sm">
                    {/* Segmented, so a check-in typed days later still lands
                        on the day it was actually taken. */}
                    <DateField
                      label={t('body.checkInDate')}
                      value={checkInDate}
                      onChange={setCheckInDate}
                      maxToday
                    />
                    <HStack space="sm">
                      <MeasurementField
                        icon="scale-outline"
                        label={t('body.weight')}
                        unit="kg"
                        value={checkInWeight}
                        onChangeText={setCheckInWeight}
                      />
                      <MeasurementField
                        icon="ellipse-outline"
                        label={t('body.waist')}
                        unit="cm"
                        value={checkInWaist}
                        onChangeText={setCheckInWaist}
                      />
                    </HStack>
                    <HStack space="sm">
                      <MeasurementField
                        icon="body-outline"
                        label={t('body.chest')}
                        unit="cm"
                        value={checkInChest}
                        onChangeText={setCheckInChest}
                      />
                      <MeasurementField
                        icon="barbell-outline"
                        label={t('body.arm')}
                        unit="cm"
                        value={checkInArm}
                        onChangeText={setCheckInArm}
                      />
                    </HStack>
                  </VStack>

                  {checkInError && (
                    <Text color={colors.danger} size="sm">
                      {checkInError}
                    </Text>
                  )}

                  <AppButton
                    label={t('body.addMeasurement')}
                    icon="add"
                    onPress={handleAddMeasurement}
                    isLoading={checkInSaving}
                    full
                  />

                  {measurements.length > 0 && (
                    <VStack space="xs" mt="$1">
                      <Text color="$textDark600" size="xs" fontWeight="$semibold" letterSpacing={0.5} textTransform="uppercase" mb="$1">
                        {t('body.history')}
                      </Text>
                      {measurements.slice(0, 5).map((m) => (
                        <HStack
                          key={m.id}
                          justifyContent="space-between"
                          alignItems="center"
                          bg="$backgroundDark800"
                          borderRadius="$lg"
                          px="$3"
                          py="$2"
                        >
                          <Text color="$textDark500" size="xs" fontFamily="$mono">
                            {new Date(m.recordedAt).toLocaleDateString(dateLocale)}
                          </Text>
                          <Text color="$textDark300" size="xs" fontFamily="$mono">
                            {[
                              m.weightKg != null ? `${m.weightKg}kg` : null,
                              m.waistCm != null ? `${t('body.waist')} ${m.waistCm}` : null,
                              m.chestCm != null ? `${t('body.chest')} ${m.chestCm}` : null,
                              m.armCm != null ? `${t('body.arm')} ${m.armCm}` : null,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </Text>
                        </HStack>
                      ))}
                    </VStack>
                  )}
                </VStack>
              )}
            </Box>
          </Box>
        </ScrollView>
      </Box>
    </SafeAreaView>
  );
}
