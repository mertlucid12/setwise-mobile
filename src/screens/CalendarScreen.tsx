import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
} from '@gluestack-ui/themed';
import Icon, { IconName } from '@/components/Icon';
import HeroSlashes from '@/components/HeroSlashes';
import DayAddSheet from '@/components/DayAddSheet';
import { useAppToast } from '@/components/AppToast';
import { useCalendarRange } from '@/hooks/useCalendarMonth';
import { useExercises } from '@/hooks/useExercises';
import { useRoutines } from '@/hooks/useRoutines';
import { useRoutineSchedules } from '@/hooks/useRoutineSchedules';
import { useWorkoutSets } from '@/hooks/useWorkoutSets';
import { useActiveRoutine } from '@/contexts/ActiveRoutineContext';
import { fetchSetsForWorkout } from '@/services/workouts';
import { Routine, SetEntry, Weekday } from '@/types';
import { MUSCLE_ICONS, muscleLabelKey } from '@/constants/muscleGroups';
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

const HERO_HEIGHT = 200;
/** How far the stat strip rides up over the hero's bottom edge. */
const STAT_OVERLAP = 22;
const CELL_HEIGHT = 54;

/** One slot of the stat strip - same shape as the routine detail screen so the
 *  two screens read as one system. */
function StatCard({ icon, value, unit, label }: { icon: IconName; value: string; unit?: string; label: string }) {
  return (
    <VStack
      flex={1}
      bg={colors.surface}
      borderWidth={1}
      borderColor={colors.border}
      borderRadius="$2xl"
      px="$2"
      py="$3"
      alignItems="center"
      space="xs"
      {...cardShadow}
    >
      <Icon name={icon} size={16} color={colors.accent} />
      <HStack alignItems="baseline" space="xs">
        <Text color="$textDark0" fontSize={20} fontWeight="$black" fontFamily="$mono">
          {value}
        </Text>
        {unit && (
          <Text color={colors.textMuted} fontSize={11} fontFamily="$mono">
            {unit}
          </Text>
        )}
      </HStack>
      <Text color={colors.textMuted} fontSize={9} fontWeight="$bold" letterSpacing={1} textTransform="uppercase">
        {label}
      </Text>
    </VStack>
  );
}

function CircleButton({ icon, onPress }: { icon: IconName; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      w={34}
      h={34}
      borderRadius="$full"
      bg="rgba(10, 9, 8, 0.55)"
      borderWidth={1}
      borderColor="rgba(255, 255, 255, 0.18)"
      alignItems="center"
      justifyContent="center"
    >
      <Icon name={icon} size={16} color={colors.textPrimary} />
    </Pressable>
  );
}

