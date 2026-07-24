import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import {
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
  Divider,
} from '@gluestack-ui/themed';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/theme';

export default function AuthScreen() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit() {
    if (!email || !password) {
      setError('E-posta ve şifre gerekli.');
      return;
    }
    setLoading(true);
    setError(null);
    const action = mode === 'signIn' ? signIn : signUp;
    const { error: authError } = await action(email.trim(), password);
    setLoading(false);
    if (authError) setError(authError);
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError(null);
    const { error: authError } = await signInWithGoogle();
    setGoogleLoading(false);
    if (authError) setError(authError);
  }

  return (
    <Box flex={1} bg="$backgroundDark950">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <VStack flex={1} justifyContent="center" px="$6" space="xl">
          <VStack alignItems="center" space="sm">
            <Box
              w={56}
              h={56}
              borderRadius="$xl"
              bg="$backgroundDark900"
              borderWidth={1}
              borderColor="$borderDark800"
              alignItems="center"
              justifyContent="center"
            >
              <Ionicons name="barbell" size={28} color={colors.accent} />
            </Box>
            <Heading color="$textDark0" size="2xl">
              Setwise
            </Heading>
            <Text color="$textDark500" size="sm">
              {mode === 'signIn' ? 'Hesabına giriş yap' : 'Yeni hesap oluştur'}
            </Text>
          </VStack>

          <Box
            bg="$backgroundDark900"
            borderRadius="$2xl"
            borderWidth={1}
            borderColor="$borderDark800"
            p="$5"
          >
            <VStack space="md">
              <Input variant="outline" size="lg" borderColor="$borderDark700" borderRadius="$lg" bg="$backgroundDark800">
                <InputSlot pl="$3">
                  <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
                </InputSlot>
                <InputField
                  placeholder="E-posta"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  color="$textDark0"
                  value={email}
                  onChangeText={setEmail}
                />
              </Input>

              <Input variant="outline" size="lg" borderColor="$borderDark700" borderRadius="$lg" bg="$backgroundDark800">
                <InputSlot pl="$3">
                  <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
                </InputSlot>
                <InputField
                  placeholder="Şifre"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                  autoCapitalize="none"
                  color="$textDark0"
                  value={password}
                  onChangeText={setPassword}
                />
              </Input>

              {error && (
                <Text color="$error400" size="sm" textAlign="center">
                  {error}
                </Text>
              )}

              <Button size="lg" borderRadius="$lg" bg="$primary500" onPress={handleSubmit} isDisabled={loading}>
                <ButtonText>{loading ? '...' : mode === 'signIn' ? 'Giriş yap' : 'Kayıt ol'}</ButtonText>
              </Button>

              <HStack alignItems="center" space="sm">
                <Divider bg="$borderDark800" flex={1} />
                <Text color="$textDark500" size="xs">
                  veya
                </Text>
                <Divider bg="$borderDark800" flex={1} />
              </HStack>

              <Button
                size="lg"
                borderRadius="$lg"
                variant="outline"
                borderColor="$borderDark700"
                bg="$backgroundDark800"
                onPress={handleGoogleSignIn}
                isDisabled={googleLoading}
              >
                <HStack alignItems="center" space="sm">
                  <Ionicons name="logo-google" size={18} color={colors.textPrimary} />
                  <ButtonText color="$textDark0">
                    {googleLoading ? '...' : 'Google ile devam et'}
                  </ButtonText>
                </HStack>
              </Button>
            </VStack>
          </Box>

          <Pressable
            onPress={() => {
              setMode(mode === 'signIn' ? 'signUp' : 'signIn');
              setError(null);
            }}
          >
            <Text color="$textDark400" textAlign="center" size="sm">
              {mode === 'signIn' ? 'Hesabın yok mu? Kayıt ol' : 'Zaten hesabın var mı? Giriş yap'}
            </Text>
          </Pressable>
        </VStack>
      </KeyboardAvoidingView>
    </Box>
  );
}
