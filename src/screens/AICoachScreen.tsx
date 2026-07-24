import React, { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Box, HStack, Heading, Text, Input, InputField, Pressable, SafeAreaView } from '@gluestack-ui/themed';
import { Ionicons } from '@expo/vector-icons';
import { AICoachMessage } from '@/types';
import { askCoach } from '@/services/aiCoach';
import { useWorkoutSets } from '@/hooks/useWorkoutSets';
import { useExercises } from '@/hooks/useExercises';
import { colors } from '@/theme';

export default function AICoachScreen() {
  const { sets } = useWorkoutSets();
  const { exercises } = useExercises();
  const [messages, setMessages] = useState<AICoachMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Selam! Antrenman verini görüyorum. Ne sormak istersin - programın, hacmin ya da bir egzersizle ilgili?',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMessage: AICoachMessage = {
      id: `${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const reply = await askCoach(userMessage.content, sets, exercises, messages);
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-r`, role: 'assistant', content: reply, timestamp: Date.now() },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-e`,
          role: 'assistant',
          content: 'Bağlantı sorunu oldu, backend endpoint kurulana kadar bu beklenen bir durum. src/services/aiCoach.ts dosyasına bak.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Box flex={1} bg="$backgroundDark950" px="$4" pt="$4">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <HStack alignItems="center" space="sm" mb="$3">
            <Box w={34} h={34} borderRadius="$full" bg="$primary900" alignItems="center" justifyContent="center">
              <Ionicons name="sparkles" size={16} color={colors.accent} />
            </Box>
            <Heading color="$textDark0" size="xl">
              AI Koç
            </Heading>
          </HStack>

          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            style={{ flex: 1 }}
            renderItem={({ item }) => {
              const isUser = item.role === 'user';
              return (
                <Box
                  bg={isUser ? '$primary500' : '$backgroundDark900'}
                  borderWidth={isUser ? 0 : 1}
                  borderColor="$borderDark800"
                  alignSelf={isUser ? 'flex-end' : 'flex-start'}
                  maxWidth="85%"
                  borderRadius="$xl"
                  p="$3"
                  mb="$3"
                >
                  <Text color={isUser ? '$textDark0' : '$textDark100'} size="sm" lineHeight="$sm">
                    {item.content}
                  </Text>
                </Box>
              );
            }}
          />

          <HStack space="sm" mt="$2" alignItems="center">
            <Input flex={1} variant="outline" size="lg" borderColor="$borderDark700" borderRadius="$full" bg="$backgroundDark900">
              <InputField
                placeholder="Bir soru sor..."
                placeholderTextColor={colors.textMuted}
                color="$textDark0"
                value={input}
                onChangeText={setInput}
                onSubmitEditing={sendMessage}
              />
            </Input>
            <Pressable
              onPress={sendMessage}
              disabled={loading}
              w={44}
              h={44}
              borderRadius="$full"
              bg="$primary500"
              alignItems="center"
              justifyContent="center"
            >
              <Ionicons name={loading ? 'hourglass' : 'send'} size={18} color="#fff" />
            </Pressable>
          </HStack>
        </KeyboardAvoidingView>
      </Box>
    </SafeAreaView>
  );
}
