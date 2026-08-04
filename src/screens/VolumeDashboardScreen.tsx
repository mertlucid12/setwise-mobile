import React from 'react';
import { FlatList } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Progress,
  ProgressFilledTrack,
  Spinner,
  SafeAreaView,
} from '@gluestack-ui/themed';
import Icon, { IconName } from '@/components/Icon';
import { computeWeeklyMuscleVolume, computeMuscleRecovery, RecoveryStatus } from '@/services/volume';
import { useExercises } from '@/hooks/useExercises';
import { useWorkoutSets } from '@/hooks/useWorkoutSets';
import { useProfile } from '@/hooks/useProfile';
import { useI18n } from '@/i18n';
import { MuscleVolumeSummary } from '@/types';
import { muscleLabelKey } from '@/constants/muscleGroups';
import BodyRecoveryMap, { RECOVERY_COLOR } from '@/components/BodyRecoveryMap';
import AnimatedBackground from '@/components/AnimatedBackground';
import { colors, cardShadow } from '@/theme';

const RECOVERY_LABEL_KEY: Record<RecoveryStatus, string> = {
  untrained: 'volume.statusUntrained',
  fatigued: 'volume.statusFatigued',
  recovering: 'volume.statusRecovering',
  fresh: 'volume.statusFresh',
};

/**
 * Same ramp as the recovery map, same reason: `primaryLight` and `danger` are
 * the same salmon, so "on target" and "over target" used to be one colour on
 * both the badge and the progress bar. Gold is the state you want here too,
 * with under- and over-target reading as the two directions off it.
 */
const STATUS_COLOR: Record<MuscleVolumeSummary['status'], string> = {
  below: colors.statusWarm,
  in_range: colors.statusReady,
  above: colors.statusHot,
};

const STATUS_LABEL_KEY: Record<MuscleVolumeSummary['status'], string> = {
  below: 'volume.statusBelow',
  in_range: 'volume.statusInRange',
  above: 'volume.statusAbove',
};

const STATUS_ICON: Record<MuscleVolumeSummary['status'], IconName> = {
  below: 'trending-down',
  in_range: 'checkmark-circle',
  above: 'alert-circle',
};

export default function VolumeDashboardScreen() {
  const { t } = useI18n();
  const { exercises, loading: exercisesLoading } = useExercises();
  const { sets, loading: setsLoading } = useWorkoutSets();
  const { profile } = useProfile();

  if (exercisesLoading || setsLoading) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <Box flex={1} bg="transparent" alignItems="center" justifyContent="center">
          <Spinner color="$primary400" />
        </Box>
      </SafeAreaView>
    );
  }

  const summary = computeWeeklyMuscleVolume(sets, exercises);
  const recovery = computeMuscleRecovery(sets, exercises);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Box flex={1} bg="transparent" px="$4" pt="$4">
        <AnimatedBackground />
        <Text color={colors.accent} fontSize={12} fontWeight="$bold" letterSpacing={1.2} textTransform="uppercase">
          {t('volume.thisWeek')}
        </Text>
        <Heading color="$textDark0" size="xl" mb="$1">
          {t('volume.title')}
        </Heading>
        <Text color="$textDark500" size="sm" mb="$4">
          {t('volume.subtitle')}
        </Text>

        <FlatList
          data={summary}
          keyExtractor={(item) => item.muscle}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Box bg="$backgroundDark900" borderWidth={1} borderColor="$borderDark800" borderRadius="$xl" p="$4" mb="$4" {...cardShadow}>
              <Text color="$textDark0" fontWeight="$bold" size="md" mb="$1">
                {t('volume.recovery')}
              </Text>
              <Text color="$textDark500" size="xs" mb="$3">
                {t('volume.recoverySubtitle')}
              </Text>

              <BodyRecoveryMap recovery={recovery} gender={profile.gender} />

              {/* The legend is the only place the four colours sit side by
                  side, so it has to be readable on its own - a 8px dot in
                  $textDark500 was too small and too dim to be the key to the
                  map above it. */}
              <HStack space="md" mt="$3" flexWrap="wrap" justifyContent="center">
                {(['fresh', 'recovering', 'fatigued', 'untrained'] as const).map((status) => (
                  <HStack key={status} alignItems="center" space="xs" mr="$3" mb="$1">
                    <Box
                      w={12}
                      h={12}
                      bg={RECOVERY_COLOR[status]}
                      borderWidth={1}
                      borderColor={colors.bg}
                    />
                    <Text color={colors.textSecondary} size="xs">
                      {t(RECOVERY_LABEL_KEY[status])}
                    </Text>
                  </HStack>
                ))}
              </HStack>

              {recovery.some((r) => r.status !== 'untrained') && (
                <HStack flexWrap="wrap" mt="$3">
                  {recovery
                    .filter((r) => r.status !== 'untrained')
                    .sort((a, b) => (a.daysSinceTrained ?? 0) - (b.daysSinceTrained ?? 0))
                    .map((r) => (
                      <HStack
                        key={r.muscle}
                        alignItems="center"
                        space="xs"
                        bg="$backgroundDark800"
                        borderRadius="$full"
                        px="$3"
                        py="$1"
                        mr="$2"
                        mb="$2"
                      >
                        <Box w={8} h={8} bg={RECOVERY_COLOR[r.status]} />
                        <Text color="$textDark300" size="2xs" fontWeight="$semibold">
                          {t(muscleLabelKey(r.muscle))}
                        </Text>
                        <Text color="$textDark600" size="2xs" fontFamily="$mono">
                          {r.daysSinceTrained === 0 ? t('volume.today') : t('volume.daysAgo', { days: r.daysSinceTrained ?? 0 })}
                        </Text>
                      </HStack>
                    ))}
                </HStack>
              )}
            </Box>
          }
          renderItem={({ item }) => (
            <Box
              bg="$backgroundDark900"
              borderWidth={1}
              borderColor="$borderDark800"
              borderRadius="$xl"
              p="$3"
              mb="$2"
              {...cardShadow}
            >
              <HStack justifyContent="space-between" alignItems="center" mb="$2">
                <Text color="$textDark0" fontWeight="$bold" size="md">
                  {t(muscleLabelKey(item.muscle))}
                </Text>
                <HStack alignItems="center" space="xs">
                  <Icon name={STATUS_ICON[item.status]} size={12} color={STATUS_COLOR[item.status]} />
                  <Text color={STATUS_COLOR[item.status]} fontWeight="$semibold" size="xs">
                    {t(STATUS_LABEL_KEY[item.status])}
                  </Text>
                </HStack>
              </HStack>
              <Progress value={Math.min(100, (item.setsThisWeek / item.target.max) * 100)} size="sm" bg="$backgroundDark800" borderRadius="$full">
                <ProgressFilledTrack bg={STATUS_COLOR[item.status]} borderRadius="$full" />
              </Progress>
              <Text color="$textDark500" size="xs" mt="$2" fontFamily="$mono">
                {t('volume.setsTarget', { sets: item.setsThisWeek, min: item.target.min, max: item.target.max })}
              </Text>
            </Box>
          )}
        />
      </Box>
    </SafeAreaView>
  );
}
