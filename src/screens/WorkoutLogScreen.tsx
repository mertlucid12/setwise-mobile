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
import { useNavigation } from '@react-navigation/native';
import Icon from '@/components/Icon';
import { useAppToast } from '@/components/AppToast';
import { useExercises } from '@/hooks/useExercises';
import { useWorkoutSets } from '@/hooks/useWorkoutSets';
import { useWorkoutSession } from '@/hooks/useWorkoutSession';
import { useProfile } from '@/hooks/useProfile';
import { useActiveRoutine } from '@/contexts/ActiveRoutineContext';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n';
import { suggestNextLoad } from '@/services/volume';
import { fetchSessionHistory, SessionSummary } from '@/services/workouts';
import { formatDuration } from '@/services/sessionFormat';
import { SetEntry, SetType } from '@/types';
import AddExerciseModal from '@/components/AddExerciseModal';
import ExerciseHistoryModal from '@/components/ExerciseHistoryModal';
import ExercisePickerModal from '@/components/ExercisePickerModal';
import LogSetModal from '@/components/LogSetModal';
import WorkoutSummaryModal from '@/components/WorkoutSummaryModal';
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
  const { sets, loading: setsLoading, logSet, updateSet, deleteSet, lastSetFor } = useWorkoutSets();
  const { profile } = useProfile();
  const { activeRoutine, clearRoutine } = useActiveRoutine();
  const { session, elapsedSeconds, finish: finishSession, reload: reloadSession } = useWorkoutSession();
  const navigation = useNavigation();
  const { session: authSession } = useAuth();
  const userId = authSession?.user.id ?? null;
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
  /** Non-null while an already-logged set is open for correction. */
  const [editingSet, setEditingSet] = useState<SetEntry | null>(null);
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

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

  /**
   * Opens the add-set sheet carrying the last set for this exercise. Typing
   * the same numbers again every session is the single most repetitive part
   * of logging, and the previous performance is also the reference point for
   * deciding what to do next - so it starts there rather than blank.
   */
  function openAddSet() {
    setError(null);
    setEditingSet(null);
    const previous = activeExerciseId ? lastSetFor(activeExerciseId) : null;
    setWeight(previous ? String(previous.weightKg) : '');
    setReps(previous ? String(previous.reps) : '');
    setRpe('');
    setSetType('normal');
    setLogSetVisible(true);
  }

  function openEditSet(entry: SetEntry) {
    setError(null);
    setEditingSet(entry);
    setWeight(String(entry.weightKg));
    setReps(String(entry.reps));
    setRpe(entry.rpe != null ? String(entry.rpe) : '');
    setSetType(entry.setType);
    setLogSetVisible(true);
  }

  async function handleUpdateSet() {
    if (!editingSet || !weight || !reps) return;
    setSaving(true);
    setError(null);
    try {
      await updateSet(editingSet.id, {
        weightKg: parseFloat(weight),
        reps: parseInt(reps, 10),
        setType,
        rpe: rpe ? parseFloat(rpe) : undefined,
      });
      setLogSetVisible(false);
      setEditingSet(null);
      toast({ title: t('toast.setUpdated'), description: `${weight}kg × ${reps}` });
    } catch (err) {
      const message = err instanceof Error ? err.message : t('workout.errSaveSet');
      setError(message);
      toast({ title: t('toast.error'), description: message, variant: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSet() {
    if (!editingSet) return;
    setSaving(true);
    try {
      await deleteSet(editingSet.id);
      setLogSetVisible(false);
      setEditingSet(null);
      toast({ title: t('toast.setDeleted'), variant: 'info' });
    } catch (err) {
      const message = err instanceof Error ? err.message : t('workout.errSaveSet');
      setError(message);
      toast({ title: t('toast.error'), description: message, variant: 'error' });
    } finally {
      setSaving(false);
    }
  }

  /**
   * Ends the session, then pulls its rolled-up totals for the summary. The
   * history query is reused rather than adding a per-workout endpoint - the
   * session just finished is its newest row.
   */
  async function handleFinishSession() {
    const workoutId = await finishSession();
    clearRoutine();
    if (!workoutId) return;

    setSummary(null);
    setSummaryLoading(true);
    setSummaryVisible(true);
    try {
      const history = await fetchSessionHistory(userId ?? '', 5);
      setSummary(history.find((s) => s.workoutId === workoutId) ?? null);
    } catch {
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }

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
      // The first set of the day is what creates the workout row, so that's
      // the moment the session timer can start reading it.
      if (!session) reloadSession();
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
        <Box flex={1} bg="transparent" alignItems="center" justifyContent="center">
          <Spinner color="$primary400" />
        </Box>
      </SafeAreaView>
    );
  }

  // Only one status slot is ever shown at a time (PR > rest timer > active
  // routine) - stacking all three as separate cards was what made this
  // screen feel cramped.
  const status: 'pr' | 'rest' | 'session' | 'routine' | null = prBanner
    ? 'pr'
    : restSeconds !== null
      ? 'rest'
      : session
        ? 'session'
        : activeRoutine
          ? 'routine'
          : null;

  return (
    <SafeAreaView style={{ flex: 1 }}>
    <Box flex={1} bg="transparent" px="$4" pt="$4">
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
        <HStack space="xs">
        <Pressable
          onPress={() => navigation.navigate('SessionHistory' as never)}
          w={36}
          h={36}
          borderRadius="$full"
          bg="$backgroundDark900"
          borderWidth={1}
          borderColor="$borderDark800"
          alignItems="center"
          justifyContent="center"
        >
          <Icon name="time-outline" size={16} color={colors.textMuted} />
        </Pressable>
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
          {status === 'session' && (
            <>
              <HStack alignItems="center" space="xs" flex={1}>
                <Icon name="flame" size={15} color={colors.accent} />
                <Text color="$textDark0" fontWeight="$bold" size="sm" fontFamily="$mono">
                  {formatDuration(elapsedSeconds)}
                </Text>
                <Text color={colors.textMuted} size="xs" numberOfLines={1} flex={1}>
                  {activeRoutine ? activeRoutine.title : t('workout.sessionLive')}
                </Text>
              </HStack>
              <Pressable onPress={handleFinishSession} hitSlop={8}>
                <Text color={colors.accent} size="xs" fontWeight="$black" textTransform="uppercase">
                  {t('workout.finish')}
                </Text>
              </Pressable>
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
                  {t('workout.clearRoutine')}
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

      <WorkoutSummaryModal
        visible={summaryVisible}
        onClose={() => setSummaryVisible(false)}
        summary={summary}
        loading={summaryLoading}
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
        onPress={openAddSet}
      >
        <HStack alignItems="center" space="xs">
          <Icon name="add" size={18} color="#0E0E0E" />
          <ButtonText>{t('workout.addSet')}</ButtonText>
        </HStack>
      </Button>

      <LogSetModal
        visible={logSetVisible}
        onClose={() => {
          setLogSetVisible(false);
          setEditingSet(null);
        }}
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
        onSubmit={editingSet ? handleUpdateSet : handleLogSet}
        mode={editingSet ? 'edit' : 'add'}
        onDelete={handleDeleteSet}
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
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            // Tapping a logged set opens it for correction - a mistyped weight
            // used to be permanent, and it silently skewed volume, PRs and the
            // load suggestion from then on.
            <Pressable
              onPress={() => openEditSet(item)}
              flexDirection="row"
              alignItems="center"
              py="$3"
              px="$3"
              bg="$backgroundDark900"
              borderRadius="$lg"
              mb="$2"
              borderWidth={1}
              borderColor="$borderDark800"
            >
              <Box w={24} h={24} borderRadius="$full" bg="$primary900" alignItems="center" justifyContent="center" mr="$2">
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
              <Box ml="$2">
                <Icon name="chevron-forward" size={14} color={colors.textMuted} />
              </Box>
            </Pressable>
          )}
        />
      )}
    </Box>
    </SafeAreaView>
  );
}
