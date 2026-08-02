import React from 'react';
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
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
import Icon from '@/components/Icon';
import { SetType, MuscleGroup } from '@/types';
import { muscleLabelKey, MUSCLE_ICONS } from '@/constants/muscleGroups';
import { useI18n } from '@/i18n';
import { colors } from '@/theme';

const SET_TYPES: SetType[] = ['normal', 'warmup', 'dropset', 'failure'];

interface Props {
  visible: boolean;
  onClose: () => void;
  exerciseName?: string;
  primaryMuscle?: MuscleGroup;
  weight: string;
  reps: string;
  rpe: string;
  setType: SetType;
  onChangeWeight: (v: string) => void;
  onChangeReps: (v: string) => void;
  onChangeRpe: (v: string) => void;
  onChangeSetType: (v: SetType) => void;
  onSubmit: () => void;
  saving: boolean;
  error: string | null;
  suggestionText?: string | null;
  targetText?: string | null;
  /** 'edit' retitles the sheet and reveals the delete action. */
  mode?: 'add' | 'edit';
  onDelete?: () => void;
}

export default function LogSetModal({
  visible,
  onClose,
  exerciseName,
  primaryMuscle,
  weight,
  reps,
  rpe,
  setType,
  onChangeWeight,
  onChangeReps,
  onChangeRpe,
  onChangeSetType,
  onSubmit,
  saving,
  error,
  suggestionText,
  targetText,
  mode = 'add',
  onDelete,
}: Props) {
  const { t } = useI18n();
  const isEdit = mode === 'edit';
  return (
    <Modal isOpen={visible} onClose={onClose}>
      <ModalBackdrop />
      <ModalContent bg="$backgroundDark900" borderColor="$borderDark800" borderWidth={1}>
        <ModalHeader>
          <HStack alignItems="center" space="sm" flex={1}>
            {primaryMuscle && (
              <Box
                w={32}
                h={32}
                borderRadius="$full"
                bg="$backgroundDark800"
                borderWidth={1}
                borderColor={colors.accent}
                alignItems="center"
                justifyContent="center"
              >
                <Icon name={MUSCLE_ICONS[primaryMuscle]} size={15} color={colors.primaryLight} />
              </Box>
            )}
            <VStack flex={1}>
              {primaryMuscle && (
                <Text color="$textDark600" size="xs" numberOfLines={1}>
                  {t(muscleLabelKey(primaryMuscle))}
                </Text>
              )}
              <Heading color="$textDark0" size="md" numberOfLines={1}>
                {isEdit ? t('logset.editTitle') : (exerciseName ?? t('logset.title'))}
              </Heading>
            </VStack>
          </HStack>
          <ModalCloseButton>
            <Icon name="close" size={22} color={colors.textMuted} />
          </ModalCloseButton>
        </ModalHeader>

        <ModalBody>
          <VStack space="md" pb="$2">
            {!isEdit && (suggestionText || targetText) && (
              <HStack alignItems="center" space="xs">
                {suggestionText && (
                  <>
                    <Icon name="bulb" size={13} color={colors.accent} />
                    <Text color={colors.accent} fontWeight="$semibold" size="xs" flex={1} numberOfLines={1}>
                      {suggestionText}
                    </Text>
                  </>
                )}
                {targetText && (
                  <Text color="$textDark500" size="xs" fontFamily="$mono">
                    {targetText}
                  </Text>
                )}
              </HStack>
            )}

            <HStack space="sm">
              <Input flex={1} variant="outline" size="md" borderColor="$borderDark700" borderRadius="$lg" bg="$backgroundDark800">
                <InputField
                  placeholder={t('logset.weight')}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  color="$textDark0"
                  value={weight}
                  onChangeText={onChangeWeight}
                />
              </Input>
              <Input flex={1} variant="outline" size="md" borderColor="$borderDark700" borderRadius="$lg" bg="$backgroundDark800">
                <InputField
                  placeholder={t('logset.reps')}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  color="$textDark0"
                  value={reps}
                  onChangeText={onChangeReps}
                />
              </Input>
              <Input w={80} variant="outline" size="md" borderColor="$borderDark700" borderRadius="$lg" bg="$backgroundDark800">
                <InputField
                  placeholder={t('logset.rpe')}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  color="$textDark0"
                  value={rpe}
                  onChangeText={onChangeRpe}
                />
              </Input>
            </HStack>

            <HStack flexWrap="wrap">
              {SET_TYPES.map((value) => {
                const active = setType === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() => onChangeSetType(value)}
                    bg={active ? '$primary500' : '$backgroundDark800'}
                    borderColor={active ? '$primary500' : '$borderDark700'}
                    borderWidth={1}
                    borderRadius="$full"
                    px="$3"
                    py="$1"
                    mr="$2"
                    mb="$1"
                  >
                    <Text color={active ? '$textDark0' : '$textDark400'} size="xs" fontWeight={active ? '$bold' : '$medium'}>
                      {t(`setType.${value}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </HStack>

            <Button borderRadius="$lg" bg="$primary500" onPress={onSubmit} isDisabled={saving}>
              <ButtonText>{saving ? '...' : t('common.save')}</ButtonText>
            </Button>

            {/* Delete lives inside the edit sheet rather than on the row: a
                one-tap destructive control next to the set you just logged is
                too easy to hit by accident mid-workout. */}
            {isEdit && onDelete && (
              <Button
                borderRadius="$lg"
                variant="outline"
                borderColor={colors.danger}
                onPress={onDelete}
                isDisabled={saving}
              >
                <HStack alignItems="center" space="xs">
                  <Icon name="trash-outline" size={15} color={colors.danger} />
                  <ButtonText color={colors.danger}>{t('logset.delete')}</ButtonText>
                </HStack>
              </Button>
            )}

            {error && (
              <Text color={colors.danger} size="sm">
                {error}
              </Text>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
