import React, { useMemo, useState } from 'react';
import { ScrollView } from 'react-native';
import { Box, VStack, HStack, Text, Input, InputField, InputSlot, Pressable } from '@gluestack-ui/themed';
import Icon from '@/components/Icon';
import { Exercise, MuscleGroup } from '@/types';
import { muscleLabelKey, MUSCLE_ICONS, ALL_MUSCLES } from '@/constants/muscleGroups';
import { useI18n } from '@/i18n';
import { colors } from '@/theme';

interface Props {
  exercises: Exercise[];
  selectedExerciseId: string | null;
  onSelect: (exerciseId: string) => void;
  /** Caps the scrollable list so sibling controls stay visible in a modal. */
  maxHeight?: number;
}

/**
 * Searchable, muscle-grouped exercise list shared by the workout picker and
 * the routine builder. Both used to render their own list and had drifted -
 * the routine one was a flat unsearchable dump, which is exactly the part
 * that made adding exercises tedious.
 *
 * Selection is reported upward only; the caller decides whether picking an
 * exercise closes the sheet (workout picker) or stays open so sets and reps
 * can be set next (routine builder).
 */
export default function ExerciseBrowser({ exercises, selectedExerciseId, onSelect, maxHeight }: Props) {
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<MuscleGroup | null>(null);

  // Only offer chips for muscles that actually have exercises, so the filter
  // row never leads somewhere empty.
  const availableMuscles = useMemo(
    () => ALL_MUSCLES.filter((muscle) => exercises.some((e) => e.primaryMuscle === muscle)),
    [exercises]
  );

  const grouped = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = exercises.filter(
      (e) => (!query || e.name.toLowerCase().includes(query)) && (!filter || e.primaryMuscle === filter)
    );
    return ALL_MUSCLES.map((muscle) => ({
      muscle,
      items: filtered.filter((e) => e.primaryMuscle === muscle),
    })).filter((group) => group.items.length > 0);
  }, [exercises, search, filter]);

  const resultCount = useMemo(() => grouped.reduce((sum, g) => sum + g.items.length, 0), [grouped]);

  return (
    <VStack space="sm">
      <Input variant="outline" size="md" borderColor="$borderDark700" borderRadius="$lg" bg="$backgroundDark800">
        <InputSlot pl="$3">
          <Icon name="search" size={16} color={colors.textMuted} />
        </InputSlot>
        <InputField
          placeholder={t('picker.search')}
          placeholderTextColor={colors.textMuted}
          color="$textDark0"
          value={search}
          onChangeText={setSearch}
        />
        <InputSlot pr="$3">
          <Text color="$textDark600" size="2xs" fontFamily="$mono">
            {t('picker.results', { count: resultCount })}
          </Text>
        </InputSlot>
      </Input>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <HStack space="xs" pr="$2">
          <Pressable
            onPress={() => setFilter(null)}
            bg={filter === null ? colors.primary : '$backgroundDark800'}
            borderWidth={1}
            borderColor={filter === null ? colors.accent : '$borderDark700'}
            borderRadius="$xl"
            px="$3"
            py="$1"
            justifyContent="center"
          >
            <Text
              color={filter === null ? '$textDark0' : colors.textMuted}
              fontSize={11}
              fontWeight="$bold"
              letterSpacing={0.6}
              textTransform="uppercase"
            >
              {t('picker.all')}
            </Text>
          </Pressable>

          {availableMuscles.map((muscle) => {
            const active = filter === muscle;
            return (
              <Pressable
                key={muscle}
                onPress={() => setFilter(active ? null : muscle)}
                bg={active ? colors.primary : '$backgroundDark800'}
                borderWidth={1}
                borderColor={active ? colors.accent : '$borderDark700'}
                borderRadius="$xl"
                px="$3"
                py="$1"
                flexDirection="row"
                alignItems="center"
              >
                <Icon name={MUSCLE_ICONS[muscle]} size={12} color={active ? colors.accentSoft : colors.textMuted} />
                <Text
                  color={active ? '$textDark0' : colors.textMuted}
                  fontSize={11}
                  fontWeight="$bold"
                  letterSpacing={0.6}
                  textTransform="uppercase"
                  ml="$1"
                >
                  {t(muscleLabelKey(muscle))}
                </Text>
              </Pressable>
            );
          })}
        </HStack>
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} style={maxHeight ? { maxHeight } : undefined}>
        <VStack space="lg" pb="$2">
          {grouped.map(({ muscle, items }) => (
            <VStack key={muscle} space="xs">
              {/* Redundant once a single muscle is filtered - the active chip
                  already says which group you're in. */}
              {filter === null && (
                <HStack alignItems="center" space="xs" mb="$1">
                  <Box
                    w={26}
                    h={26}
                    borderRadius="$full"
                    bg="$backgroundDark800"
                    borderWidth={1}
                    borderColor="$borderDark700"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Icon name={MUSCLE_ICONS[muscle]} size={13} color={colors.primaryLight} />
                  </Box>
                  <Text color="$textDark500" size="xs" fontWeight="$bold" letterSpacing={0.5} textTransform="uppercase">
                    {t(muscleLabelKey(muscle))}
                  </Text>
                  <Text color="$textDark600" size="2xs" fontFamily="$mono">
                    {items.length}
                  </Text>
                </HStack>
              )}

              {items.map((item) => {
                const active = item.id === selectedExerciseId;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => onSelect(item.id)}
                    bg={active ? '$primary900' : '$backgroundDark800'}
                    borderWidth={1}
                    borderLeftWidth={active ? 3 : 1}
                    borderColor={active ? colors.accent : '$borderDark700'}
                    borderLeftColor={active ? colors.primary : '$borderDark700'}
                    borderRadius="$lg"
                    px="$3"
                    py="$3"
                    flexDirection="row"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Text color="$textDark0" size="sm" fontWeight={active ? '$bold' : '$medium'} flex={1} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {active && <Icon name="checkmark" size={16} color={colors.accent} />}
                  </Pressable>
                );
              })}
            </VStack>
          ))}

          {grouped.length === 0 && (
            <Text color="$textDark500" size="sm" textAlign="center" mt="$4">
              {t('picker.noMatch')}
            </Text>
          )}
        </VStack>
      </ScrollView>
    </VStack>
  );
}
