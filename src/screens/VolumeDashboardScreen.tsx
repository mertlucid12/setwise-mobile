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
import { Ionicons } from '@expo/vector-icons';
import { computeWeeklyMuscleVolume } from '@/services/volume';
import { useExercises } from '@/hooks/useExercises';
import { useWorkoutSets } from '@/hooks/useWorkoutSets';
import { MuscleVolumeSummary } from '@/types';
import AnimatedBackground from '@/components/AnimatedBackground';
import { colors, cardShadow } from '@/theme';

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Göğüs', back: 'Sırt', shoulders: 'Omuz', biceps: 'Biceps',
  triceps: 'Triceps', quads: 'Ön bacak', hamstrings: 'Arka bacak',
  glutes: 'Kalça', calves: 'Baldır', abs: 'Karın',
};

const STATUS_COLOR: Record<MuscleVolumeSummary['status'], string> = {
  below: '#D98E5A',
  in_range: colors.primaryLight,
  above: colors.danger,
};

const STATUS_LABEL: Record<MuscleVolumeSummary['status'], string> = {
  below: 'Hedefin altında',
  in_range: 'Hedefte',
  above: 'Hedefin üstünde',
};

const STATUS_ICON: Record<MuscleVolumeSummary['status'], keyof typeof Ionicons.glyphMap> = {
  below: 'trending-down',
  in_range: 'checkmark-circle',
  above: 'alert-circle',
};

export default function VolumeDashboardScreen() {
  const { exercises, loading: exercisesLoading } = useExercises();
  const { sets, loading: setsLoading } = useWorkoutSets();

  if (exercisesLoading || setsLoading) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <Box flex={1} bg="$backgroundDark950" alignItems="center" justifyContent="center">
          <Spinner color="$primary400" />
        </Box>
      </SafeAreaView>
    );
  }

  const summary = computeWeeklyMuscleVolume(sets, exercises);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Box flex={1} bg="$backgroundDark950" px="$4" pt="$4">
        <AnimatedBackground />
        <Text color={colors.accent} fontSize={12} fontWeight="$bold" letterSpacing={1.2} textTransform="uppercase">
          Bu hafta
        </Text>
        <Heading color="$textDark0" size="xl" mb="$1">
          Kas hacmi
        </Heading>
        <Text color="$textDark500" size="sm" mb="$4">
          Son 7 gün, set sayısı vs hedef aralık
        </Text>

        <FlatList
          data={summary}
          keyExtractor={(item) => item.muscle}
          showsVerticalScrollIndicator={false}
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
                  {MUSCLE_LABELS[item.muscle]}
                </Text>
                <HStack alignItems="center" space="xs">
                  <Ionicons name={STATUS_ICON[item.status]} size={12} color={STATUS_COLOR[item.status]} />
                  <Text color={STATUS_COLOR[item.status]} fontWeight="$semibold" size="xs">
                    {STATUS_LABEL[item.status]}
                  </Text>
                </HStack>
              </HStack>
              <Progress value={Math.min(100, (item.setsThisWeek / item.target.max) * 100)} size="sm" bg="$backgroundDark800" borderRadius="$full">
                <ProgressFilledTrack bg={STATUS_COLOR[item.status]} borderRadius="$full" />
              </Progress>
              <Text color="$textDark500" size="xs" mt="$2" fontFamily="$mono">
                {item.setsThisWeek} set — hedef {item.target.min}-{item.target.max} set/hafta
              </Text>
            </Box>
          )}
        />
      </Box>
    </SafeAreaView>
  );
}
