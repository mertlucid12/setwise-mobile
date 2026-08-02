import React, { useEffect, useState } from 'react';
import { FlatList } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  ButtonText,
  Pressable,
  Spinner,
  SafeAreaView,
} from '@gluestack-ui/themed';
import Icon from '@/components/Icon';
import { useAppToast } from '@/components/AppToast';
import { useExercises } from '@/hooks/useExercises';
import { useWorkoutSets } from '@/hooks/useWorkoutSets';
import { useProfile } from '@/hooks/useProfile';
import { useActiveRoutine } from '@/contexts/ActiveRoutineContext';
import { useI18n } from '@/i18n';
import { suggestNextLoad } from '@/services/volume';
import { SetType } from '@/types';
import AddExerciseModal from '@/components/AddExerciseModal';
import ExerciseHistoryModal from '@/components/ExerciseHistoryModal';
import ExercisePickerModal from '@/components/ExercisePickerModal';
import LogSetModal from '@/components/LogSetModal';
import AnimatedBackground from '@/components/AnimatedBackground';
import { muscleLabelKey, MUSCLE_ICONS } from '@/constants/muscleGroups';
import { colors } from '@/theme';

const REST_SECONDS_DEFAULT = 90;

function formatRestTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function WorkoutLogScreen() {
  const { t } = useI18n();
  const { exercises, loading: exercisesLoading, addExercise } = useExercises();
  const { sets, loading: setsLoading, logSet } = useWorkoutSets();
  const { profile } = useProfile();
  const { activeRoutine, clearRoutine } = useActiveRoutine();
  const toast = useAppToast();

  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [rpe, setRpe] = useState('');
  const [setType, setSetType] = useState<SetType>('normal');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addExerciseVisible, setAddExerciseVisible] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [logSetVisible, setLogSetVisible] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [prBanner, setPrBanner] = useState<string | null>(null);
  const [restSeconds, setRestSeconds] = useState<number | null>(null);

  const firstName = profile.displayName?.trim().split(/\s+/)[0] ?? null;

  const routineExerciseIds = new Set(activeRoutine?.exercises.map((re) => re.exerciseId) ?? []);
  const visibleExercises = activeRoutine ? exercises.filter((e) => routineExerciseIds.has(e.id)) : exercises;

  const activeExerciseId = selectedExerciseId ?? visibleExercises[0]?.id ?? null;
  const activeExercise = exercises.find((e) => e.id === activeExerciseId);
  const activeRoutineTarget = activeRoutine?.exercises.find((re) => re.exerciseId === activeExerciseId);
  const suggestion = activeExerciseId ? suggestNextLoad(activeExerciseId, sets) : null;
  const todaysSetsForExercise = sets.filter((s) => s.exerciseId === activeExerciseId);

  useEffect(() => {
    if (restSeconds === null) return;
    if (restSeconds <= 0) {
      setRestSeconds(null);
      return;
    }
    const timeout = setTimeout(() => setRestSeconds((s) => (s !== null ? s - 1 : null)), 1000);
    return () => clearTimeout(timeout);
  }, [restSeconds]);

  async function handleLogSet() {
    if (!weight || !reps || !activeExerciseId || !activeExercise) return;
    setSaving(true);
    setError(null);
    try {
      const pr = await logSet(
        activeExerciseId,
        activeExercise.name,
        parseFloat(weight),
        parseInt(reps, 10),
        setType,
        rpe ? parseFloat(rpe) : undefined
      );
      setWeight('');
      setReps('');
      setRpe('');
      setLogSetVisible(false);
      setRestSeconds(REST_SECONDS_DEFAULT);
      toast({
        title: t('toast.setLogged'),
        description: `${activeExercise.name} · ${weight}kg × ${reps}`,
      });
      if (pr) {
        setPrBanner(t(pr.messageKey, pr.messageParams));
        setTimeout(() => setPrBanner(null), 4000);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t('workout.errSaveSet');
      setError(message);
      toast({ title: t('toast.error'), description: message, variant: 'error' });
    } finally {
      setSaving(false);
    }
  }

  if (exercisesLoading) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <Box flex={1} bg="$backgroundDark950" alignItems="center" justifyContent="center">
          <Spinner color="$primary400" />
        </Box>
      </SafeAreaView>
    );
  }

  // Only one status slot is ever shown at a time (PR > rest timer > active
  // routine) - stacking all three as separate cards was what made this
  // screen feel cramped.
  const status: 'pr' | 'rest' | 'routine' | null = prBanner
    ? 'pr'
    : restSeconds !== null
      ? 'rest'
      : activeRoutine
        ? 'routine'
        : null;

  return (
    <SafeAreaView style={{ flex: 1 }}>
    <Box flex={1} bg="$backgroundDark950" px="$4" pt="$4">
      <AnimatedBackground />
      <HStack justifyContent="space-between" alignItems="flex-start" mb="$3">
        <VStack>
          <Text color={colors.accent} fontSize={12} fontWeight="$bold" letterSpacing={1.2} textTransform="uppercase">
            {firstName ? t('workout.welcome', { name: firstName }) : t('workout.today')}
          </Text>
          <Heading color="$textDark0" size="xl">
            {t('workout.title')}
          </Heading>
        </VStack>
        {activeExercise && (
          <Pressable
            onPress={() => setHistoryVisible(true)}
            w={36}
            h={36}
            borderRadius="$full"
            bg="$backgroundDark900"
            borderWidth={1}
            borderColor="$borderDark800"
            alignItems="center"
            justifyContent="center"
          >
            <Icon name="stats-chart" size={16} color={colors.textMuted} />
          </Pressable>
        )}
      </HStack>

      {status && (
        <HStack
          bg={status === 'pr' ? '$backgroundDark900' : status === 'routine' ? '$primary900' : '$backgroundDark900'}
          borderWidth={1}
          borderColor={status === 'pr' ? colors.accent : status === 'routine' ? '$primary700' : '$borderDark800'}
          borderRadius="$lg"
          px="$3"
          py="$2"
          mb="$3"
          alignItems="center"
          justifyContent="space-between"
        >
          {status === 'pr' && (
            <HStack alignItems="center" space="xs" flex={1}>
              <Icon name="trophy" size={15} color={colors.accent} />
              <Text color={colors.accent} fontWeight="$bold" size="sm" flex={1} numberOfLines={1}>
                {prBanner}
              </Text>
            </HStack>
          )}
          {status === 'rest' && (
            <>
              <HStack alignItems="center" space="xs">
                <Icon name="time-outline" size={15} color={colors.primaryLight} />
                <Text color="$textDark0" fontWeight="$bold" size="sm" fontFamily="$mono">
                  {t('workout.rest', { time: formatRestTime(restSeconds as number) })}
                </Text>
              </HStack>
              <HStack space="md">
                <Pressable onPress={() => setRestSeconds((s) => (s ?? 0) + 15)}>
                  <Text color={colors.primaryLight} size="xs" fontWeight="$semibold">
                    {t('workout.plus15')}
                  </Text>
                </Pressable>
                <Pressable onPress={() => setRestSeconds(null)}>
                  <Text color={colors.textMuted} size="xs" fontWeight="$semibold">
                    {t('workout.skip')}
                  </Text>
                </Pressable>
              </HStack>
            </>
          )}
          {status === 'routine' && (
            <>
              <HStack alignItems="center" space="xs">
                <Icon name="list" size={14} color={colors.primaryLight} />
                <Text color="$textDark0" size="sm" fontWeight="$semibold">
                  {t('workout.routine', { title: activeRoutine?.title ?? '' })}
                </Text>
              </HStack>
              <Pressable onPress={clearRoutine} hitSlop={8}>
                <Text color={colors.textMuted} size="xs">
                  {t('workout.finish')}
                </Text>
              </Pressable>
            </>
          )}
        </HStack>
      )}

      <Pressable
        onPress={() => setPickerVisible(true)}
        bg="$backgroundDark900"
        borderWidth={1}
        borderColor="$borderDark800"
        borderRadius="$lg"
        px="$3"
        py="$3"
        mb="$3"
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
      >
        <HStack alignItems="center" space="sm" flex={1}>
          <Box
            w={34}
            h={34}
            borderRadius="$full"
            bg="$backgroundDark800"
            borderWidth={1}
            borderColor={colors.accent}
            alignItems="center"
            justifyContent="center"
          >
            <Icon
              name={activeExercise ? MUSCLE_ICONS[activeExercise.primaryMuscle] : 'barbell-outline'}
              size={16}
              color={colors.primaryLight}
            />
          </Box>
          <VStack flex={1}>
            {activeExercise && (
              <Text color="$textDark600" size="xs" numberOfLines={1}>
                {t(muscleLabelKey(activeExercise.primaryMuscle))}
              </Text>
            )}
            <Text color="$textDark0" fontWeight="$bold" size="md" numberOfLines={1}>
              {activeExercise?.name ?? t('workout.pickExercise')}
            </Text>
          </VStack>
        </HStack>
        <Icon name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>

      <ExercisePickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        exercises={visibleExercises}
        selectedExerciseId={activeExerciseId}
        onSelect={setSelectedExerciseId}
        onAddCustom={() => setAddExerciseVisible(true)}
      />

      <AddExerciseModal
        visible={addExerciseVisible}
        onClose={() => setAddExerciseVisible(false)}
        onCreated={(exercise) => {
          addExercise(exercise);
          setSelectedExerciseId(exercise.id);
          toast({ title: t('toast.exerciseAdded'), description: exercise.name });
        }}
      />

      {activeExercise && (
        <ExerciseHistoryModal
          visible={historyVisible}
          onClose={() => setHistoryVisible(false)}
          exerciseName={activeExercise.name}
          sets={sets.filter((s) => s.exerciseId === activeExercise.id)}
        />
      )}

      <Button
        borderRadius="$lg"
        bg="$primary500"
        mb="$4"
        isDisabled={!activeExercise}
        onPress={() => {
          setError(null);
          setLogSetVisible(true);
        }}
      >
        <HStack alignItems="center" space="xs">
          <Icon name="add" size={18} color="#0E0E0E" />
          <ButtonText>{t('workout.addSet')}</ButtonText>
        </HStack>
      </Button>

      <LogSetModal
        visible={logSetVisible}
        onClose={() => setLogSetVisible(false)}
        exerciseName={activeExercise?.name}
        primaryMuscle={activeExercise?.primaryMuscle}
        weight={weight}
        reps={reps}
        rpe={rpe}
        setType={setType}
        onChangeWeight={setWeight}
        onChangeReps={setReps}
        onChangeRpe={setRpe}
        onChangeSetType={setSetType}
        onSubmit={handleLogSet}
        saving={saving}
        error={error}
        suggestionText={
          suggestion?.suggestedWeightKg != null
            ? t('workout.suggest', {
                weight: suggestion.suggestedWeightKg,
                reason: t(suggestion.reasonKey, suggestion.reasonParams),
              })
            : null
        }
        targetText={
          activeRoutineTarget
            ? t('workout.target', { sets: activeRoutineTarget.targetSets, reps: activeRoutineTarget.targetReps })
            : null
        }
      />

      <HStack justifyContent="space-between" alignItems="center" mb="$2">
        <Text color={colors.accent} fontSize={12} fontWeight="$bold" letterSpacing={1.2} textTransform="uppercase">
          {t('workout.todaySection', { name: activeExercise?.name ?? '' })}
        </Text>
        {activeExercise && (
          <Pressable onPress={() => setHistoryVisible(true)} hitSlop={8}>
            <Text color="$textDark500" size="xs">
              {t('workout.seeAll')}
            </Text>
          </Pressable>
        )}
      </HStack>

      {setsLoading ? (
        <Spinner color="$primary400" />
      ) : todaysSetsForExercise.length === 0 ? (
        <Text color="$textDark500" size="sm">
          {t('workout.noSetsToday')}
        </Text>
      ) : (
        <FlatList
          data={todaysSetsForExercise}
          keyExtractor={(item) => item.id}
          style={{ flex: 1 }}
          renderItem={({ item }) => (
            <HStack
              alignItems="center"
              space="sm"
              py="$3"
              px="$3"
              bg="$backgroundDark900"
              borderRadius="$lg"
              mb="$2"
              borderWidth={1}
              borderColor="$borderDark800"
            >
              <Box w={24} h={24} borderRadius="$full" bg="$primary900" alignItems="center" justifyContent="center">
                <Icon name="checkmark" size={14} color={colors.primaryLight} />
              </Box>
              <VStack flex={1}>
                {(item.setType !== 'normal' || item.rpe != null) && (
                  <Text color="$textDark500" size="xs" fontFamily="$mono">
                    {item.setType !== 'normal' ? t(`setType.${item.setType}`) : ''}
                    {item.setType !== 'normal' && item.rpe != null ? ' · ' : ''}
                    {item.rpe != null ? `RPE ${item.rpe}` : ''}
                  </Text>
                )}
              </VStack>
              <Text color="$textDark400" fontWeight="$semibold" size="sm" fontFamily="$mono">
                {item.weightKg}kg × {item.reps}
              </Text>
            </HStack>
          )}
        />
      )}
    </Box>
    </SafeAreaView>
  );
}
