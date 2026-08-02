import React, { useCallback, useState } from 'react';
import { FlatList } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
import { useRoutines } from '@/hooks/useRoutines';
import { useExercises } from '@/hooks/useExercises';
import { useI18n } from '@/i18n';
import AnimatedBackground from '@/components/AnimatedBackground';
import { computeRoutineStats } from '@/services/routineStats';
import { RoutinesStackParamList } from '@/navigation/types';
import { MUSCLE_ICONS } from '@/constants/muscleGroups';
import { colors, cardShadow } from '@/theme';

export default function RoutinesScreen() {
  const { t } = useI18n();
  const { routines, loading, reload, createRoutine } = useRoutines();
  const { exercises } = useExercises();
  const navigation = useNavigation<NativeStackNavigationProp<RoutinesStackParamList>>();
  const toast = useAppToast();

  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  // The detail screen owns its own useRoutines copy, so edits made there
  // (adding exercises, deleting a routine) are invisible to this list until
  // it refetches. Reloading on focus is what keeps the two in step.
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  async function handleCreate() {
    if (!newTitle.trim()) return;
    try {
      const routine = await createRoutine(newTitle.trim());
      setNewTitle('');
      setCreating(false);
      toast({ title: t('toast.routineCreated'), description: routine.title });
      navigation.navigate('RoutineDetail', { routineId: routine.id });
    } catch (err) {
      const message = err instanceof Error ? err.message : t('routines.errCreate');
      setError(message);
      toast({ title: t('toast.error'), description: message, variant: 'error' });
    }
  }

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
      <Box flex={1} bg="transparent" px="$4" pt="$4">
        <AnimatedBackground />
        <HStack justifyContent="space-between" alignItems="flex-start" mb="$4">
          <VStack>
            <Text color={colors.accent} fontSize={12} fontWeight="$bold" letterSpacing={1.2} textTransform="uppercase">
              {t('routines.plan')}
            </Text>
            <Heading color="$textDark0" size="xl">
              {t('routines.title')}
            </Heading>
          </VStack>
          <Pressable
            onPress={() => setCreating((v) => !v)}
            w={36}
            h={36}
            borderRadius="$full"
            borderWidth={1}
            borderColor={colors.accent}
            borderStyle="dashed"
            alignItems="center"
            justifyContent="center"
          >
            <Icon name={creating ? 'close' : 'add'} size={18} color={colors.accent} />
          </Pressable>
        </HStack>

        {creating && (
          <HStack space="sm" mb="$4">
            <Input flex={1} variant="outline" size="md" borderColor="$borderDark700" borderRadius="$lg" bg="$backgroundDark800">
              <InputField
                placeholder={t('routines.placeholder')}
                placeholderTextColor={colors.textMuted}
                color="$textDark0"
                value={newTitle}
                onChangeText={setNewTitle}
                onSubmitEditing={handleCreate}
              />
            </Input>
            <Button borderRadius="$lg" bg="$primary500" onPress={handleCreate} px="$4">
              <ButtonText>{t('routines.create')}</ButtonText>
            </Button>
          </HStack>
        )}

        {error && (
          <Text color={colors.danger} size="sm" mb="$3">
            {error}
          </Text>
        )}

        {routines.length === 0 && !creating && (
          <Box bg="$backgroundDark900" borderWidth={1} borderColor="$borderDark800" borderRadius="$2xl" p="$4">
            <Text color="$textDark400" size="sm">
              {t('routines.empty')}
            </Text>
          </Box>
        )}

        <FlatList
          data={routines}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const stats = computeRoutineStats(item, exercises);
            return (
              <Pressable
                onPress={() => navigation.navigate('RoutineDetail', { routineId: item.id })}
                bg="$backgroundDark900"
                borderWidth={1}
                borderLeftWidth={3}
                borderColor="$borderDark800"
                borderLeftColor={colors.primary}
                borderRadius="$2xl"
                px="$3"
                py="$3"
                mb="$3"
                flexDirection="row"
                alignItems="center"
                {...cardShadow}
              >
                <VStack flex={1} space="xs">
                  <Text color="$textDark0" fontWeight="$bold" size="md" numberOfLines={1}>
                    {item.title}
                  </Text>
                  <HStack alignItems="center" space="sm">
                    <Text color={colors.textMuted} fontSize={11} fontFamily="$mono">
                      {t('routines.exerciseCount', { count: stats.exerciseCount })}
                    </Text>
                    {stats.totalSets > 0 && (
                      <>
                        <Box w={3} h={3} borderRadius="$full" bg={colors.border} />
                        <Text color={colors.textMuted} fontSize={11} fontFamily="$mono">
                          {t('routines.setCount', { count: stats.totalSets })}
                        </Text>
                        <Box w={3} h={3} borderRadius="$full" bg={colors.border} />
                        <Text color={colors.textMuted} fontSize={11} fontFamily="$mono">
                          ~{stats.estimatedMinutes}
                          {t('routineDetail.minutesShort')}
                        </Text>
                      </>
                    )}
                  </HStack>
                  {stats.muscles.length > 0 && (
                    <HStack space="xs" mt="$1">
                      {stats.muscles.slice(0, 5).map((muscle) => (
                        <Box
                          key={muscle}
                          w={22}
                          h={22}
                          borderRadius="$md"
                          bg="$backgroundDark800"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Icon name={MUSCLE_ICONS[muscle]} size={12} color={colors.accentSoft} />
                        </Box>
                      ))}
                    </HStack>
                  )}
                </VStack>
                <Icon name="chevron-forward" size={18} color={colors.textMuted} />
              </Pressable>
            );
          }}
        />
      </Box>
    </SafeAreaView>
  );
}
