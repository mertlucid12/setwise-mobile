import React, { useState } from 'react';
import { FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
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
  Spinner,
  SafeAreaView,
} from '@gluestack-ui/themed';
import { Ionicons } from '@expo/vector-icons';
import { useRoutines } from '@/hooks/useRoutines';
import { useExercises } from '@/hooks/useExercises';
import { useActiveRoutine } from '@/contexts/ActiveRoutineContext';
import AddRoutineExerciseModal from '@/components/AddRoutineExerciseModal';
import AnimatedBackground from '@/components/AnimatedBackground';
import { Routine } from '@/types';
import { colors, cardShadow } from '@/theme';

export default function RoutinesScreen() {
  const { routines, loading, createRoutine, deleteRoutine, addExerciseToRoutine, removeExerciseFromRoutine } =
    useRoutines();
  const { exercises } = useExercises();
  const { startRoutine } = useActiveRoutine();
  const navigation = useNavigation();

  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [modalRoutineId, setModalRoutineId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!newTitle.trim()) return;
    try {
      const routine = await createRoutine(newTitle.trim());
      setNewTitle('');
      setCreating(false);
      setExpandedId(routine.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rutin oluşturulamadı.');
    }
  }

  function handleStart(routine: Routine) {
    startRoutine(routine);
    navigation.navigate('Antrenman' as never);
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <Box flex={1} bg="$backgroundDark950" alignItems="center" justifyContent="center">
          <Spinner color="$primary400" />
        </Box>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Box flex={1} bg="$backgroundDark950" px="$4" pt="$4">
        <AnimatedBackground />
        <HStack justifyContent="space-between" alignItems="flex-start" mb="$4">
          <VStack>
            <Text color={colors.accent} fontSize={12} fontWeight="$bold" letterSpacing={1.2} textTransform="uppercase">
              Planla
            </Text>
            <Heading color="$textDark0" size="xl">
              Rutinler
            </Heading>
          </VStack>
          <Pressable
            onPress={() => setCreating((v) => !v)}
            w={36}
            h={36}
            borderRadius="$full"
            borderWidth={1}
            borderColor={colors.accent}
            borderStyle="dashed"
            alignItems="center"
            justifyContent="center"
          >
            <Ionicons name={creating ? 'close' : 'add'} size={18} color={colors.accent} />
          </Pressable>
        </HStack>

        {creating && (
          <HStack space="sm" mb="$4">
            <Input flex={1} variant="outline" size="md" borderColor="$borderDark700" borderRadius="$lg" bg="$backgroundDark800">
              <InputField
                placeholder="ör. İtiş günü"
                placeholderTextColor={colors.textMuted}
                color="$textDark0"
                value={newTitle}
                onChangeText={setNewTitle}
                onSubmitEditing={handleCreate}
              />
            </Input>
            <Button borderRadius="$lg" bg="$primary500" onPress={handleCreate} px="$4">
              <ButtonText>Oluştur</ButtonText>
            </Button>
          </HStack>
        )}

        {error && (
          <Text color={colors.danger} size="sm" mb="$3">
            {error}
          </Text>
        )}

        {routines.length === 0 && !creating && (
          <Box bg="$backgroundDark900" borderWidth={1} borderColor="$borderDark800" borderRadius="$xl" p="$4">
            <Text color="$textDark400" size="sm">
              Henüz bir rutinin yok. Sağ üstteki + ile bir tane oluştur — egzersizlerini ve hedef set/tekrar
              sayılarını önceden planla, antrenman gününde tek dokunuşla başlat.
            </Text>
          </Box>
        )}

        <FlatList
          data={routines}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const expanded = expandedId === item.id;
            return (
              <Box bg="$backgroundDark900" borderWidth={1} borderColor="$borderDark800" borderRadius="$xl" p="$3" mb="$3" {...cardShadow}>
                <Pressable
                  onPress={() => setExpandedId(expanded ? null : item.id)}
                  flexDirection="row"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <VStack>
                    <Text color="$textDark0" fontWeight="$bold" size="md">
                      {item.title}
                    </Text>
                    <Text color="$textDark500" size="xs">
                      {item.exercises.length} egzersiz
                    </Text>
                  </VStack>
                  <HStack space="md" alignItems="center">
                    <Pressable onPress={() => deleteRoutine(item.id)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
                    </Pressable>
                    <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
                  </HStack>
                </Pressable>

                {expanded && (
                  <VStack mt="$3" space="xs">
                    {item.exercises.map((ex) => (
                      <HStack
                        key={ex.id}
                        alignItems="center"
                        justifyContent="space-between"
                        bg="$backgroundDark800"
                        borderRadius="$lg"
                        px="$3"
                        py="$2"
                      >
                        <Text color="$textDark0" size="sm" flex={1}>
                          {ex.name}
                        </Text>
                        <Text color="$textDark500" size="xs" mr="$2" fontFamily="$mono">
                          {ex.targetSets} × {ex.targetReps}
                        </Text>
                        <Pressable onPress={() => removeExerciseFromRoutine(item.id, ex.id)} hitSlop={8}>
                          <Ionicons name="close" size={16} color={colors.textMuted} />
                        </Pressable>
                      </HStack>
                    ))}

                    <Pressable
                      onPress={() => setModalRoutineId(item.id)}
                      borderWidth={1}
                      borderColor={colors.accent}
                      borderStyle="dashed"
                      borderRadius="$lg"
                      py="$2"
                      alignItems="center"
                      mt="$1"
                    >
                      <Text color={colors.accent} size="xs" fontWeight="$bold">
                        + Egzersiz ekle
                      </Text>
                    </Pressable>

                    <Button
                      borderRadius="$lg"
                      bg="$primary500"
                      mt="$2"
                      onPress={() => handleStart(item)}
                      isDisabled={item.exercises.length === 0}
                    >
                      <ButtonText>Başlat</ButtonText>
                    </Button>
                  </VStack>
                )}
              </Box>
            );
          }}
        />

        <AddRoutineExerciseModal
          visible={modalRoutineId != null}
          onClose={() => setModalRoutineId(null)}
          exercises={exercises}
          onAdd={(exerciseId, name, targetSets, targetReps) => {
            if (modalRoutineId) addExerciseToRoutine(modalRoutineId, exerciseId, name, targetSets, targetReps);
          }}
        />
      </Box>
    </SafeAreaView>
  );
}
