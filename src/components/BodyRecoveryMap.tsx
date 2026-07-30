import React from 'react';
import { View } from 'react-native';
import Body, { Slug, ExtendedBodyPart } from 'react-native-body-highlighter';
import { MuscleGroup, Gender } from '@/types';
import { MuscleRecovery, RecoveryStatus } from '@/services/volume';
import { colors } from '@/theme';

export const RECOVERY_COLOR: Record<RecoveryStatus, string> = {
  untrained: colors.border,
  fatigued: colors.danger,
  recovering: colors.accent,
  fresh: colors.primaryLight,
};

/**
 * Our muscle taxonomy is coarser than the illustration's, so one group can
 * light up several slugs (back covers upper/lower back and traps; abs covers
 * obliques). Slugs the library only draws on one side are simply ignored on
 * the other, so both views can be fed the same data array.
 */
const MUSCLE_TO_SLUGS: Record<MuscleGroup, Slug[]> = {
  chest: ['chest'],
  back: ['upper-back', 'lower-back', 'trapezius'],
  shoulders: ['deltoids'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  quads: ['quadriceps'],
  hamstrings: ['hamstring'],
  glutes: ['gluteal'],
  calves: ['calves'],
  abs: ['abs', 'obliques'],
};

interface Props {
  recovery: MuscleRecovery[];
  gender?: Gender | null;
  scale?: number;
}

export default function BodyRecoveryMap({ recovery, gender, scale = 0.62 }: Props) {
  // 'untrained' muscles are left to defaultFill so an untouched body reads as
  // neutral rather than a wall of grey blocks.
  const data: ExtendedBodyPart[] = recovery
    .filter((r) => r.status !== 'untrained')
    .flatMap((r) =>
      MUSCLE_TO_SLUGS[r.muscle].map((slug) => ({ slug, color: RECOVERY_COLOR[r.status] }))
    );

  const bodyGender = gender === 'female' ? 'female' : 'male';

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
      <Body data={data} gender={bodyGender} side="front" scale={scale} border="none" defaultFill={colors.surfaceAlt} />
      <Body data={data} gender={bodyGender} side="back" scale={scale} border="none" defaultFill={colors.surfaceAlt} />
    </View>
  );
}
