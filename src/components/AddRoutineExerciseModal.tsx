import React, { useState } from 'react';
import { FlatList } from 'react-native';
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
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
import { Ionicons } from '@expo/vector-icons';
import { Exercise } from '@/types';
import { colors } from '@/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  exercises: Exercise[];
  onAdd: (exerciseId: string, name: string, targetSets: number, targetReps: number) => void;
}

export default function AddRoutineExerciseModal({ visible, onClose, exercises, onAdd }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [targetSets, setTargetSets] = useState('3');
  const [targetReps, setTargetReps] = useState('10');

  function reset() {
    setSelectedId(null);
    setTargetSets('3');
    setTargetReps('10');
  }

  function handleAdd() {
    const exercise = exercises.find((e) => e.id === selectedId);
    if (!exercise) return;
    onAdd(exercise.id, exercise.name, parseInt(targetSets, 10) || 3, parseInt(targetReps, 10) || 10);
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
            Egzersiz ekle
          </Heading>
          <ModalCloseButton>
            <Ionicons name="close" size={22} color={colors.textMuted} />
          </ModalCloseButton>
        </ModalHeader>

        <ModalBody>
          <VStack space="md">
            <FlatList
              data={exercises}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 220 }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const selected = item.id === selectedId;
                return (
                  <Pressable
                    onPress={() => setSelectedId(item.id)}
                    bg={selected ? '$primary500' : '$backgroundDark800'}
                    borderColor={selected ? '$primary500' : '$borderDark700'}
                    borderWidth={1}
                    borderRadius="$lg"
                    px="$3"
                    py="$3"
                    mb="$2"
                  >
                    <Text color={selected ? '$textDark0' : '$textDark400'} fontWeight={selected ? '$bold' : '$medium'} size="sm">
                      {item.name}
                    </Text>
                  </Pressable>
                );
              }}
            />

            <HStack space="md">
              <VStack space="xs" flex={1}>
                <Text color="$textDark400" size="xs">
                  Hedef set
                </Text>
                <Input variant="outline" size="md" borderColor="$borderDark700" borderRadius="$lg" bg="$backgroundDark800">
                  <InputField
                    keyboardType="numeric"
                    color="$textDark0"
                    value={targetSets}
                    onChangeText={setTargetSets}
                  />
                </Input>
              </VStack>
              <VStack space="xs" flex={1}>
                <Text color="$textDark400" size="xs">
                  Hedef tekrar
                </Text>
                <Input variant="outline" size="md" borderColor="$borderDark700" borderRadius="$lg" bg="$backgroundDark800">
                  <InputField
                    keyboardType="numeric"
                    color="$textDark0"
                    value={targetReps}
                    onChangeText={setTargetReps}
                  />
                </Input>
              </VStack>
            </HStack>
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
              <ButtonText color="$textDark400">Vazgeç</ButtonText>
            </Button>
            <Button flex={1} bg="$primary500" borderRadius="$lg" onPress={handleAdd} isDisabled={!selectedId}>
              <ButtonText>Ekle</ButtonText>
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
