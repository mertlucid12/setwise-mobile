import React, { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Input,
  InputField,
  Button,
  ButtonText,
  Pressable,
} from '@gluestack-ui/themed';
import Icon, { IconName } from '@/components/Icon';
import ExerciseBrowser from '@/components/ExerciseBrowser';
import { Exercise, Routine, Weekday } from '@/types';
import { useI18n } from '@/i18n';
import { colors } from '@/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** 'YYYY-MM-DD' of the tapped day. */
  dateKey: string;
  dateLabel: string;
  weekday: Weekday;
  weekdayLabel: string;
  /** Future days can be planned but not logged - you can't have lifted yet. */
  isFuture: boolean;
  routines: Routine[];
  exercises: Exercise[];
  /** Routine ids already recurring on this weekday. */
  scheduledRoutineIds: string[];
  onScheduleRoutine: (routineId: string) => Promise<void>;
  onLogSet: (exerciseId: string, name: string, weightKg: number, reps: number) => Promise<void>;
}

type Step = 'choose' | 'routine' | 'exercise';

function OptionCard({
  icon,
  title,
  body,
  disabled,
  onPress,
}: {
  icon: IconName;
  title: string;
  body: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      opacity={disabled ? 0.45 : 1}
      bg={colors.surfaceAlt}
      borderWidth={1}
      borderLeftWidth={3}
      borderColor={colors.border}
      borderLeftColor={disabled ? colors.border : colors.primary}
      borderRadius="$2xl"
      px="$3"
      py="$3"
      flexDirection="row"
      alignItems="center"
    >
      <Box
        w={36}
        h={36}
        borderRadius="$md"
        bg={colors.surface}
        borderWidth={1}
        borderColor={colors.border}
        alignItems="center"
        justifyContent="center"
        mr="$3"
      >
        <Icon name={icon} size={17} color={disabled ? colors.textMuted : colors.accent} />
      </Box>
      <VStack flex={1}>
        <Text color="$textDark0" size="sm" fontWeight="$bold">
          {title}
        </Text>
        <Text color={colors.textMuted} fontSize={11}>
          {body}
        </Text>
      </VStack>
      {!disabled && <Icon name="chevron-forward" size={16} color={colors.textMuted} />}
    </Pressable>
  );
}

/**
 * "What do you want to put on this day?" sheet, opened by tapping a calendar
 * cell. Two paths with different meanings, which is why they're separate:
 * scheduling a routine is a *recurring weekly* plan, while adding an exercise
 * logs a one-off set onto that specific date.
 */
