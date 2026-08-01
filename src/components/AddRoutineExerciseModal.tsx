import React, { useState } from 'react';
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
} from '@gluestack-ui/themed';
import Icon from '@/components/Icon';
import ExerciseBrowser from '@/components/ExerciseBrowser';
import { Exercise } from '@/types';
import { muscleLabelKey, MUSCLE_ICONS } from '@/constants/muscleGroups';
import { useI18n } from '@/i18n';
import { colors } from '@/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  exercises: Exercise[];
  onAdd: (exerciseId: string, name: string, targetSets: number, targetReps: number) => void;
}

export default function AddRoutineExerciseModal({ visible, onClose, exercises, onAdd }: Props) {
  const { t } = useI18n();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [targetSets, setTargetSets] = useState('3');
  const [targetReps, setTargetReps] = useState('10');

  const selected = exercises.find((e) => e.id === selectedId) ?? null;

  function reset() {
    setSelectedId(null);
    setTargetSets('3');
    setTargetReps('10');
  }

  function handleAdd() {
    if (!selected) return;
    onAdd(selected.id, selected.name, parseInt(targetSets, 10) || 3, parseInt(targetReps, 10) || 10);
    reset();
    onClose();
  }

  return (
    <Modal
      isOpen={visible}
      onClose={() => {
        reset();
        onClose();
      }}
    >
      <ModalBackdrop />
      <ModalContent bg="$backgroundDark900" borderColor="$borderDark800" borderWidth={1} maxHeight="85%">
        <ModalHeader>
          <Heading color="$textDark0" size="lg">
            {t('addRoutineEx.title')}
          </Heading>
          <ModalCloseButton>
            <Icon name="close" size={22} color={colors.textMuted} />
          </ModalCloseButton>
        </ModalHeader>

        <ModalBody>
          <VStack space="md">
            <ExerciseBrowser
              exercises={exercises}
              selectedExerciseId={selectedId}
              onSelect={setSelectedId}
              maxHeight={260}
            />

            {/* Set/rep targets only make sense once something is picked, and
                hiding them keeps the browser tall while you're still hunting. */}
            {selected && (
              <VStack space="sm">
                <HStack
                  alignItems="center"
                  space="xs"
                  bg="$backgroundDark800"
                  borderWidth={1}
                  borderLeftWidth={3}
                  borderColor="$borderDark700"
                  borderLeftColor={colors.primary}
                  borderRadius="$lg"
                  px="$3"
                  py="$2"
                >
                  <Icon name={MUSCLE_ICONS[selected.primaryMuscle]} size={14} color={colors.accentSoft} />
                  <VStack flex={1}>
                    <Text color="$textDark0" size="sm" fontWeight="$bold" numberOfLines={1}>
                      {selected.name}
                    </Text>
                    <Text color={colors.textMuted} fontSize={11}>
                      {t(muscleLabelKey(selected.primaryMuscle))}
                    </Text>
                  </VStack>
                </HStack>

                <HStack space="md">
                  <VStack space="xs" flex={1}>
                    <Text color="$textDark400" size="xs">
                      {t('addRoutineEx.targetSets')}
                    </Text>
                    <Input variant="outline" size="md" borderColor="$borderDark700" borderRadius="$lg" bg="$backgroundDark800">
                      <InputField
                        keyboardType="numeric"
                        color="$textDark0"
                        fontFamily="$mono"
                        value={targetSets}
                        onChangeText={setTargetSets}
                      />
                    </Input>
                  </VStack>
                  <VStack space="xs" flex={1}>
                    <Text color="$textDark400" size="xs">
                      {t('addRoutineEx.targetReps')}
                    </Text>
                    <Input variant="outline" size="md" borderColor="$borderDark700" borderRadius="$lg" bg="$backgroundDark800">
                      <InputField
                        keyboardType="numeric"
                        color="$textDark0"
                        fontFamily="$mono"
                        value={targetReps}
                        onChangeText={setTargetReps}
                      />
                    </Input>
                  </VStack>
                </HStack>
              </VStack>
            )}

            {!selected && (
              <Box bg="$backgroundDark800" borderWidth={1} borderColor="$borderDark700" borderRadius="$lg" px="$3" py="$2">
                <Text color={colors.textMuted} fontSize={11}>
                  {t('addRoutineEx.pickFirst')}
                </Text>
              </Box>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack space="sm" flex={1}>
            <Button
              flex={1}
              variant="outline"
              borderColor="$borderDark700"
              borderRadius="$lg"
              onPress={() => {
                reset();
                onClose();
              }}
            >
              <ButtonText color="$textDark400">{t('common.cancel')}</ButtonText>
            </Button>
            <Button flex={1} bg="$primary500" borderRadius="$lg" onPress={handleAdd} isDisabled={!selected}>
              <ButtonText>{t('common.add')}</ButtonText>
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
