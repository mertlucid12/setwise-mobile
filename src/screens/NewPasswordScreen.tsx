import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import {
  Box,
  VStack,
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
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n';
import AnimatedBackground from '@/components/AnimatedBackground';
import { colors, cardShadow } from '@/theme';

export default function NewPasswordScreen() {
  const { t } = useI18n();
  const { updatePassword, signOut } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (password.length < 6) {
      setError(t('auth.errPasswordShort'));
      return;
    }
    if (password !== confirm) {
      setError(t('auth.errPasswordMismatch'));
      return;
    }
    setLoading(true);
    setError(null);
    const { error: updateError } = await updatePassword(password);
    setLoading(false);
    if (updateError) setError(updateError);
  }

  return (
    <Box flex={1} bg="$backgroundDark950">
      <AnimatedBackground />
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
              <Icon name="key" size={28} color={colors.accent} />
            </Box>
            <Heading color="$textDark0" size="2xl">
              {t('newpw.title')}
            </Heading>
            <Text color="$textDark500" size="sm" textAlign="center">
              {t('newpw.subtitle')}
            </Text>
          </VStack>

          <Box
            bg="$backgroundDark900"
            borderRadius="$2xl"
            borderWidth={1}
            borderColor="$borderDark800"
            p="$5"
            {...cardShadow}
          >
            <VStack space="md">
              <Input variant="outline" size="lg" borderColor="$borderDark700" borderRadius="$lg" bg="$backgroundDark800">
                <InputSlot pl="$3">
                  <Icon name="lock-closed-outline" size={18} color={colors.textMuted} />
                </InputSlot>
                <InputField
                  placeholder={t('newpw.newPassword')}
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  color="$textDark0"
                  value={password}
                  onChangeText={setPassword}
                />
                <InputSlot pr="$3">
                  <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                    <Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
                  </Pressable>
                </InputSlot>
              </Input>

              <Input variant="outline" size="lg" borderColor="$borderDark700" borderRadius="$lg" bg="$backgroundDark800">
                <InputSlot pl="$3">
                  <Icon name="lock-closed-outline" size={18} color={colors.textMuted} />
                </InputSlot>
                <InputField
                  placeholder={t('newpw.newPasswordConfirm')}
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  color="$textDark0"
                  value={confirm}
                  onChangeText={setConfirm}
                />
              </Input>

              {error && (
                <Text color="$error400" size="sm" textAlign="center">
                  {error}
                </Text>
              )}

              <Button size="lg" borderRadius="$lg" bg="$primary500" onPress={handleSubmit} isDisabled={loading}>
                <ButtonText>{loading ? '...' : t('newpw.update')}</ButtonText>
              </Button>
            </VStack>
          </Box>

          <Pressable onPress={() => signOut()}>
            <Text color="$textDark400" textAlign="center" size="sm">
              {t('newpw.cancel')}
            </Text>
          </Pressable>
        </VStack>
      </KeyboardAvoidingView>
    </Box>
  );
}
