import React, { useState } from 'react';
import { FlatList, TextInput as RNTextInput } from 'react-native';
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
import { useExercises } from '@/hooks/useExercises';
import { useWorkoutSets } from '@/hooks/useWorkoutSets';
import { useAuth } from '@/contexts/AuthContext';
import { suggestNextLoad } from '@/services/volume';
import AddExerciseModal from '@/components/AddExerciseModal';
import { colors } from '@/theme';

export default function WorkoutLogScreen() {
  const { signOut } = useAuth();
  const { exercises, loading: exercisesLoading, addExercise } = useExercises();
  const { sets, loading: setsLoading, logSet } = useWorkoutSets();

  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addExerciseVisible, setAddExerciseVisible] = useState(false);

  const activeExerciseId = selectedExerciseId ?? exercises[0]?.id ?? null;
  const activeExercise = exercises.find((e) => e.id === activeExerciseId);
  const suggestion = activeExerciseId ? suggestNextLoad(activeExerciseId, sets) : null;

  async function handleLogSet() {
    if (!weight || !reps || !activeExerciseId || !activeExercise) return;
    setSaving(true);
    setError(null);
    try {
      await logSet(activeExerciseId, activeExercise.name, parseFloat(weight), parseInt(reps, 10));
      setWeight('');
      setReps('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Set kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  }

  if (exercisesLoading) {
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
      <HStack justifyContent="space-between" alignItems="flex-start" mb="$4">
        <VStack>
          <Text color={colors.accent} fontSize={12} fontWeight="$bold" letterSpacing={1.2} textTransform="uppercase">
            Bugün
          </Text>
          <Heading color="$textDark0" size="xl">
            Antrenman kaydı
          </Heading>
        </VStack>
        <Pressable
          onPress={signOut}
          w={36}
          h={36}
          borderRadius="$full"
          bg="$backgroundDark900"
          borderWidth={1}
          borderColor="$borderDark800"
          alignItems="center"
          justifyContent="center"
        >
          <Ionicons name="log-out-outline" size={20} color={colors.textMuted} />
        </Pressable>
      </HStack>

      <HStack alignItems="center" space="sm" mb="$4">
        <FlatList
          horizontal
          data={exercises}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0, flexShrink: 1 }}
          renderItem={({ item }) => {
            const active = item.id === activeExerciseId;
            return (
              <Pressable
                onPress={() => setSelectedExerciseId(item.id)}
                bg={active ? '$primary500' : '$backgroundDark900'}
                borderColor={active ? '$primary500' : '$borderDark800'}
                borderWidth={1}
                borderRadius="$full"
                px="$4"
                py="$2"
                mr="$2"
              >
                <Text color={active ? '$textDark0' : '$textDark400'} fontWeight={active ? '$bold' : '$medium'} size="sm">
                  {item.name}
                </Text>
              </Pressable>
            );
          }}
        />
        <Pressable
          onPress={() => setAddExerciseVisible(true)}
          w={36}
          h={36}
          borderRadius="$full"
          borderWidth={1}
          borderColor={colors.accent}
          borderStyle="dashed"
          alignItems="center"
          justifyContent="center"
        >
          <Ionicons name="add" size={18} color={colors.accent} />
        </Pressable>
      </HStack>

      <AddExerciseModal
        visible={addExerciseVisible}
        onClose={() => setAddExerciseVisible(false)}
        onCreated={(exercise) => {
          addExercise(exercise);
          setSelectedExerciseId(exercise.id);
        }}
      />

      {suggestion?.suggestedWeightKg != null && (
        <HStack
          bg="$backgroundDark900"
          borderWidth={1}
          borderColor="$borderDark800"
          borderRadius="$xl"
          overflow="hidden"
          mb="$4"
        >
          <Box w={4} bg={colors.accent} />
          <VStack p="$3" flex={1} space="xs">
            <HStack alignItems="center" space="xs">
              <Ionicons name="bulb" size={14} color={colors.accent} />
              <Text color={colors.accent} fontWeight="$bold" size="sm">
                Öneri: {suggestion.suggestedWeightKg}kg
              </Text>
            </HStack>
            <Text color="$textDark400" size="sm">
              {suggestion.reason}
            </Text>
          </VStack>
        </HStack>
      )}

      <Box bg="$backgroundDark900" borderWidth={1} borderColor="$borderDark800" borderRadius="$xl" p="$3" mb="$4">
        <HStack space="sm">
          <Input flex={1} variant="outline" size="md" borderColor="$borderDark700" borderRadius="$lg" bg="$backgroundDark800">
            <InputField
              placeholder="Ağırlık (kg)"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              color="$textDark0"
              value={weight}
              onChangeText={setWeight}
            />
          </Input>
          <Input flex={1} variant="outline" size="md" borderColor="$borderDark700" borderRadius="$lg" bg="$backgroundDark800">
            <InputField
              placeholder="Tekrar"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              color="$textDark0"
              value={reps}
              onChangeText={setReps}
            />
          </Input>
          <Button borderRadius="$lg" bg="$primary500" onPress={handleLogSet} isDisabled={saving} px="$4">
            <ButtonText>{saving ? '...' : 'Kaydet'}</ButtonText>
          </Button>
        </HStack>
        {error && (
          <Text color={colors.danger} size="sm" mt="$2">
            {error}
          </Text>
        )}
      </Box>

      <Text color={colors.accent} fontSize={12} fontWeight="$bold" letterSpacing={1.2} textTransform="uppercase" mb="$2">
        Geçmiş
      </Text>

      {setsLoading ? (
        <Spinner color="$primary400" />
      ) : (
        <FlatList
          data={sets}
          keyExtractor={(item) => item.id}
          style={{ flex: 1 }}
          renderItem={({ item }) => (
            <HStack
              alignItems="center"
              space="sm"
              py="$3"
              px="$3"
              bg="$backgroundDark900"
              borderRadius="$lg"
              mb="$2"
              borderWidth={1}
              borderColor="$borderDark800"
            >
              <Box w={24} h={24} borderRadius="$full" bg="$primary900" alignItems="center" justifyContent="center">
                <Ionicons name="checkmark" size={14} color={colors.primaryLight} />
              </Box>
              <Text color="$textDark0" flex={1} size="sm">
                {exercises.find((e) => e.id === item.exerciseId)?.name ?? item.exerciseId}
              </Text>
              <Text color="$textDark400" fontWeight="$semibold" size="sm">
                {item.weightKg}kg × {item.reps}
              </Text>
            </HStack>
          )}
        />
      )}
    </Box>
    </SafeAreaView>
  );
}