export default function CalendarScreen() {
  const { t, tArr, dateLocale } = useI18n();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
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
  const toast = useAppToast();

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

  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const monthDates = useMemo(
    () => Array.from({ length: daysInMonth(year, month) }, (_, i) => new Date(year, month, i + 1)),
    [year, month]
  );

  /**
   * Stats describe the visible span, so they follow the same dates the grid
   * draws. Adherence only counts days that have already happened - grading
   * yourself on a Saturday that hasn't arrived yet would read as failure.
   */
  const stats = useMemo(() => {
    const visible = viewMode === 'week' ? weekDates : monthDates;
    let planned = 0;
    let dueSoFar = 0;
    let hitSoFar = 0;
    for (const date of visible) {
      const key = toDateKey(date);
      if (plannedFor(date).length === 0) continue;
      planned += 1;
      if (key > todayKey) continue;
      dueSoFar += 1;
      if (dayByKey.has(key)) hitSoFar += 1;
    }
    return {
      trained: days.length,
      planned,
      rate: dueSoFar > 0 ? Math.round((hitSoFar / dueSoFar) * 100) : null,
    };
  }, [viewMode, weekDates, monthDates, plannedFor, dayByKey, days.length, todayKey]);

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
      toast({ title: t('toast.noteSaved') });
    } catch (err) {
      toast({
        title: t('toast.error'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      });
    } finally {
      setSavingNotes(false);
    }
  }

  function shift(direction: 1 | -1) {
    setAnchor((prev) =>
      viewMode === 'week' ? addDays(prev, 7 * direction) : new Date(prev.getFullYear(), prev.getMonth() + direction, 1)
    );
  }

  function jumpToToday() {
    setAnchor(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
    setSelectedDateKey(todayKey);
  }

  const leadingBlanks = mondayFirstIndex(new Date(year, month, 1).getDay());

  const selectedDateLabel = selectedDate
    ? selectedDate.toLocaleDateString(dateLocale, { weekday: 'long', day: 'numeric', month: 'long' })
    : '';

  function handleStartRoutine(routine: Routine) {
    startRoutine(routine);
    navigation.navigate('Antrenman' as never);
  }

  /**
   * One grid cell. Two independent signals stack here without crowding each
   * other: a crimson bar pinned to the top edge means a routine is planned for
   * that weekday, a gold dot under the number means work was actually logged -
   * so a planned-but-missed day reads differently from a done one.
   */
  function DayCell({ date }: { date: Date }) {
    const dateKey = toDateKey(date);
    const hasWorkout = dayByKey.has(dateKey);
    const planned = plannedFor(date).length > 0;
    const isToday = dateKey === todayKey;
    const isSelected = dateKey === selectedDateKey;
    const isFuture = dateKey > todayKey;

    const background = isSelected ? colors.primary : hasWorkout ? '#2A0A0E' : colors.surface;
    const borderColor = isSelected ? colors.accent : isToday ? colors.accent : colors.border;

    return (
      <Pressable
        onPress={() => setSelectedDateKey(dateKey)}
        flex={1}
        borderRadius="$xl"
        alignItems="center"
        justifyContent="center"
        bg={background}
        borderWidth={isSelected || isToday ? 1.5 : 1}
        borderColor={borderColor}
        overflow="hidden"
      >
        {planned && (
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            h={3}
            bg={isSelected ? '#FFFFFF' : colors.primaryLight}
          />
        )}

        <Text
          color={isSelected ? '$textDark0' : hasWorkout ? colors.textPrimary : isFuture ? colors.textMuted : colors.textSecondary}
          fontWeight={hasWorkout || isSelected || isToday ? '$black' : '$normal'}
          fontSize={14}
          fontFamily="$mono"
          mt={planned ? 3 : 0}
        >
          {date.getDate()}
        </Text>

        {/* Fixed-height slot so cells with and without a dot keep the same
            optical centre. */}
        <Box h={7} justifyContent="center">
          {hasWorkout && <Box w={5} h={5} borderRadius="$full" bg={colors.accent} />}
        </Box>
      </Pressable>
    );
  }

  function SegmentTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
    return (
      <Pressable
        onPress={onPress}
        px="$3"
        py="$1"
        borderRadius="$lg"
        bg={active ? colors.primary : 'transparent'}
        borderWidth={1}
        borderColor={active ? colors.accent : 'transparent'}
      >
        <Text
          color={active ? '$textDark0' : colors.textSecondary}
          fontSize={11}
          fontWeight="$black"
          letterSpacing={1}
          textTransform="uppercase"
        >
          {label}
        </Text>
      </Pressable>
    );
  }

  return (
    <Box flex={1} bg={colors.bg}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Hero - full-bleed crimson under the status bar, matching the routine
            detail screen so the calendar doesn't read as a plainer tab. */}
        <Box h={HERO_HEIGHT}>
          <LinearGradient
            colors={['#A31621', '#500A10', colors.bg]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: HERO_HEIGHT }}
          />
          <HeroSlashes height={HERO_HEIGHT} />

          <Box position="absolute" right={-24} top={insets.top} opacity={0.07} pointerEvents="none">
            <Icon name="calendar-outline" size={130} color="#FFFFFF" strokeWidth={1.2} />
          </Box>

          <VStack flex={1} px="$4" pt={insets.top + 8} pb={STAT_OVERLAP + 22} justifyContent="space-between">
            <HStack justifyContent="space-between" alignItems="center">
              <HStack alignItems="center" space="xs">
                <Box w={16} h={2} bg={colors.accent} />
                <Text color={colors.accent} fontSize={11} fontWeight="$bold" letterSpacing={1.6} textTransform="uppercase">
                  {t('calendar.title')}
                </Text>
              </HStack>
              <HStack space="xs" alignItems="center">
                <SegmentTab
                  label={t('calendar.viewWeek')}
                  active={viewMode === 'week'}
                  onPress={() => setViewMode('week')}
                />
                <SegmentTab
                  label={t('calendar.viewMonth')}
                  active={viewMode === 'month'}
                  onPress={() => setViewMode('month')}
                />
              </HStack>
            </HStack>

            <HStack alignItems="flex-end" justifyContent="space-between">
              <VStack flex={1} pr="$2">
                <Heading color="$textDark0" fontSize={34} lineHeight={36} numberOfLines={1}>
                  {monthLabels[month]}
                </Heading>
                <HStack alignItems="center" space="sm">
                  <Text color={colors.accentSoft} fontSize={14} fontWeight="$bold" fontFamily="$mono">
                    {year}
                  </Text>
                  <Pressable onPress={jumpToToday} hitSlop={8}>
                    <Text
                      color="$textDark0"
                      fontSize={10}
                      fontWeight="$bold"
                      letterSpacing={1}
                      textTransform="uppercase"
                      opacity={0.75}
                    >
                      {t('calendar.today')} →
                    </Text>
                  </Pressable>
                </HStack>
              </VStack>

              <HStack space="xs">
                <CircleButton icon="chevron-back" onPress={() => shift(-1)} />
                <CircleButton icon="chevron-forward" onPress={() => shift(1)} />
              </HStack>
            </HStack>
          </VStack>
        </Box>

        {/* Stat strip pulled up over the hero seam so the two blocks lock
            together instead of reading as two stacked cards. */}
        <HStack px="$4" space="sm" mt={-STAT_OVERLAP}>
          <StatCard icon="flame" value={String(stats.trained)} label={t('calendar.statTrained')} />
          <StatCard icon="calendar-outline" value={String(stats.planned)} label={t('calendar.statPlanned')} />
          <StatCard
            icon="trending-up"
            value={stats.rate == null ? '—' : String(stats.rate)}
            unit={stats.rate == null ? undefined : '%'}
            label={t('calendar.statRate')}
          />
        </HStack>

        <VStack px="$4" mt="$5" space="md">
          <Box bg={colors.surface} borderWidth={1} borderColor={colors.border} borderRadius="$2xl" p="$3" {...cardShadow}>
            <View style={{ flexDirection: 'row', paddingBottom: 8 }}>
              {weekdayLabels.map((label, idx) => (
                <View key={label} style={{ width: `${100 / 7}%`, alignItems: 'center' }}>
                  <Text
                    color={idx > 4 ? colors.textMuted : colors.textSecondary}
                    fontSize={10}
                    fontWeight="$black"
                    letterSpacing={0.8}
                    textTransform="uppercase"
                  >
                    {label}
                  </Text>
                </View>
              ))}
            </View>

            {loading ? (
              <Box py="$8" alignItems="center">
                <Spinner color="$primary400" />
              </Box>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {viewMode === 'month' &&
                  Array.from({ length: leadingBlanks }, (_, i) => (
                    <View key={`blank-${i}`} style={{ width: `${100 / 7}%`, height: CELL_HEIGHT }} />
                  ))}
                {(viewMode === 'week' ? weekDates : monthDates).map((date) => (
                  <View key={toDateKey(date)} style={{ width: `${100 / 7}%`, height: CELL_HEIGHT, padding: 3 }}>
                    <DayCell date={date} />
                  </View>
                ))}
              </View>
            )}

            {/* Legend - two marks that mean different things needs saying once. */}
            <HStack space="md" mt="$3" pt="$3" borderTopWidth={1} borderTopColor={colors.border} alignItems="center">
              <HStack alignItems="center" space="xs">
                <Box w={12} h={3} bg={colors.primaryLight} />
                <Text color={colors.textMuted} fontSize={10} textTransform="uppercase" letterSpacing={0.8}>
                  {t('calendar.legendPlanned')}
                </Text>
              </HStack>
              <HStack alignItems="center" space="xs">
                <Box w={6} h={6} borderRadius="$full" bg={colors.accent} />
                <Text color={colors.textMuted} fontSize={10} textTransform="uppercase" letterSpacing={0.8}>
                  {t('calendar.legendDone')}
                </Text>
              </HStack>
            </HStack>
          </Box>

          {selectedDateKey && selectedDate && (
            <Box bg={colors.surface} borderWidth={1} borderColor={colors.border} borderRadius="$2xl" p="$4" {...cardShadow}>
              {/* Date header: the big mono day number anchors the card so you
                  always know which cell this panel belongs to. */}
              <HStack alignItems="center" space="sm" mb="$4">
                <Box
                  w={44}
                  h={44}
                  borderRadius="$xl"
                  bg={colors.surfaceAlt}
                  borderWidth={1}
                  borderLeftWidth={3}
                  borderColor={colors.border}
                  borderLeftColor={colors.primary}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text color="$textDark0" fontSize={19} fontWeight="$black" fontFamily="$mono">
                    {selectedDate.getDate()}
                  </Text>
                </Box>
                <VStack flex={1}>
                  <Text color="$textDark0" fontWeight="$bold" size="md" textTransform="capitalize" numberOfLines={1}>
                    {selectedDateLabel}
                  </Text>
                  <Text color={colors.textMuted} fontSize={11}>
                    {daySets.length > 0
                      ? t('calendar.setsCount', { count: daySets.length })
                      : selectedIsFuture
                        ? t('calendar.emptyFuture')
                        : t('calendar.noSets')}
                  </Text>
                </VStack>
              </HStack>

              {selectedPlanned.length > 0 && (
                <VStack space="xs" mb="$4">
                  <Text color={colors.accent} fontSize={11} fontWeight="$bold" letterSpacing={1.2} textTransform="uppercase">
                    {t('calendar.planned')}
                  </Text>
                  {selectedPlanned.map((routine) => (
                    <HStack
                      key={routine.id}
                      alignItems="center"
                      space="sm"
                      bg={colors.surfaceAlt}
                      borderWidth={1}
                      borderLeftWidth={3}
                      borderColor={colors.border}
                      borderLeftColor={colors.primary}
                      borderRadius="$xl"
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

              {daySetsLoading ? (
                <Box py="$3" alignItems="center">
                  <Spinner color="$primary400" />
                </Box>
              ) : daySets.length > 0 ? (
                <VStack space="xs" mb="$4">
                  <Text color={colors.accent} fontSize={11} fontWeight="$bold" letterSpacing={1.2} textTransform="uppercase">
                    {t('calendar.logged')}
                  </Text>
                  {daySets.map((s) => {
                    const exercise = exercises.find((e) => e.id === s.exerciseId);
                    return (
                      <HStack
                        key={s.id}
                        alignItems="center"
                        justifyContent="space-between"
                        bg={colors.surfaceAlt}
                        borderWidth={1}
                        borderColor={colors.border}
                        borderRadius="$xl"
                        px="$3"
                        py="$2"
                      >
                        <HStack alignItems="center" space="sm" flex={1}>
                          <Box
                            w={28}
                            h={28}
                            borderRadius="$md"
                            bg={colors.surface}
                            borderWidth={1}
                            borderColor={colors.border}
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
                              <Text color={colors.textMuted} fontSize={10} textTransform="uppercase" letterSpacing={0.5}>
                                {t(muscleLabelKey(exercise.primaryMuscle))}
                              </Text>
                            )}
                          </VStack>
                        </HStack>
                        <Text color={colors.textSecondary} size="sm" fontWeight="$bold" fontFamily="$mono">
                          {s.weightKg}kg × {s.reps}
                        </Text>
                      </HStack>
                    );
                  })}
                </VStack>
              ) : (
                selectedPlanned.length === 0 && (
                  <Box
                    borderWidth={1}
                    borderColor={colors.border}
                    borderStyle="dashed"
                    borderRadius="$xl"
                    py="$4"
                    px="$3"
                    mb="$4"
                    alignItems="center"
                  >
                    <Text color={colors.textMuted} fontSize={12} textAlign="center">
                      {selectedIsFuture ? t('calendar.emptyFuture') : t('calendar.rest')}
                    </Text>
                  </Box>
                )
              )}

              <Button h={48} borderRadius="$xl" bg="$primary500" onPress={() => setSheetOpen(true)}>
                <HStack alignItems="center" space="xs">
                  <Icon name="add" size={17} color="#FFFFFF" />
                  <ButtonText fontWeight="$black" letterSpacing={1.2} textTransform="uppercase">
                    {t('calendar.addToDay')}
                  </ButtonText>
                </HStack>
              </Button>

              {selectedDay && (
                <VStack mt="$4" space="xs">
                  <Text color={colors.textMuted} fontSize={11} fontWeight="$bold" letterSpacing={1} textTransform="uppercase">
                    {t('calendar.noteLabel')}
                  </Text>
                  <Textarea size="md" borderColor={colors.border} borderRadius="$xl" bg={colors.surfaceAlt}>
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
                    borderColor={colors.border}
                    onPress={handleSaveNotes}
                    isDisabled={savingNotes}
                  >
                    <ButtonText color="$textDark0">{savingNotes ? '...' : t('calendar.saveNote')}</ButtonText>
                  </Button>
                </VStack>
              )}
            </Box>
          )}
        </VStack>
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
            toast({
              title: t('toast.scheduleOn'),
              description: t('toast.everyDay', {
                day: selectedDate.toLocaleDateString(dateLocale, { weekday: 'long' }),
              }),
            });
          }}
          onLogSet={async (exerciseId, name, weightKg, reps) => {
            await logSet(exerciseId, name, weightKg, reps, 'normal', undefined, selectedDateKey);
            await reloadDays();
            toast({ title: t('toast.setLogged'), description: `${name} · ${weightKg}kg × ${reps}` });
            if (selectedDay) {
              setDaySets(await fetchSetsForWorkout(selectedDay.workoutId));
            }
          }}
        />
      )}
    </Box>
  );
}
