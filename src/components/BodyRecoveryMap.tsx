import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import Body, { Slug, ExtendedBodyPart } from 'react-native-body-highlighter';
import { MuscleGroup, Gender } from '@/types';
import { MuscleRecovery, RecoveryStatus } from '@/services/volume';
import { colors } from '@/theme';

/**
 * Recovery reads off the shared status ramp rather than the base palette.
 * These three states were previously danger / accent / primaryLight, which all
 * resolve to the same salmon - a fatigued muscle and a fully recovered one
 * were drawn in identical pixels, so the map could only ever say "trained" or
 * "not trained". See the ramp's note in theme.ts for why it is defined apart.
 */
export const RECOVERY_COLOR: Record<RecoveryStatus, string> = {
  untrained: colors.statusIdle,
  fatigued: colors.statusHot,
  recovering: colors.statusWarm,
  fresh: colors.statusReady,
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

/** The library draws each body into a fixed 200x400 box before `scale`. */
const BODY_UNIT_WIDTH = 200;
const GAP = 8;

/**
 * Muscle outlines are stroked in viewBox units, not points: the male viewBox
 * is 724 wide and renders into 200*scale, so a stroke reads about 4.5x thinner
 * than its number suggests. 5 lands near a 1pt hairline at normal scale.
 */
const PLATE_STROKE_WIDTH = 5;

interface Props {
  recovery: MuscleRecovery[];
  gender?: Gender | null;
  /**
   * Horizontal chrome between the window edge and the map (screen padding plus
   * card padding), subtracted before the two bodies are fitted to the width.
   */
  inset?: number;
  maxScale?: number;
}

export default function BodyRecoveryMap({ recovery, gender, inset = 64, maxScale = 0.95 }: Props) {
  // The old fixed 0.62 left the pair 248pt wide inside a ~326pt card and made
  // individual muscles too small to read, so the scale is derived from the
  // window instead: fill the row, clamped so it neither shrinks below the old
  // size on narrow phones nor grows to fill a tablet.
  const { width } = useWindowDimensions();
  const fitted = (width - inset - GAP) / 2 / BODY_UNIT_WIDTH;
  const scale = Math.max(0.62, Math.min(fitted, maxScale));

  // 'untrained' muscles are left to defaultFill so an untouched body reads as
  // neutral rather than a wall of grey blocks.
  const data: ExtendedBodyPart[] = recovery
    .filter((r) => r.status !== 'untrained')
    .flatMap((r) =>
      MUSCLE_TO_SLUGS[r.muscle].map((slug) => ({ slug, color: RECOVERY_COLOR[r.status] }))
    );

  const bodyGender = gender === 'female' ? 'female' : 'male';

  // Separating every muscle with a dark stroke matters more once the bodies are
  // larger: without it two adjacent lit muscles on the same status merge into
  // one blob. It also gives the silhouette the plated look the theme is after.
  const bodyProps = {
    data,
    gender: bodyGender,
    scale,
    border: colors.border,
    defaultFill: colors.statusIdle,
    defaultStroke: colors.bg,
    defaultStrokeWidth: PLATE_STROKE_WIDTH,
  } as const;

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: GAP }}>
      <Body {...bodyProps} side="front" />
      <Body {...bodyProps} side="back" />
    </View>
  );
}
