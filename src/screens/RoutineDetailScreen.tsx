import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Box, VStack, HStack, Heading, Text, Button, ButtonText, Pressable, Spinner } from '@gluestack-ui/themed';
import Icon, { IconName } from '@/components/Icon';
import HeroSlashes from '@/components/HeroSlashes';
import { useAppToast } from '@/components/AppToast';
import AddRoutineExerciseModal from '@/components/AddRoutineExerciseModal';
import { useRoutines } from '@/hooks/useRoutines';
import { useRoutineSchedules } from '@/hooks/useRoutineSchedules';
import { useExercises } from '@/hooks/useExercises';
import { useActiveRoutine } from '@/contexts/ActiveRoutineContext';
import { useI18n } from '@/i18n';
import { computeRoutineStats } from '@/services/routineStats';
import { muscleLabelKey, MUSCLE_ICONS } from '@/constants/muscleGroups';
import { colors, cardShadow } from '@/theme';
import { RoutinesStackParamList } from '@/navigation/types';
import { Weekday } from '@/types';

const WEEKDAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

const HERO_HEIGHT = 290;
/** How far the stat strip rides up over the hero's bottom edge. */
const STAT_OVERLAP = 22;
/** Hero content must clear the overlap plus breathing room, or the stat cards
 *  sit on top of the muscle chips. */
const HERO_CONTENT_BOTTOM = STAT_OVERLAP + 24;

type DetailRoute = RouteProp<RoutinesStackParamList, 'RoutineDetail'>;

function CircleButton({ icon, onPress, tint }: { icon: IconName; onPress: () => void; tint?: string }) {
  return (
    <Pressable
      onPress={onPress}
      w={38}
      h={38}
      borderRadius="$full"
      bg="rgba(10, 9, 8, 0.55)"
      borderWidth={1}
      borderColor="rgba(255, 255, 255, 0.18)"
      alignItems="center"
      justifyContent="center"
    >
      <Icon name={icon} size={18} color={tint ?? colors.textPrimary} />
    </Pressable>
  );
}

/** One slot of the stat strip: gold icon, mono value, uppercase caption. */
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

