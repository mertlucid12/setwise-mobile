import React, { useEffect, useState } from 'react';
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
  Spinner,
  SafeAreaView,
} from '@gluestack-ui/themed';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useMeasurements } from '@/hooks/useMeasurements';
import LineChart from '@/components/LineChart';
import AnimatedBackground from '@/components/AnimatedBackground';
import { colors, cardShadow } from '@/theme';

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const { profile, loading, saveProfile } = useProfile();
  const { measurements, loading: measurementsLoading, addMeasurement } = useMeasurements();

  const [displayName, setDisplayName] = useState('');
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

  useEffect(() => {
    setDisplayName(profile.displayName ?? '');
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
        displayName: displayName.trim() || null,
        weightKg: weight ? parseFloat(weight) : null,
        heightCm: height ? parseFloat(height) : null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Profil kaydedilemedi.');
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
      await addMeasurement({
        weightKg: checkInWeight ? parseFloat(checkInWeight) : undefined,
        waistCm: checkInWaist ? parseFloat(checkInWaist) : undefined,
        chestCm: checkInChest ? parseFloat(checkInChest) : undefined,
        armCm: checkInArm ? parseFloat(checkInArm) : undefined,
      });
      setCheckInWeight('');
      setCheckInWaist('');
      setCheckInChest('');
      setCheckInArm('');
    } catch (err) {
      setCheckInError(err instanceof Error ? err.message : 'Ölçüm kaydedilemedi.');
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
          Hesap
        </Text>
        <Heading color="$textDark0" size="xl" mb="$1">
          Profil
        </Heading>
        <Text color="$textDark500" size="sm" mb="$5">
          {session?.user.email}
        </Text>

        <Box bg="$backgroundDark900" borderWidth={1} borderColor="$borderDark800" borderRadius="$xl" p="$4" mb="$4" {...cardShadow}>
          <VStack space="md">
            <VStack space="xs">
              <Text color="$textDark400" size="xs">
                İsim
              </Text>
              <Input variant="outline" size="md" borderColor="$borderDark700" borderRadius="$lg" bg="$backgroundDark800">
                <InputField
                  placeholder="ör. Mert"
                  placeholderTextColor={colors.textMuted}
                  color="$textDark0"
                  value={displayName}
                  onChangeText={setDisplayName}
                />
              </Input>
            </VStack>

            <HStack space="md">
              <VStack space="xs" flex={1}>
                <Text color="$textDark400" size="xs">
                  Kilo (kg)
                </Text>
                <Input variant="outline" size="md" borderColor="$borderDark700" borderRadius="$lg" bg="$backgroundDark800">
                  <InputField
                    placeholder="ör. 78"
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
                  Boy (cm)
                </Text>
                <Input variant="outline" size="md" borderColor="$borderDark700" borderRadius="$lg" bg="$backgroundDark800">
                  <InputField
                    placeholder="ör. 178"
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
              <ButtonText>{saving ? '...' : saved ? 'Kaydedildi ✓' : 'Kaydet'}</ButtonText>
            </Button>
          </VStack>
        </Box>

        <Text color={colors.accent} fontSize={12} fontWeight="$bold" letterSpacing={1.2} textTransform="uppercase" mb="$2">
          Vücut ölçümleri
        </Text>

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

              <HStack space="sm">
                <VStack space="xs" flex={1}>
                  <Text color="$textDark400" size="xs">
                    Kilo
                  </Text>
                  <Input variant="outline" size="sm" borderColor="$borderDark700" borderRadius="$lg" bg="$backgroundDark800">
                    <InputField
                      placeholder="kg"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      color="$textDark0"
                      value={checkInWeight}
                      onChangeText={setCheckInWeight}
                    />
                  </Input>
                </VStack>
                <VStack space="xs" flex={1}>
                  <Text color="$textDark400" size="xs">
                    Bel
                  </Text>
                  <Input variant="outline" size="sm" borderColor="$borderDark700" borderRadius="$lg" bg="$backgroundDark800">
                    <InputField
                      placeholder="cm"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      color="$textDark0"
                      value={checkInWaist}
                      onChangeText={setCheckInWaist}
                    />
                  </Input>
                </VStack>
                <VStack space="xs" flex={1}>
                  <Text color="$textDark400" size="xs">
                    Göğüs
                  </Text>
                  <Input variant="outline" size="sm" borderColor="$borderDark700" borderRadius="$lg" bg="$backgroundDark800">
                    <InputField
                      placeholder="cm"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      color="$textDark0"
                      value={checkInChest}
                      onChangeText={setCheckInChest}
                    />
                  </Input>
                </VStack>
                <VStack space="xs" flex={1}>
                  <Text color="$textDark400" size="xs">
                    Kol
                  </Text>
                  <Input variant="outline" size="sm" borderColor="$borderDark700" borderRadius="$lg" bg="$backgroundDark800">
                    <InputField
                      placeholder="cm"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      color="$textDark0"
                      value={checkInArm}
                      onChangeText={setCheckInArm}
                    />
                  </Input>
                </VStack>
              </HStack>

              {checkInError && (
                <Text color={colors.danger} size="sm">
                  {checkInError}
                </Text>
              )}

              <Button
                borderRadius="$lg"
                variant="outline"
                borderColor={colors.accent}
                onPress={handleAddMeasurement}
                isDisabled={checkInSaving}
              >
                <ButtonText color={colors.accent}>{checkInSaving ? '...' : 'Ölçüm ekle'}</ButtonText>
              </Button>

              {measurements.length > 0 && (
                <VStack space="xs" mt="$2">
                  {measurements.slice(0, 5).map((m) => (
                    <HStack key={m.id} justifyContent="space-between" py="$1">
                      <Text color="$textDark500" size="xs" fontFamily="$mono">
                        {new Date(m.recordedAt).toLocaleDateString('tr-TR')}
                      </Text>
                      <Text color="$textDark400" size="xs" fontFamily="$mono">
                        {[
                          m.weightKg != null ? `${m.weightKg}kg` : null,
                          m.waistCm != null ? `bel ${m.waistCm}cm` : null,
                          m.chestCm != null ? `göğüs ${m.chestCm}cm` : null,
                          m.armCm != null ? `kol ${m.armCm}cm` : null,
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
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          <Text color={colors.danger} fontWeight="$semibold" size="sm" ml="$2">
            Çıkış yap
          </Text>
        </Pressable>
      </Box>
        </ScrollView>
      </Box>
    </SafeAreaView>
  );
}
