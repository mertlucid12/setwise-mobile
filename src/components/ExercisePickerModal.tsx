import React from 'react';
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  HStack,
  Heading,
  Button,
  ButtonText,
} from '@gluestack-ui/themed';
import Icon from '@/components/Icon';
import ExerciseBrowser from '@/components/ExerciseBrowser';
import { Exercise } from '@/types';
import { useI18n } from '@/i18n';
import { colors } from '@/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  exercises: Exercise[];
  selectedExerciseId: string | null;
  onSelect: (exerciseId: string) => void;
  onAddCustom: () => void;
}

export default function ExercisePickerModal({
  visible,
  onClose,
  exercises,
  selectedExerciseId,
  onSelect,
  onAddCustom,
}: Props) {
  const { t } = useI18n();

  return (
    <Modal isOpen={visible} onClose={onClose}>
      <ModalBackdrop />
      <ModalContent bg="$backgroundDark900" borderColor="$borderDark800" borderWidth={1} maxHeight="85%">
        <ModalHeader>
          <Heading color="$textDark0" size="lg">
            {t('picker.title')}
          </Heading>
          <ModalCloseButton>
            <Icon name="close" size={22} color={colors.textMuted} />
          </ModalCloseButton>
        </ModalHeader>

        <ModalBody>
          {/* ModalBody is itself a ScrollView, so the browser's list must be
              height-bounded - an unbounded nested vertical ScrollView measures
              to nothing on Android and the list renders as an empty panel. */}
          <ExerciseBrowser
            exercises={exercises}
            selectedExerciseId={selectedExerciseId}
            onSelect={(exerciseId) => {
              onSelect(exerciseId);
              onClose();
            }}
            maxHeight={420}
          />
        </ModalBody>

        <ModalFooter>
          <Button
            flex={1}
            variant="outline"
            borderColor={colors.accent}
            borderStyle="dashed"
            borderRadius="$lg"
            onPress={() => {
              onClose();
              onAddCustom();
            }}
          >
            <HStack alignItems="center" space="xs">
              <Icon name="add" size={16} color={colors.accent} />
              <ButtonText color={colors.accent}>{t('picker.addCustom')}</ButtonText>
            </HStack>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
