import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Textarea,
  TextareaInput,
  Button,
  ButtonText,
  Pressable,
  Spinner,
  SafeAreaView,
} from '@gluestack-ui/themed';
import Icon from '@/components/Icon';
import DayAddSheet from '@/components/DayAddSheet';
import { useCalendarRange } from '@/hooks/useCalendarMonth';
import { useExercises } from '@/hooks/useExercises';
import { useRoutines } from '@/hooks/useRoutines';
import { useRoutineSchedules } from '@/hooks/useRoutineSchedules';
import { useWorkoutSets } from '@/hooks/useWorkoutSets';
import { useActiveRoutine } from '@/contexts/ActiveRoutineContext';
import { fetchSetsForWorkout } from '@/services/workouts';
import { Routine, SetEntry, Weekday } from '@/types';
import { MUSCLE_ICONS, muscleLabelKey } from '@/constants/muscleGroups';
import AnimatedBackground from '@/components/AnimatedBackground';
import { useI18n } from '@/i18n';
import { colors, cardShadow } from '@/theme';

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function mondayFirstIndex(jsDay: number): Weekday {
  return ((jsDay + 6) % 7) as Weekday;
}

function addDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

/** Monday-anchored start of the week containing `d`, at local midnight. */
function startOfWeek(d: Date): Date {
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return addDays(start, -mondayFirstIndex(start.getDay()));
}

type ViewMode = 'week' | 'month';