export default function RoutineDetailScreen() {
  const { t, tArr } = useI18n();
  const weekdayLabels = tArr('calendar.weekdays');
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { routineId } = useRoute<DetailRoute>().params;

  const { routines, loading, deleteRoutine, addExerciseToRoutine, removeExerciseFromRoutine } = useRoutines();
  const { exercises } = useExercises();
  const { weekdaysForRoutine, toggleWeekday } = useRoutineSchedules();
  const { startRoutine } = useActiveRoutine();
  const toast = useAppToast();
  const [addVisible, setAddVisible] = useState(false);

  const routine = routines.find((r) => r.id === routineId) ?? null;

  if (loading) {
    return (
      <Box flex={1} bg={colors.bg} alignItems="center" justifyContent="center">
        <Spinner color="$primary400" />
      </Box>
    );
  }

  if (!routine) {
    return (
      <Box flex={1} bg={colors.bg} alignItems="center" justifyContent="center" px="$6">
        <Text color={colors.textMuted} size="sm" mb="$4">
          {t('routineDetail.notFound')}
        </Text>
        <Button borderRadius="$xl" bg="$primary500" onPress={() => navigation.goBack()}>
          <ButtonText>{t('routineDetail.back')}</ButtonText>
        </Button>
      </Box>
    );
  }

  const stats = computeRoutineStats(routine, exercises);
  const scheduledDays = weekdaysForRoutine(routine.id);

  async function handleDelete() {
    if (!routine) return;
    const title = routine.title;
    await deleteRoutine(routine.id);
    toast({ title: t('toast.routineDeleted'), description: title, variant: 'error' });
    navigation.goBack();
  }

  async function handleToggleWeekday(weekday: Weekday) {
    if (!routine) return;
    const wasActive = scheduledDays.includes(weekday);
    await toggleWeekday(routine.id, weekday);
    toast({
      title: wasActive ? t('toast.scheduleOff') : t('toast.scheduleOn'),
      description: t('toast.everyDay', { day: weekdayLabels[weekday] }),
      variant: wasActive ? 'info' : 'success',
    });
  }

  function handleStart() {
    if (!routine) return;
    startRoutine(routine);
    navigation.navigate('Antrenman' as never);
  }

  return (
    <Box flex={1} bg={colors.bg}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        {/* Hero - deliberately full-bleed under the status bar so the crimson
            reaches the top edge of the device rather than sitting in a box. */}
        <Box h={HERO_HEIGHT}>
          <LinearGradient
            colors={['#A31621', '#500A10', colors.bg]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: HERO_HEIGHT }}
          />
          <HeroSlashes height={HERO_HEIGHT} />

          {/* Watermark sits high and clipped to the right so it never lands
              behind the title block at the hero's bottom. */}
          {stats.muscles[0] && (
            <Box position="absolute" right={-30} top={insets.top} opacity={0.07} pointerEvents="none">
              <Icon name={MUSCLE_ICONS[stats.muscles[0]]} size={140} color="#FFFFFF" strokeWidth={1.2} />
            </Box>
          )}

          <VStack flex={1} px="$4" pt={insets.top + 8} pb={HERO_CONTENT_BOTTOM} justifyContent="space-between">
            <HStack justifyContent="space-between" alignItems="center">
              <CircleButton icon="chevron-back" onPress={() => navigation.goBack()} />
              <CircleButton icon="trash-outline" onPress={handleDelete} tint={colors.danger} />
            </HStack>

            <VStack space="xs">
              <HStack alignItems="center" space="xs">
                <Box w={16} h={2} bg={colors.accent} />
                <Text color={colors.accent} fontSize={11} fontWeight="$bold" letterSpacing={1.6} textTransform="uppercase">
                  {t('routineDetail.label')}
                </Text>
              </HStack>
              <Heading color="$textDark0" fontSize={36} lineHeight={38} numberOfLines={2}>
                {routine.title}
              </Heading>
              {stats.muscles.length > 0 && (
                // Deliberately no wrap: a second chip row would grow upward
                // into the title instead of pushing the block down.
                <HStack space="xs" mt="$1" alignItems="center">
                  {stats.muscles.slice(0, 3).map((muscle) => (
                    <HStack
                      key={muscle}
                      alignItems="center"
                      space="xs"
                      bg="rgba(10, 9, 8, 0.45)"
                      borderWidth={1}
                      borderColor="rgba(255, 255, 255, 0.14)"
                      borderRadius="$xl"
                      px="$2"
                      py="$1"
                    >
                      <Icon name={MUSCLE_ICONS[muscle]} size={11} color={colors.accentSoft} />
                      <Text color="$textDark0" fontSize={11} fontWeight="$semibold">
                        {t(muscleLabelKey(muscle))}
                      </Text>
                    </HStack>
                  ))}
                  {stats.muscles.length > 3 && (
                    <Text color={colors.accentSoft} fontSize={11} fontWeight="$bold" fontFamily="$mono">
                      +{stats.muscles.length - 3}
                    </Text>
                  )}
                </HStack>
              )}
            </VStack>
          </VStack>
        </Box>

        {/* Stat strip pulled up over the hero seam so the two blocks lock
            together instead of reading as two stacked cards. */}
        <HStack px="$4" space="sm" mt={-STAT_OVERLAP}>
          <StatCard
            icon="time-outline"
            value={stats.estimatedMinutes > 0 ? `~${stats.estimatedMinutes}` : '—'}
            unit={stats.estimatedMinutes > 0 ? t('routineDetail.minutesShort') : undefined}
            label={t('routineDetail.duration')}
          />
          <StatCard icon="barbell" value={String(stats.totalSets)} label={t('routineDetail.sets')} />
          <StatCard icon="list" value={String(stats.exerciseCount)} label={t('routineDetail.exercisesStat')} />
        </HStack>

        {/* Weekly plan. Scheduling here is what makes the routine show up on
            the calendar every week without creating a row per date. */}
        <VStack px="$4" mt="$5" space="sm">
          <VStack space="xs">
            <Text color={colors.accent} fontSize={12} fontWeight="$bold" letterSpacing={1.2} textTransform="uppercase">
              {t('routineDetail.schedule')}
            </Text>
            <Text color={colors.textMuted} fontSize={11}>
              {scheduledDays.length > 0
                ? t('routineDetail.scheduleActive', {
                    days: scheduledDays
                      .slice()
                      .sort((a, b) => a - b)
                      .map((d) => weekdayLabels[d])
                      .join(', '),
                  })
                : t('routineDetail.scheduleHint')}
            </Text>
          </VStack>

          <HStack space="xs" mb="$2">
            {WEEKDAYS.map((weekday) => {
              const active = scheduledDays.includes(weekday);
              return (
                <Pressable
                  key={weekday}
                  onPress={() => handleToggleWeekday(weekday)}
                  flex={1}
                  h={42}
                  borderRadius="$xl"
                  bg={active ? colors.primary : colors.surface}
                  borderWidth={1}
                  borderColor={active ? colors.accent : colors.border}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text
                    color={active ? '$textDark0' : colors.textMuted}
                    fontSize={11}
                    fontWeight="$black"
                    letterSpacing={0.5}
                    textTransform="uppercase"
                  >
                    {weekdayLabels[weekday]}
                  </Text>
                </Pressable>
              );
            })}
          </HStack>

          <HStack justifyContent="space-between" alignItems="center">
            <Text color={colors.accent} fontSize={12} fontWeight="$bold" letterSpacing={1.2} textTransform="uppercase">
              {t('routineDetail.exercises')}
            </Text>
            {stats.totalReps > 0 && (
              <Text color={colors.textMuted} fontSize={11} fontFamily="$mono">
                {t('routineDetail.totalReps', { reps: stats.totalReps })}
              </Text>
            )}
          </HStack>

          {routine.exercises.length === 0 ? (
            <Box bg={colors.surface} borderWidth={1} borderColor={colors.border} borderRadius="$2xl" p="$4">
              <Text color={colors.textMuted} size="sm">
                {t('routineDetail.empty')}
              </Text>
            </Box>
          ) : (
            routine.exercises.map((ex, index) => {
              const muscle = exercises.find((e) => e.id === ex.exerciseId)?.primaryMuscle;
              return (
                <HStack
                  key={ex.id}
                  alignItems="center"
                  space="sm"
                  bg={colors.surface}
                  borderWidth={1}
                  borderColor={colors.border}
                  borderRadius="$2xl"
                  px="$3"
                  py="$3"
                  {...cardShadow}
                >
                  {/* Square, not circular - the angular badge is the geometry
                      lever from the theme carried down to row level. */}
                  <Box
                    w={30}
                    h={30}
                    borderRadius="$md"
                    bg={colors.surfaceAlt}
                    borderWidth={1}
                    borderLeftWidth={3}
                    borderColor={colors.border}
                    borderLeftColor={colors.primary}
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text color={colors.accent} fontSize={12} fontWeight="$black" fontFamily="$mono">
                      {index + 1}
                    </Text>
                  </Box>

                  <VStack flex={1}>
                    <Text color="$textDark0" fontWeight="$bold" size="sm" numberOfLines={1}>
                      {ex.name}
                    </Text>
                    {muscle && (
                      <Text color={colors.textMuted} fontSize={11}>
                        {t(muscleLabelKey(muscle))}
                      </Text>
                    )}
                  </VStack>

                  <Text color={colors.textSecondary} fontSize={13} fontWeight="$bold" fontFamily="$mono">
                    {ex.targetSets}×{ex.targetReps}
                  </Text>

                  <Pressable
                    onPress={async () => {
                      await removeExerciseFromRoutine(routine.id, ex.id);
                      toast({ title: t('toast.exerciseRemoved'), description: ex.name, variant: 'info' });
                    }}
                    hitSlop={8}
                    ml="$1"
                  >
                    <Icon name="close" size={16} color={colors.textMuted} />
                  </Pressable>
                </HStack>
              );
            })
          )}

          <Pressable
            onPress={() => setAddVisible(true)}
            borderWidth={1}
            borderColor={colors.accent}
            borderStyle="dashed"
            borderRadius="$2xl"
            py="$3"
            alignItems="center"
            mt="$1"
          >
            <HStack alignItems="center" space="xs">
              <Icon name="add" size={15} color={colors.accent} />
              <Text color={colors.accent} fontSize={12} fontWeight="$bold" letterSpacing={0.8} textTransform="uppercase">
                {t('routineDetail.addExercise')}
              </Text>
            </HStack>
          </Pressable>
        </VStack>
      </ScrollView>

      {/* Docked action bar - START stays reachable no matter how long the
          exercise list grows. */}
      <Box
        position="absolute"
        left={0}
        right={0}
        bottom={0}
        px="$4"
        pt="$3"
        pb="$4"
        bg={colors.bg}
        borderTopWidth={1}
        borderTopColor={colors.border}
      >
        <Button
          h={54}
          borderRadius="$2xl"
          bg="$primary500"
          isDisabled={routine.exercises.length === 0}
          onPress={handleStart}
          {...cardShadow}
        >
          <HStack alignItems="center" space="sm">
            <Icon name="flame" size={19} color="#FFFFFF" />
            <ButtonText fontSize={15} fontWeight="$black" letterSpacing={1.4} textTransform="uppercase">
              {t('routineDetail.start')}
            </ButtonText>
          </HStack>
        </Button>
      </Box>

      <AddRoutineExerciseModal
        visible={addVisible}
        onClose={() => setAddVisible(false)}
        exercises={exercises}
        onAdd={async (exerciseId, name, targetSets, targetReps) => {
          await addExerciseToRoutine(routine.id, exerciseId, name, targetSets, targetReps);
          toast({ title: t('toast.exerciseAdded'), description: `${name} · ${targetSets}×${targetReps}` });
        }}
      />
    </Box>
  );
}
