import React, { useEffect, useState } from 'react';
import { FlatList } from 'react-native';
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
import { useExercises } from '@/hooks/useExercises';
import { useWorkoutSets } from '@/hooks/useWorkoutSets';
import { useActiveRoutine } from '@/contexts/ActiveRoutineContext';
import { suggestNextLoad } from '@/services/volume';
import { SetType } from '@/types';
import AddExerciseModal from '@/components/AddExerciseModal';
import ExerciseHistoryModal from '@/components/ExerciseHistoryModal';
import AnimatedBackground from '@/components/AnimatedBackground';
import { colors, cardShadow } from '@/theme';

const REST_SECONDS_DEFAULT = 90;

const SET_TYPES: { value: SetType; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'warmup', label: 'Isınma' },
  { value: 'dropset', label: 'Drop Set' },
  { value: 'failure', label: 'Başarısızlık' },
];

const SET_TYPE_LABELS: Record<SetType, string> = {
  normal: 'Normal',
  warmup: 'Isınma',
  dropset: 'Drop Set',
  failure: 'Başarısızlık',
};

function formatRestTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function WorkoutLogScreen() {
  const { exercises, loading: exercisesLoading, addExercise } = useExercises();
  const { sets, loading: setsLoading, logSet } = useWorkoutSets();
  const { activeRoutine, clearRoutine } = useActiveRoutine();

  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [rpe, setRpe] = useState('');
  const [setType, setSetType] = useState<SetType>('normal');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addExerciseVisible, setAddExerciseVisible] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [prBanner, setPrBanner] = useState<string | null>(null);
  const [restSeconds, setRestSeconds] = useState<number | null>(null);

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
      setRestSeconds(REST_SECONDS_DEFAULT);
      if (pr) {
        setPrBanner(pr.message);
        setTimeout(() => setPrBanner(null), 4000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Set kaydedilemedi.');
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
            Bugün
          </Text>
          <Heading color="$textDark0" size="xl">
            Antrenman kaydı
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
            <Ionicons name="stats-chart" size={16} color={colors.textMuted} />
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
              <Ionicons name="trophy" size={15} color={colors.accent} />
              <Text color={colors.accent} fontWeight="$bold" size="sm" flex={1} numberOfLines={1}>
                {prBanner}
              </Text>
            </HStack>
          )}
          {status === 'rest' && (
            <>
              <HStack alignItems="center" space="xs">
                <Ionicons name="time-outline" size={15} color={colors.primaryLight} />
                <Text color="$textDark0" fontWeight="$bold" size="sm" fontFamily="$mono">
                  Dinlenme {formatRestTime(restSeconds as number)}
                </Text>
              </HStack>
              <HStack space="md">
                <Pressable onPress={() => setRestSeconds((s) => (s ?? 0) + 15)}>
                  <Text color={colors.primaryLight} size="xs" fontWeight="$semibold">
                    +15sn
                  </Text>
                </Pressable>
                <Pressable onPress={() => setRestSeconds(null)}>
                  <Text color={colors.textMuted} size="xs" fontWeight="$semibold">
                    Atla
                  </Text>
                </Pressable>
              </HStack>
            </>
          )}
          {status === 'routine' && (
            <>
              <HStack alignItems="center" space="xs">
                <Ionicons name="list" size={14} color={colors.primaryLight} />
                <Text color="$textDark0" size="sm" fontWeight="$semibold">
                  Rutin: {activeRoutine?.title}
                </Text>
              </HStack>
              <Pressable onPress={clearRoutine} hitSlop={8}>
                <Text color={colors.textMuted} size="xs">
                  Bitir
                </Text>
              </Pressable>
            </>
          )}
        </HStack>
      )}

      <HStack alignItems="center" space="sm" mb="$3">
        <FlatList
          horizontal
          data={visibleExercises}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0, flexShrink: 1 }}
          renderItem={({ item }) => {
            const active = item.id === activeExerciseId;
            return (
              <Pressable
                onPress={() => setSelectedExerciseId(item.id)}
                bg={active ? '$primary500' : '$backgroundDark900'}
                borderColor={active ? '$primary500' : '$borderDark800'}
                borderWidth={1}
                borderRadius="$full"
                px="$4"
                py="$2"
                mr="$2"
              >
                <Text color={active ? '$textDark0' : '$textDark400'} fontWeight={active ? '$bold' : '$medium'} size="sm">
                  {item.name}
                </Text>
              </Pressable>
            );
          }}
        />
        <Pressable
          onPress={() => setAddExerciseVisible(true)}
          w={36}
          h={36}
          borderRadius="$full"
          borderWidth={1}
          borderColor={colors.accent}
          borderStyle="dashed"
          alignItems="center"
          justifyContent="center"
        >
          <Ionicons name="add" size={18} color={colors.accent} />
        </Pressable>
      </HStack>

      <AddExerciseModal
        visible={addExerciseVisible}
        onClose={() => setAddExerciseVisible(false)}
        onCreated={(exercise) => {
          addExercise(exercise);
          setSelectedExerciseId(exercise.id);
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

      {suggestion?.suggestedWeightKg != null && (
        <HStack alignItems="center" space="xs" mb="$2" px="$1">
          <Ionicons name="bulb" size={13} color={colors.accent} />
          <Text color={colors.accent} fontWeight="$semibold" size="xs" flex={1} numberOfLines={1}>
            {suggestion.suggestedWeightKg}kg öner ·{' '}
            <Text color="$textDark500" size="xs">
              {suggestion.reason}
            </Text>
          </Text>
          {activeRoutineTarget && (
            <Text color="$textDark500" size="xs" fontFamily="$mono">
              hedef {activeRoutineTarget.targetSets}×{activeRoutineTarget.targetReps}
            </Text>
          )}
        </HStack>
      )}

      <Box bg="$backgroundDark900" borderWidth={1} borderColor="$borderDark800" borderRadius="$xl" p="$3" mb="$3" {...cardShadow}>
        <HStack space="sm" mb="$3">
          <Input flex={1} variant="outline" size="md" borderColor="$borderDark700" borderRadius="$lg" bg="$backgroundDark800">
            <InputField
              placeholder="Ağırlık (kg)"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              color="$textDark0"
              value={weight}
              onChangeText={setWeight}
            />
          </Input>
          <Input flex={1} variant="outline" size="md" borderColor="$borderDark700" borderRadius="$lg" bg="$backgroundDark800">
            <InputField
              placeholder="Tekrar"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              color="$textDark0"
              value={reps}
              onChangeText={setReps}
            />
          </Input>
          <Input w={90} variant="outline" size="md" borderColor="$borderDark700" borderRadius="$lg" bg="$backgroundDark800">
            <InputField
              placeholder="RPE"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              color="$textDark0"
              value={rpe}
              onChangeText={setRpe}
            />
          </Input>
        </HStack>

        <HStack flexWrap="wrap" mb="$3">
          {SET_TYPES.map((t) => {
            const active = setType === t.value;
            return (
              <Pressable
                key={t.value}
                onPress={() => setSetType(t.value)}
                bg={active ? '$primary500' : '$backgroundDark800'}
                borderColor={active ? '$primary500' : '$borderDark700'}
                borderWidth={1}
                borderRadius="$full"
                px="$3"
                py="$1"
                mr="$2"
                mb="$1"
              >
                <Text color={active ? '$textDark0' : '$textDark400'} size="xs" fontWeight={active ? '$bold' : '$medium'}>
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </HStack>

        <Button borderRadius="$lg" bg="$primary500" onPress={handleLogSet} isDisabled={saving}>
          <ButtonText>{saving ? '...' : 'Kaydet'}</ButtonText>
        </Button>

        {error && (
          <Text color={colors.danger} size="sm" mt="$2">
            {error}
          </Text>
        )}
      </Box>

      <HStack justifyContent="space-between" alignItems="center" mb="$2">
        <Text color={colors.accent} fontSize={12} fontWeight="$bold" letterSpacing={1.2} textTransform="uppercase">
          Bugün · {activeExercise?.name ?? ''}
        </Text>
        {activeExercise && (
          <Pressable onPress={() => setHistoryVisible(true)} hitSlop={8}>
            <Text color="$textDark500" size="xs">
              Tümünü gör
            </Text>
          </Pressable>
        )}
      </HStack>

      {setsLoading ? (
        <Spinner color="$primary400" />
      ) : todaysSetsForExercise.length === 0 ? (
        <Text color="$textDark500" size="sm">
          Bu egzersizde bugün henüz set kaydetmedin.
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
                <Ionicons name="checkmark" size={14} color={colors.primaryLight} />
              </Box>
              <VStack flex={1}>
                {(item.setType !== 'normal' || item.rpe != null) && (
                  <Text color="$textDark500" size="xs" fontFamily="$mono">
                    {item.setType !== 'normal' ? SET_TYPE_LABELS[item.setType] : ''}
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
