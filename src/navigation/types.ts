/**
 * Param lists for the stacks that pass arguments between screens. The rest of
 * the app navigates by bare route name and gets by with `'Route' as never`,
 * but that cast breaks the moment a screen takes params - hence this.
 */
export type RoutinesStackParamList = {
  RoutinesList: undefined;
  RoutineDetail: { routineId: string };
};

export type WorkoutStackParamList = {
  WorkoutMain: undefined;
  SessionHistory: undefined;
};
