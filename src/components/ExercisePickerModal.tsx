import React, { useMemo, useState } from 'react';
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
  InputSlot,
  Button,
  ButtonText,
  Pressable,
} from '@gluestack-ui/themed';
import Icon from '@/components/Icon';
import { Exercise } from '@/types';
import { muscleLabelKey, MUSCLE_ICONS, ALL_MUSCLES } from '@/constants/muscleGroups';
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
  const [search, setSearch] = useState('');

  const grouped = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = query ? exercises.filter((e) => e.name.toLowerCase().includes(query)) : exercises;
    return ALL_MUSCLES.map((muscle) => ({
      muscle,
      items: filtered.filter((e) => e.primaryMuscle === muscle),
    })).filter((group) => group.items.length > 0);
  }, [exercises, search]);

  const resultCount = useMemo(() => grouped.reduce((sum, g) => sum + g.items.length, 0), [grouped]);

  return (
    <Modal
      isOpen={visible}
      onClose={() => {
        setSearch('');
        onClose();
      }}
    >
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
          <Input variant="outline" size="md" borderColor="$borderDark700" borderRadius="$lg" bg="$backgroundDark800" mb="$3">
            <InputSlot pl="$3">
              <Icon name="search" size={16} color={colors.textMuted} />
            </InputSlot>
            <InputField
              placeholder={t('picker.search')}
              placeholderTextColor={colors.textMuted}
              color="$textDark0"
              value={search}
              onChangeText={setSearch}
            />
            <InputSlot pr="$3">
              <Text color="$textDark600" size="2xs" fontFamily="$mono">
                {t('picker.results', { count: resultCount })}
              </Text>
            </InputSlot>
          </Input>

          <ScrollView showsVerticalScrollIndicator={false}>
            <VStack space="lg" pb="$2">
              {grouped.map(({ muscle, items }) => (
                <VStack key={muscle} space="xs">
                  <HStack alignItems="center" space="xs" mb="$1">
                    <Box
                      w={26}
                      h={26}
                      borderRadius="$full"
                      bg="$backgroundDark800"
                      borderWidth={1}
                      borderColor="$borderDark700"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Icon name={MUSCLE_ICONS[muscle]} size={13} color={colors.primaryLight} />
                    </Box>
                    <Text color="$textDark500" size="xs" fontWeight="$bold" letterSpacing={0.5} textTransform="uppercase">
                      {t(muscleLabelKey(muscle))}
                    </Text>
                  </HStack>

                  {items.map((item) => {
                    const active = item.id === selectedExerciseId;
                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => {
                          onSelect(item.id);
                          setSearch('');
                          onClose();
                        }}
                        bg={active ? '$primary900' : '$backgroundDark800'}
                        borderWidth={1}
                        borderColor={active ? colors.accent : '$borderDark700'}
                        borderRadius="$lg"
                        px="$3"
                        py="$3"
                        flexDirection="row"
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <Text color="$textDark0" size="sm" fontWeight={active ? '$bold' : '$medium'} flex={1} numberOfLines={1}>
                          {item.name}
                        </Text>
                        {active && <Icon name="checkmark" size={16} color={colors.accent} />}
                      </Pressable>
                    );
                  })}
                </VStack>
              ))}

              {grouped.length === 0 && (
                <Text color="$textDark500" size="sm" textAlign="center" mt="$4">
                  {t('picker.noMatch')}
                </Text>
              )}
            </VStack>
          </ScrollView>
        </ModalBody>

        <ModalFooter>
          <Button
            flex={1}
            variant="outline"
            borderColor={colors.accent}
            borderStyle="dashed"
            borderRadius="$lg"
            onPress={() => {
              setSearch('');
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
