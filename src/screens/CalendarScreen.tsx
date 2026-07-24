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
import { Ionicons } from '@expo/vector-icons';
import { useCalendarMonth } from '@/hooks/useCalendarMonth';
import { useExercises } from '@/hooks/useExercises';
import { fetchSetsForWorkout } from '@/services/workouts';
import { SetEntry } from '@/types';
import AnimatedBackground from '@/components/AnimatedBackground';
import { colors, cardShadow } from '@/theme';

const MONTH_LABELS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];
const WEEKDAY_LABELS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function mondayFirstIndex(jsDay: number): number {
  return (jsDay + 6) % 7;
}

export default function CalendarScreen() {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [daySets, setDaySets] = useState<SetEntry[]>([]);
  const [daySetsLoading, setDaySetsLoading] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const { days, loading, saveNotes } = useCalendarMonth(year, month);
  const { exercises } = useExercises();

  const dayByKey = useMemo(() => new Map(days.map((d) => [d.dateKey, d])), [days]);
  const selectedDay = selectedDateKey ? dayByKey.get(selectedDateKey) ?? null : null;

  useEffect(() => {
    setSelectedDateKey(null);
  }, [year, month]);

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

  const leadingBlanks = mondayFirstIndex(new Date(year, month, 1).getDay());
  const totalDays = daysInMonth(year, month);
  const cells: (number | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Box flex={1} bg="$backgroundDark950" px="$4" pt="$4">
        <AnimatedBackground />
        <Text color={colors.accent} fontSize={12} fontWeight="$bold" letterSpacing={1.2} textTransform="uppercase">
          Geçmiş
        </Text>
        <Heading color="$textDark0" size="xl" mb="$3">
          Takvim
        </Heading>

        <HStack alignItems="center" justifyContent="space-between" mb="$3">
          <Pressable onPress={() => setCursor(new Date(year, month - 1, 1))} hitSlop={8} p="$2">
            <Ionicons name="chevron-back" size={20} color={colors.textMuted} />
          </Pressable>
          <Text color="$textDark0" fontWeight="$bold" size="md">
            {MONTH_LABELS[month]} {year}
          </Text>
          <Pressable onPress={() => setCursor(new Date(year, month + 1, 1))} hitSlop={8} p="$2">
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </Pressable>
        </HStack>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Box bg="$backgroundDark900" borderWidth={1} borderColor="$borderDark800" borderRadius="$xl" p="$3" mb="$3" {...cardShadow}>
            <View style={{ flexDirection: 'row' }}>
              {WEEKDAY_LABELS.map((label) => (
                <View key={label} style={{ width: `${100 / 7}%`, alignItems: 'center', paddingBottom: 6 }}>
                  <Text color="$textDark500" size="xs" fontWeight="$semibold">
                    {label}
                  </Text>
                </View>
              ))}
            </View>

            {loading ? (
              <Box py="$4" alignItems="center">
                <Spinner color="$primary400" />
              </Box>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {cells.map((day, idx) => {
                  if (day == null) return <View key={`blank-${idx}`} style={{ width: `${100 / 7}%`, aspectRatio: 1 }} />;
                  const dateKey = toDateKey(new Date(year, month, day));
                  const hasWorkout = dayByKey.has(dateKey);
                  const isToday = dateKey === toDateKey(today);
                  const isSelected = dateKey === selectedDateKey;
                  return (
                    <View key={dateKey} style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 2 }}>
                      <Pressable
                        onPress={() => hasWorkout && setSelectedDateKey(isSelected ? null : dateKey)}
                        flex={1}
                        borderRadius="$lg"
                        alignItems="center"
                        justifyContent="center"
                        bg={isSelected ? '$primary500' : 'transparent'}
                        borderWidth={isToday && !isSelected ? 1 : 0}
                        borderColor={colors.accent}
                      >
                        <Text
                          color={isSelected ? '$textDark0' : hasWorkout ? '$textDark0' : '$textDark600'}
                          fontWeight={hasWorkout ? '$bold' : '$normal'}
                          size="sm"
                        >
                          {day}
                        </Text>
                        {hasWorkout && (
                          <Box
                            w={4}
                            h={4}
                            borderRadius="$full"
                            bg={isSelected ? '$textDark0' : colors.primaryLight}
                            mt={2}
                          />
                        )}
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}
          </Box>

          {selectedDay && (
            <Box bg="$backgroundDark900" borderWidth={1} borderColor="$borderDark800" borderRadius="$xl" p="$4" mb="$6" {...cardShadow}>
              <Text color={colors.accent} size="xs" fontWeight="$bold" letterSpacing={1} textTransform="uppercase" mb="$2">
                {selectedDateKey}
              </Text>

              {daySetsLoading ? (
                <Spinner color="$primary400" />
              ) : daySets.length === 0 ? (
                <Text color="$textDark500" size="sm" mb="$3">
                  Bu günde kayıtlı set yok.
                </Text>
              ) : (
                <VStack space="xs" mb="$3">
                  {daySets.map((s) => (
                    <HStack key={s.id} justifyContent="space-between" bg="$backgroundDark800" borderRadius="$lg" px="$3" py="$2">
                      <Text color="$textDark0" size="sm" flex={1} numberOfLines={1}>
                        {exercises.find((e) => e.id === s.exerciseId)?.name ?? s.exerciseId}
                      </Text>
                      <Text color="$textDark400" size="sm" fontWeight="$semibold" fontFamily="$mono">
                        {s.weightKg}kg × {s.reps}
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              )}

              <Text color="$textDark400" size="xs" mb="$1">
                Not (ör. nasıl beslendiğin, nasıl hissettiğin)
              </Text>
              <Textarea size="md" borderColor="$borderDark700" borderRadius="$lg" bg="$backgroundDark800" mb="$3">
                <TextareaInput
                  placeholder="Bu gün işe yarayan bir şey oldu mu?"
                  placeholderTextColor={colors.textMuted}
                  color="$textDark0"
                  value={notesDraft}
                  onChangeText={setNotesDraft}
                />
              </Textarea>
              <Button borderRadius="$lg" bg="$primary500" onPress={handleSaveNotes} isDisabled={savingNotes}>
                <ButtonText>{savingNotes ? '...' : 'Notu kaydet'}</ButtonText>
              </Button>
            </Box>
          )}
        </ScrollView>
      </Box>
    </SafeAreaView>
  );
}