export default function DayAddSheet({
  visible,
  onClose,
  dateKey,
  dateLabel,
  weekdayLabel,
  isFuture,
  routines,
  exercises,
  scheduledRoutineIds,
  onScheduleRoutine,
  onLogSet,
}: Props) {
  const { t } = useI18n();
  const [step, setStep] = useState<Step>('choose');
  const [confirmRoutine, setConfirmRoutine] = useState<Routine | null>(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setStep('choose');
    setConfirmRoutine(null);
    setSelectedExerciseId(null);
    setWeight('');
    setReps('');
    setError(null);
  }, [visible, dateKey]);

  const selectedExercise = exercises.find((e) => e.id === selectedExerciseId) ?? null;

  async function handleConfirmRoutine() {
    if (!confirmRoutine) return;
    setBusy(true);
    setError(null);
    try {
      await onScheduleRoutine(confirmRoutine.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('dayAdd.errGeneric'));
    } finally {
      setBusy(false);
    }
  }

  async function handleLogSet() {
    if (!selectedExercise || !weight || !reps) return;
    setBusy(true);
    setError(null);
    try {
      await onLogSet(selectedExercise.id, selectedExercise.name, parseFloat(weight), parseInt(reps, 10));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('dayAdd.errGeneric'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal isOpen={visible} onClose={onClose}>
      <ModalBackdrop />
      <ModalContent bg={colors.surface} borderColor={colors.border} borderWidth={1} maxHeight="88%">
        <ModalHeader>
          <VStack flex={1}>
            <Text color={colors.accent} fontSize={11} fontWeight="$bold" letterSpacing={1.2} textTransform="uppercase">
              {t('dayAdd.kicker')}
            </Text>
            <Heading color="$textDark0" size="md" textTransform="capitalize">
              {dateLabel}
            </Heading>
          </VStack>
          <ModalCloseButton>
            <Icon name="close" size={22} color={colors.textMuted} />
          </ModalCloseButton>
        </ModalHeader>

        <ModalBody>
          {error && (
            <HStack
              alignItems="center"
              space="xs"
              bg="rgba(255, 107, 53, 0.08)"
              borderWidth={1}
              borderLeftWidth={3}
              borderColor="rgba(255, 107, 53, 0.3)"
              borderLeftColor={colors.danger}
              borderRadius="$lg"
              px="$3"
              py="$2"
              mb="$3"
            >
              <Icon name="alert-circle" size={15} color={colors.danger} />
              <Text color={colors.danger} size="xs" flex={1}>
                {error}
              </Text>
            </HStack>
          )}

          {step === 'choose' && (
            <VStack space="sm">
              <OptionCard
                icon="list"
                title={t('dayAdd.routineTitle')}
                body={t('dayAdd.routineBody', { day: weekdayLabel })}
                onPress={() => setStep('routine')}
              />
              <OptionCard
                icon="barbell"
                title={t('dayAdd.exerciseTitle')}
                body={isFuture ? t('dayAdd.exerciseFuture') : t('dayAdd.exerciseBody')}
                disabled={isFuture}
                onPress={() => setStep('exercise')}
              />
            </VStack>
          )}

          {step === 'routine' && !confirmRoutine && (
            <VStack space="xs">
              {routines.length === 0 ? (
                <Text color={colors.textMuted} size="sm">
                  {t('dayAdd.noRoutines')}
                </Text>
              ) : (
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 340 }}>
                  <VStack space="xs">
                    {routines.map((routine) => {
                      const already = scheduledRoutineIds.includes(routine.id);
                      return (
                        <Pressable
                          key={routine.id}
                          onPress={() => !already && setConfirmRoutine(routine)}
                          opacity={already ? 0.5 : 1}
                          bg={colors.surfaceAlt}
                          borderWidth={1}
                          borderColor={colors.border}
                          borderRadius="$lg"
                          px="$3"
                          py="$3"
                          flexDirection="row"
                          alignItems="center"
                        >
                          <VStack flex={1}>
                            <Text color="$textDark0" size="sm" fontWeight="$bold" numberOfLines={1}>
                              {routine.title}
                            </Text>
                            <Text color={colors.textMuted} fontSize={11}>
                              {already
                                ? t('dayAdd.alreadyScheduled')
                                : t('routines.exerciseCount', { count: routine.exercises.length })}
                            </Text>
                          </VStack>
                          {already ? (
                            <Icon name="checkmark-circle" size={17} color={colors.accent} />
                          ) : (
                            <Icon name="add" size={17} color={colors.textMuted} />
                          )}
                        </Pressable>
                      );
                    })}
                  </VStack>
                </ScrollView>
              )}
            </VStack>
          )}

          {/* The explicit confirm step - adding a recurring weekly commitment
              shouldn't happen on a single stray tap. */}
          {step === 'routine' && confirmRoutine && (
            <VStack space="md">
              <Box bg={colors.surfaceAlt} borderWidth={1} borderColor={colors.accent} borderRadius="$2xl" p="$4">
                <HStack alignItems="center" space="sm" mb="$2">
                  <Icon name="calendar" size={17} color={colors.accent} />
                  <Text color="$textDark0" size="md" fontWeight="$bold" flex={1}>
                    {confirmRoutine.title}
                  </Text>
                </HStack>
                <Text color={colors.textSecondary} size="sm">
                  {t('dayAdd.confirmBody', { routine: confirmRoutine.title, day: weekdayLabel })}
                </Text>
              </Box>
              <HStack space="sm">
                <Button
                  flex={1}
                  variant="outline"
                  borderColor={colors.border}
                  borderRadius="$xl"
                  onPress={() => setConfirmRoutine(null)}
                >
                  <ButtonText color="$textDark400">{t('common.cancel')}</ButtonText>
                </Button>
                <Button flex={1} bg="$primary500" borderRadius="$xl" onPress={handleConfirmRoutine} isDisabled={busy}>
                  <ButtonText fontWeight="$black" textTransform="uppercase" letterSpacing={0.8}>
                    {busy ? '...' : t('dayAdd.confirmYes')}
                  </ButtonText>
                </Button>
              </HStack>
            </VStack>
          )}

          {step === 'exercise' && (
            <VStack space="md">
              <ExerciseBrowser
                exercises={exercises}
                selectedExerciseId={selectedExerciseId}
                onSelect={setSelectedExerciseId}
                maxHeight={220}
              />
              {selectedExercise && (
                <HStack space="md">
                  <VStack space="xs" flex={1}>
                    <Text color="$textDark400" size="xs">
                      {t('dayAdd.weight')}
                    </Text>
                    <Input variant="outline" size="md" borderColor={colors.border} borderRadius="$lg" bg={colors.surfaceAlt}>
                      <InputField
                        keyboardType="numeric"
                        color="$textDark0"
                        fontFamily="$mono"
                        placeholder="0"
                        placeholderTextColor={colors.textMuted}
                        value={weight}
                        onChangeText={setWeight}
                      />
                    </Input>
                  </VStack>
                  <VStack space="xs" flex={1}>
                    <Text color="$textDark400" size="xs">
                      {t('dayAdd.reps')}
                    </Text>
                    <Input variant="outline" size="md" borderColor={colors.border} borderRadius="$lg" bg={colors.surfaceAlt}>
                      <InputField
                        keyboardType="numeric"
                        color="$textDark0"
                        fontFamily="$mono"
                        placeholder="0"
                        placeholderTextColor={colors.textMuted}
                        value={reps}
                        onChangeText={setReps}
                      />
                    </Input>
                  </VStack>
                </HStack>
              )}
            </VStack>
          )}
        </ModalBody>

        <ModalFooter>
          <HStack space="sm" flex={1}>
            {step !== 'choose' && (
              <Button
                flex={1}
                variant="outline"
                borderColor={colors.border}
                borderRadius="$xl"
                onPress={() => (confirmRoutine ? setConfirmRoutine(null) : setStep('choose'))}
              >
                <ButtonText color="$textDark400">{t('dayAdd.back')}</ButtonText>
              </Button>
            )}
            {step === 'exercise' && (
              <Button
                flex={1}
                bg="$primary500"
                borderRadius="$xl"
                onPress={handleLogSet}
                isDisabled={busy || !selectedExercise || !weight || !reps}
              >
                <ButtonText fontWeight="$black" textTransform="uppercase" letterSpacing={0.8}>
                  {busy ? '...' : t('common.add')}
                </ButtonText>
              </Button>
            )}
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
