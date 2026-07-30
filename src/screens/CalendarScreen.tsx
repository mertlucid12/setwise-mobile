import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView } from 'react-native';
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
import { useCalendarRange } from '@/hooks/useCalendarMonth';
import { useExercises } from '@/hooks/useExercises';
import { fetchSetsForWorkout } from '@/services/workouts';
import { SetEntry } from '@/types';
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

function mondayFirstIndex(jsDay: number): number {
  return (jsDay + 6) % 7;
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
  const monthLabels = tArr('calendar.months');
  const weekdayLabels = tArr('calendar.weekdays');
  const today = useMemo(() => new Date(), []);
  const todayKey = toDateKey(today);

  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [anchor, setAnchor] = useState(() => new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [daySets, setDaySets] = useState<SetEntry[]>([]);
  const [daySetsLoading, setDaySetsLoading] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

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

  const { days, loading, saveNotes } = useCalendarRange(rangeStartMs, rangeEndMs);
  const { exercises } = useExercises();

  const dayByKey = useMemo(() => new Map(days.map((d) => [d.dateKey, d])), [days]);
  const selectedDay = selectedDateKey ? dayByKey.get(selectedDateKey) ?? null : null;

  // Dropping the selection when the visible range moves avoids showing a
  // detail card for a day that's no longer on screen.
  useEffect(() => {
    setSelectedDateKey(null);
  }, [rangeStartMs, rangeEndMs]);

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

  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const leadingBlanks = mondayFirstIndex(new Date(year, month, 1).getDay());
  const monthCells: (number | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth(year, month) }, (_, i) => i + 1),
  ];

  const selectedDateLabel = selectedDay
    ? new Date(`${selectedDay.dateKey}T00:00:00`).toLocaleDateString(dateLocale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    : null;

  function DayCircle({ date, compact }: { date: Date; compact: boolean }) {
    const dateKey = toDateKey(date);
    const hasWorkout = dayByKey.has(dateKey);
    const isToday = dateKey === todayKey;
    const isSelected = dateKey === selectedDateKey;
    return (
      <Pressable
        onPress={() => hasWorkout && setSelectedDateKey(isSelected ? null : dateKey)}
        flex={compact ? undefined : 1}
        w={compact ? 38 : undefined}
        h={compact ? 38 : undefined}
        aspectRatio={compact ? undefined : 1}
        borderRadius="$full"
        alignItems="center"
        justifyContent="center"
        bg={isSelected ? '$primary500' : hasWorkout ? '$primary900' : 'transparent'}
        borderWidth={isToday ? 1.5 : 0}
        borderColor={colors.accent}
      >
        <Text
          color={isSelected ? '$textDark0' : hasWorkout ? colors.primaryLight : '$textDark600'}
          fontWeight={hasWorkout || isSelected ? '$bold' : '$normal'}
          size="sm"
        >
          {date.getDate()}
        </Text>
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
          <Box bg="$backgroundDark900" borderWidth={1} borderColor="$borderDark800" borderRadius="$xl" p="$4" mb="$4" {...cardShadow}>
            <HStack alignItems="center" justifyContent="space-between" mb="$4">
              <HStack alignItems="center" space="sm">
                <Heading color="$textDark0" size="md">
                  {monthLabels[month]} {year}
                </Heading>
                <Pressable
                  onPress={() => setViewMode((m) => (m === 'week' ? 'month' : 'week'))}
                  hitSlop={10}
                  flexDirection="row"
                  alignItems="center"
                  bg="$backgroundDark800"
                  borderRadius="$full"
                  px="$2"
                  py="$1"
                >
                  <Icon
                    name={viewMode === 'week' ? 'chevron-down' : 'chevron-up'}
                    size={14}
                    color={colors.accent}
                  />
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
                    <DayCircle date={date} compact />
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
                      <View key={`blank-${idx}`} style={{ width: `${100 / 7}%`, aspectRatio: 1 }} />
                    ) : (
                      <View key={day} style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 3 }}>
                        <DayCircle date={new Date(year, month, day)} compact={false} />
                      </View>
                    )
                  )}
                </View>
              </>
            )}
          </Box>

          {selectedDay ? (
            <Box bg="$backgroundDark900" borderWidth={1} borderColor="$borderDark800" borderRadius="$xl" p="$4" mb="$6" {...cardShadow}>
              <HStack alignItems="center" justifyContent="space-between" mb="$3">
                <Text color="$textDark0" fontWeight="$bold" size="md" textTransform="capitalize">
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

              {daySetsLoading ? (
                <Box py="$3" alignItems="center">
                  <Spinner color="$primary400" />
                </Box>
              ) : daySets.length === 0 ? (
                <Text color="$textDark500" size="sm" mb="$3">
                  {t('calendar.noSets')}
                </Text>
              ) : (
                <VStack space="xs" mb="$4">
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
                            borderRadius="$full"
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
              )}

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
              <Button borderRadius="$lg" bg="$primary500" onPress={handleSaveNotes} isDisabled={savingNotes}>
                <ButtonText>{savingNotes ? '...' : t('calendar.saveNote')}</ButtonText>
              </Button>
            </Box>
          ) : (
            !loading &&
            days.length > 0 && (
              <HStack
                bg="$backgroundDark900"
                borderWidth={1}
                borderColor="$borderDark800"
                borderRadius="$xl"
                p="$4"
                mb="$6"
                alignItems="center"
                space="sm"
              >
                <Icon name="finger-print-outline" size={16} color={colors.textMuted} />
                <Text color="$textDark500" size="xs" flex={1}>
                  {t('calendar.tapHint')}
                </Text>
              </HStack>
            )
          )}
        </ScrollView>
      </Box>
    </SafeAreaView>
  );
}