export default function CalendarScreen() {
  const { t, tArr, dateLocale } = useI18n();
  const navigation = useNavigation();
  const monthLabels = tArr('calendar.months');
  const weekdayLabels = tArr('calendar.weekdays');
  const today = useMemo(() => new Date(), []);
  const todayKey = toDateKey(today);

  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [anchor, setAnchor] = useState(() => new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(todayKey);
  const [daySets, setDaySets] = useState<SetEntry[]>([]);
  const [daySetsLoading, setDaySetsLoading] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const weekStart = useMemo(() => startOfWeek(anchor), [anchor]);

  // Week view can straddle two months, so the fetch range follows the visible
  // span rather than always being a calendar month.
  const [rangeStartMs, rangeEndMs] = useMemo(() => {
    if (viewMode === 'week') {
      return [weekStart.getTime(), addDays(weekStart, 7).getTime()];
    }
    return [new Date(year, month, 1).getTime(), new Date(year, month + 1, 1).getTime()];
  }, [viewMode, weekStart, year, month]);

  const { days, loading, saveNotes, reload: reloadDays } = useCalendarRange(rangeStartMs, rangeEndMs);
  const { exercises } = useExercises();
  const { routines } = useRoutines();
  const { routineIdsByWeekday, toggleWeekday, reload: reloadSchedules } = useRoutineSchedules();
  const { logSet } = useWorkoutSets();
  const { startRoutine } = useActiveRoutine();

  // Schedules are edited on the routine detail screen, so this tab has to
  // refetch when it comes back into focus or the grid shows a stale plan.
  useFocusEffect(
    useCallback(() => {
      reloadSchedules();
    }, [reloadSchedules])
  );

  const dayByKey = useMemo(() => new Map(days.map((d) => [d.dateKey, d])), [days]);
  const routineById = useMemo(() => new Map(routines.map((r) => [r.id, r])), [routines]);

  const plannedFor = useCallback(
    (date: Date): Routine[] =>
      (routineIdsByWeekday.get(mondayFirstIndex(date.getDay())) ?? [])
        .map((id) => routineById.get(id))
        .filter((r): r is Routine => r != null),
    [routineIdsByWeekday, routineById]
  );

  const selectedDate = selectedDateKey ? new Date(`${selectedDateKey}T00:00:00`) : null;
  const selectedDay = selectedDateKey ? dayByKey.get(selectedDateKey) ?? null : null;
  const selectedPlanned = selectedDate ? plannedFor(selectedDate) : [];
  const selectedIsFuture = selectedDateKey ? selectedDateKey > todayKey : false;

  useEffect(() => {
    if (!selectedDay) {
      setDaySets([]);
      setNotesDraft('');
      return;
    }
    setNotesDraft(selectedDay.notes ?? '');
    setDaySetsLoading(true);
    fetchSetsForWorkout(selectedDay.workoutId)
      .then(setDaySets)
      .finally(() => setDaySetsLoading(false));
  }, [selectedDay?.workoutId]);

  async function handleSaveNotes() {
    if (!selectedDay) return;
    setSavingNotes(true);
    try {
      await saveNotes(selectedDay.workoutId, notesDraft);
    } finally {
      setSavingNotes(false);
    }
  }

  function shift(direction: 1 | -1) {
    setAnchor((prev) =>
      viewMode === 'week' ? addDays(prev, 7 * direction) : new Date(prev.getFullYear(), prev.getMonth() + direction, 1)
    );
  }

  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const leadingBlanks = mondayFirstIndex(new Date(year, month, 1).getDay());
  const monthCells: (number | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth(year, month) }, (_, i) => i + 1),
  ];

  const selectedDateLabel = selectedDate
    ? selectedDate.toLocaleDateString(dateLocale, { weekday: 'long', day: 'numeric', month: 'long' })
    : '';

  function handleStartRoutine(routine: Routine) {
    startRoutine(routine);
    navigation.navigate('Antrenman' as never);
  }

  /**
   * One grid cell. Two independent signals stack here: a crimson bar means a
   * routine is planned for that weekday, a gold dot means work was actually
   * logged - so a planned-but-missed day reads differently from a done one.
   */
  function DayCell({ date, compact }: { date: Date; compact: boolean }) {
    const dateKey = toDateKey(date);
    const hasWorkout = dayByKey.has(dateKey);
    const planned = plannedFor(date);
    const isToday = dateKey === todayKey;
    const isSelected = dateKey === selectedDateKey;

    return (
      <Pressable
        onPress={() => setSelectedDateKey(dateKey)}
        flex={compact ? undefined : 1}
        w={compact ? 42 : undefined}
        h={compact ? 52 : undefined}
        borderRadius="$xl"
        alignItems="center"
        justifyContent="center"
        bg={isSelected ? colors.primary : hasWorkout ? '$primary900' : 'transparent'}
        borderWidth={isToday && !isSelected ? 1.5 : 1}
        borderColor={isToday && !isSelected ? colors.accent : isSelected ? colors.accent : 'transparent'}
        py="$1"
      >
        <Text
          color={isSelected ? '$textDark0' : hasWorkout ? colors.primaryLight : '$textDark500'}
          fontWeight={hasWorkout || isSelected || isToday ? '$bold' : '$normal'}
          fontSize={13}
          fontFamily="$mono"
        >
          {date.getDate()}
        </Text>

        <HStack space="xs" mt="$1" h={5} alignItems="center">
          {planned.length > 0 && (
            <Box w={planned.length > 1 ? 12 : 7} h={3} borderRadius="$full" bg={isSelected ? '#FFFFFF' : colors.primaryLight} />
          )}
          {hasWorkout && <Box w={5} h={5} borderRadius="$full" bg={colors.accent} />}
        </HStack>
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Box flex={1} bg="$backgroundDark950" px="$4" pt="$4">
        <AnimatedBackground />
        <Text color={colors.accent} fontSize={12} fontWeight="$bold" letterSpacing={1.2} textTransform="uppercase">
          {t('calendar.past')}
        </Text>
        <Heading color="$textDark0" size="xl" mb="$1">
          {t('calendar.title')}
        </Heading>
        <Text color="$textDark500" size="sm" mb="$4">
          {t('calendar.workoutDays', { count: days.length })}
        </Text>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Box bg="$backgroundDark900" borderWidth={1} borderColor="$borderDark800" borderRadius="$2xl" p="$4" mb="$4" {...cardShadow}>
            <HStack alignItems="center" justifyContent="space-between" mb="$4">
              <HStack alignItems="center" space="sm">
                <Heading color="$textDark0" size="md">
                  {monthLabels[month]} {year}
                </Heading>
                <Pressable
                  onPress={() => setViewMode((m) => (m === 'week' ? 'month' : 'week'))}
                  hitSlop={10}
                  bg="$backgroundDark800"
                  borderRadius="$full"
                  px="$2"
                  py="$1"
                >
                  <Icon name={viewMode === 'week' ? 'chevron-down' : 'chevron-up'} size={14} color={colors.accent} />
                </Pressable>
              </HStack>

              <HStack space="xs">
                <Pressable
                  onPress={() => shift(-1)}
                  hitSlop={10}
                  w={32}
                  h={32}
                  borderRadius="$full"
                  bg="$backgroundDark800"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Icon name="chevron-back" size={16} color={colors.textSecondary} />
                </Pressable>
                <Pressable
                  onPress={() => shift(1)}
                  hitSlop={10}
                  w={32}
                  h={32}
                  borderRadius="$full"
                  bg="$backgroundDark800"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Icon name="chevron-forward" size={16} color={colors.textSecondary} />
                </Pressable>
              </HStack>
            </HStack>

            {loading ? (
              <Box py="$6" alignItems="center">
                <Spinner color="$primary400" />
              </Box>
            ) : viewMode === 'week' ? (
              <HStack justifyContent="space-between">
                {weekDates.map((date) => (
                  <VStack key={toDateKey(date)} alignItems="center" space="xs">
                    <Text color="$textDark600" size="2xs" fontWeight="$bold" letterSpacing={0.5} textTransform="uppercase">
                      {weekdayLabels[mondayFirstIndex(date.getDay())]}
                    </Text>
                    <DayCell date={date} compact />
                  </VStack>
                ))}
              </HStack>
            ) : (
              <>
                <View style={{ flexDirection: 'row' }}>
                  {weekdayLabels.map((label) => (
                    <View key={label} style={{ width: `${100 / 7}%`, alignItems: 'center', paddingBottom: 8 }}>
                      <Text color="$textDark600" size="2xs" fontWeight="$bold" letterSpacing={0.5} textTransform="uppercase">
                        {label}
                      </Text>
                    </View>
                  ))}
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {monthCells.map((day, idx) =>
                    day == null ? (
                      <View key={`blank-${idx}`} style={{ width: `${100 / 7}%`, height: 52 }} />
                    ) : (
                      <View key={day} style={{ width: `${100 / 7}%`, height: 52, padding: 2 }}>
                        <DayCell date={new Date(year, month, day)} compact={false} />
                      </View>
                    )
                  )}
                </View>
              </>
            )}

            {/* Legend - two marks that mean different things needs saying once. */}
            <HStack space="md" mt="$3" pt="$3" borderTopWidth={1} borderTopColor="$borderDark800" alignItems="center">
              <HStack alignItems="center" space="xs">
                <Box w={10} h={3} borderRadius="$full" bg={colors.primaryLight} />
                <Text color="$textDark600" fontSize={10} textTransform="uppercase" letterSpacing={0.5}>
                  {t('calendar.legendPlanned')}
                </Text>
              </HStack>
              <HStack alignItems="center" space="xs">
                <Box w={5} h={5} borderRadius="$full" bg={colors.accent} />
                <Text color="$textDark600" fontSize={10} textTransform="uppercase" letterSpacing={0.5}>
                  {t('calendar.legendDone')}
                </Text>
              </HStack>
            </HStack>
          </Box>

          {selectedDateKey && (
            <Box bg="$backgroundDark900" borderWidth={1} borderColor="$borderDark800" borderRadius="$2xl" p="$4" mb="$6" {...cardShadow}>
              <HStack alignItems="center" justifyContent="space-between" mb="$3">
                <Text color="$textDark0" fontWeight="$bold" size="md" textTransform="capitalize" flex={1}>
                  {selectedDateLabel}
                </Text>
                {daySets.length > 0 && (
                  <Box bg="$backgroundDark800" borderRadius="$full" px="$3" py="$1">
                    <Text color={colors.accent} size="xs" fontWeight="$bold">
                      {t('calendar.setsCount', { count: daySets.length })}
                    </Text>
                  </Box>
                )}
              </HStack>

              {/* Planned routines for this weekday */}
              {selectedPlanned.length > 0 && (
                <VStack space="xs" mb="$4">
                  <Text color={colors.accent} fontSize={11} fontWeight="$bold" letterSpacing={1} textTransform="uppercase">
                    {t('calendar.planned')}
                  </Text>
                  {selectedPlanned.map((routine) => (
                    <HStack
                      key={routine.id}
                      alignItems="center"
                      space="sm"
                      bg="$backgroundDark800"
                      borderWidth={1}
                      borderLeftWidth={3}
                      borderColor="$borderDark700"
                      borderLeftColor={colors.primary}
                      borderRadius="$lg"
                      px="$3"
                      py="$2"
                    >
                      <VStack flex={1}>
                        <Text color="$textDark0" size="sm" fontWeight="$bold" numberOfLines={1}>
                          {routine.title}
                        </Text>
                        <Text color={colors.textMuted} fontSize={11}>
                          {t('routines.exerciseCount', { count: routine.exercises.length })}
                        </Text>
                      </VStack>
                      {!selectedIsFuture && routine.exercises.length > 0 && (
                        <Pressable
                          onPress={() => handleStartRoutine(routine)}
                          bg={colors.primary}
                          borderRadius="$lg"
                          px="$3"
                          py="$1"
                        >
                          <Text color="$textDark0" fontSize={11} fontWeight="$black" textTransform="uppercase">
                            {t('routines.start')}
                          </Text>
                        </Pressable>
                      )}
                    </HStack>
                  ))}
                </VStack>
              )}

              {/* Logged sets */}
              {daySetsLoading ? (
                <Box py="$3" alignItems="center">
                  <Spinner color="$primary400" />
                </Box>
              ) : daySets.length > 0 ? (
                <VStack space="xs" mb="$4">
                  <Text color={colors.accent} fontSize={11} fontWeight="$bold" letterSpacing={1} textTransform="uppercase">
                    {t('calendar.logged')}
                  </Text>
                  {daySets.map((s) => {
                    const exercise = exercises.find((e) => e.id === s.exerciseId);
                    return (
                      <HStack
                        key={s.id}
                        alignItems="center"
                        justifyContent="space-between"
                        bg="$backgroundDark800"
                        borderRadius="$lg"
                        px="$3"
                        py="$2"
                      >
                        <HStack alignItems="center" space="sm" flex={1}>
                          <Box
                            w={26}
                            h={26}
                            borderRadius="$md"
                            bg="$backgroundDark900"
                            borderWidth={1}
                            borderColor="$borderDark700"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Icon
                              name={exercise ? MUSCLE_ICONS[exercise.primaryMuscle] : 'barbell-outline'}
                              size={13}
                              color={colors.primaryLight}
                            />
                          </Box>
                          <VStack flex={1}>
                            <Text color="$textDark0" size="sm" fontWeight="$semibold" numberOfLines={1}>
                              {exercise?.name ?? s.exerciseId}
                            </Text>
                            {exercise && (
                              <Text color="$textDark600" size="2xs" textTransform="uppercase" letterSpacing={0.5}>
                                {t(muscleLabelKey(exercise.primaryMuscle))}
                              </Text>
                            )}
                          </VStack>
                        </HStack>
                        <Text color="$textDark300" size="sm" fontWeight="$semibold" fontFamily="$mono">
                          {s.weightKg}kg × {s.reps}
                        </Text>
                      </HStack>
                    );
                  })}
                </VStack>
              ) : (
                selectedPlanned.length === 0 && (
                  <Text color="$textDark500" size="sm" mb="$4">
                    {selectedIsFuture ? t('calendar.emptyFuture') : t('calendar.noSets')}
                  </Text>
                )
              )}

              <Button borderRadius="$xl" bg="$primary500" mb="$4" onPress={() => setSheetOpen(true)}>
                <HStack alignItems="center" space="xs">
                  <Icon name="add" size={17} color="#FFFFFF" />
                  <ButtonText fontWeight="$black" letterSpacing={1} textTransform="uppercase">
                    {t('calendar.addToDay')}
                  </ButtonText>
                </HStack>
              </Button>

              {selectedDay && (
                <>
                  <Text color="$textDark400" size="xs" mb="$1">
                    {t('calendar.noteLabel')}
                  </Text>
                  <Textarea size="md" borderColor="$borderDark700" borderRadius="$lg" bg="$backgroundDark800" mb="$3">
                    <TextareaInput
                      placeholder={t('calendar.notePlaceholder')}
                      placeholderTextColor={colors.textMuted}
                      color="$textDark0"
                      value={notesDraft}
                      onChangeText={setNotesDraft}
                    />
                  </Textarea>
                  <Button
                    borderRadius="$xl"
                    variant="outline"
                    borderColor="$borderDark700"
                    onPress={handleSaveNotes}
                    isDisabled={savingNotes}
                  >
                    <ButtonText color="$textDark0">{savingNotes ? '...' : t('calendar.saveNote')}</ButtonText>
                  </Button>
                </>
              )}
            </Box>
          )}
        </ScrollView>

        {selectedDateKey && selectedDate && (
          <DayAddSheet
            visible={sheetOpen}
            onClose={() => setSheetOpen(false)}
            dateKey={selectedDateKey}
            dateLabel={selectedDateLabel}
            weekday={mondayFirstIndex(selectedDate.getDay())}
            weekdayLabel={selectedDate.toLocaleDateString(dateLocale, { weekday: 'long' })}
            isFuture={selectedIsFuture}
            routines={routines}
            exercises={exercises}
            scheduledRoutineIds={selectedPlanned.map((r) => r.id)}
            onScheduleRoutine={async (routineId) => {
              await toggleWeekday(routineId, mondayFirstIndex(selectedDate.getDay()));
            }}
            onLogSet={async (exerciseId, name, weightKg, reps) => {
              await logSet(exerciseId, name, weightKg, reps, 'normal', undefined, selectedDateKey);
              await reloadDays();
              if (selectedDay) {
                setDaySets(await fetchSetsForWorkout(selectedDay.workoutId));
              }
            }}
          />
        )}
      </Box>
    </SafeAreaView>
  );
}
