import React, { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { MuscleGroup } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { createCustomExercise } from '@/services/exercises';
import { colors } from '@/theme';

const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: 'Göğüs',
  back: 'Sırt',
  shoulders: 'Omuz',
  biceps: 'Biceps',
  triceps: 'Triceps',
  quads: 'Quadriceps',
  hamstrings: 'Hamstring',
  glutes: 'Kalça',
  calves: 'Baldır',
  abs: 'Karın',
};

const ALL_MUSCLES = Object.keys(MUSCLE_LABELS) as MuscleGroup[];

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreated: (exercise: { id: string; name: string; primaryMuscle: MuscleGroup; secondaryMuscles?: MuscleGroup[] }) => void;
}

function MuscleChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      bg={selected ? '$primary500' : '$backgroundDark800'}
      borderColor={selected ? '$primary500' : '$borderDark700'}
      borderWidth={1}
      borderRadius="$full"
      px="$3"
      py="$2"
      mr="$2"
      mb="$2"
    >
      <Text color={selected ? '$textDark0' : '$textDark400'} size="xs" fontWeight={selected ? '$bold' : '$medium'}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function AddExerciseModal({ visible, onClose, onCreated }: Props) {
  const { session } = useAuth();
  const [name, setName] = useState('');
  const [primaryMuscle, setPrimaryMuscle] = useState<MuscleGroup | null>(null);
  const [secondaryMuscles, setSecondaryMuscles] = useState<MuscleGroup[]>([]);
  const [equipment, setEquipment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName('');
    setPrimaryMuscle(null);
    setSecondaryMuscles([]);
    setEquipment('');
    setError(null);
  }

  function toggleSecondary(muscle: MuscleGroup) {
    setSecondaryMuscles((prev) =>
      prev.includes(muscle) ? prev.filter((m) => m !== muscle) : [...prev, muscle]
    );
  }

  async function handleSave() {
    if (!session?.user.id || !name.trim() || !primaryMuscle) return;
    setSaving(true);
    setError(null);
    try {
      const exercise = await createCustomExercise(
        session.user.id,
        name.trim(),
        primaryMuscle,
        secondaryMuscles.filter((m) => m !== primaryMuscle),
        equipment.trim()
      );
      onCreated(exercise);
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Egzersiz oluşturulamadı.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={visible} onClose={onClose}>
      <ModalBackdrop />
      <ModalContent bg="$backgroundDark900" borderColor="$borderDark800" borderWidth={1} maxHeight="85%">
        <ModalHeader>
          <Heading color="$textDark0" size="lg">
            Yeni egzersiz ekle
          </Heading>
          <ModalCloseButton>
            <Ionicons name="close" size={22} color={colors.textMuted} />
          </ModalCloseButton>
        </ModalHeader>

        <ModalBody>
          <ScrollView showsVerticalScrollIndicator={false}>
            <VStack space="md">
              <VStack space="xs">
                <Text color="$textDark400" size="xs">
                  İsim
                </Text>
                <Input variant="outline" size="md" borderColor="$borderDark700" borderRadius="$lg" bg="$backgroundDark800">
                  <InputField
                    placeholder="ör. Kablo Çapraz"
                    placeholderTextColor={colors.textMuted}
                    color="$textDark0"
                    value={name}
                    onChangeText={setName}
                  />
                </Input>
              </VStack>

              <VStack space="xs">
                <Text color="$textDark400" size="xs">
                  Ana kas grubu
                </Text>
                <HStack flexWrap="wrap">
                  {ALL_MUSCLES.map((muscle) => (
                    <MuscleChip
                      key={muscle}
                      label={MUSCLE_LABELS[muscle]}
                      selected={primaryMuscle === muscle}
                      onPress={() => setPrimaryMuscle(muscle)}
                    />
                  ))}
                </HStack>
              </VStack>

              <VStack space="xs">
                <Text color="$textDark400" size="xs">
                  İkincil kas grupları (opsiyonel)
                </Text>
                <HStack flexWrap="wrap">
                  {ALL_MUSCLES.filter((m) => m !== primaryMuscle).map((muscle) => (
                    <MuscleChip
                      key={muscle}
                      label={MUSCLE_LABELS[muscle]}
                      selected={secondaryMuscles.includes(muscle)}
                      onPress={() => toggleSecondary(muscle)}
                    />
                  ))}
                </HStack>
              </VStack>

              <VStack space="xs">
                <Text color="$textDark400" size="xs">
                  Ekipman (opsiyonel)
                </Text>
                <Input variant="outline" size="md" borderColor="$borderDark700" borderRadius="$lg" bg="$backgroundDark800">
                  <InputField
                    placeholder="ör. Kablo, Dambıl, Vücut ağırlığı"
                    placeholderTextColor={colors.textMuted}
                    color="$textDark0"
                    value={equipment}
                    onChangeText={setEquipment}
                  />
                </Input>
              </VStack>

              {error && (
                <Text color={colors.danger} size="sm">
                  {error}
                </Text>
              )}
            </VStack>
          </ScrollView>
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
            <Button
              flex={1}
              bg="$primary500"
              borderRadius="$lg"
              onPress={handleSave}
              isDisabled={saving || !name.trim() || !primaryMuscle}
            >
              <ButtonText>{saving ? '...' : 'Kaydet'}</ButtonText>
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
