import React, { useEffect, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Platform } from 'react-native';
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
import Icon from '@/components/Icon';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n';
import AnimatedBackground from '@/components/AnimatedBackground';
import { colors, cardShadow } from '@/theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_NOT_CONFIRMED = 'Email not confirmed';

type Mode = 'signIn' | 'signUp' | 'forgotPassword';

export default function AuthScreen() {
  const { t } = useI18n();
  const { signIn, signUp, signInWithGoogle, resendConfirmationEmail, resetPasswordForEmail } = useAuth();
  const [mode, setMode] = useState<Mode>('signIn');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState<string | null>(null);
  const [resendSent, setResendSent] = useState(false);

  const cardAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(cardAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [cardAnim]);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setResetSent(false);
    setPassword('');
    setConfirmPassword('');
    setUnconfirmedEmail(null);
    setResendSent(false);
  }

  function validate(): string | null {
    if (!EMAIL_RE.test(email.trim())) return t('auth.errEmail');
    if (mode === 'forgotPassword') return null;
    if (password.length < 6) return t('auth.errPasswordShort');
    if (mode === 'signUp') {
      if (!firstName.trim() || !lastName.trim()) return t('auth.errNameRequired');
      if (password !== confirmPassword) return t('auth.errPasswordMismatch');
    }
    return null;
  }

  async function handleSubmit() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    setError(null);
    setUnconfirmedEmail(null);
    setResendSent(false);

    if (mode === 'signIn') {
      const { error: authError } = await signIn(email.trim(), password);
      setLoading(false);
      if (authError === EMAIL_NOT_CONFIRMED) {
        setError(t('auth.emailNotConfirmed'));
        setUnconfirmedEmail(email.trim());
      } else if (authError) {
        setError(authError);
      }
      return;
    }

    const { error: authError, needsEmailConfirmation } = await signUp(
      email.trim(),
      password,
      `${firstName.trim()} ${lastName.trim()}`.trim()
    );
    setLoading(false);
    if (authError) {
      setError(authError);
      return;
    }
    if (needsEmailConfirmation) setPendingConfirmationEmail(email.trim());
  }

  async function handleResendConfirmation(targetEmail: string) {
    setLoading(true);
    setError(null);
    const { error: resendError } = await resendConfirmationEmail(targetEmail);
    setLoading(false);
    if (resendError) setError(resendError);
    else setResendSent(true);
  }

  async function handleResetPassword() {
    if (!EMAIL_RE.test(email.trim())) {
      setError(t('auth.errEmail'));
      return;
    }
    setLoading(true);
    setError(null);
    const { error: resetError } = await resetPasswordForEmail(email.trim());
    setLoading(false);
    if (resetError) setError(resetError);
    else setResetSent(true);
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError(null);
    const { error: authError } = await signInWithGoogle();
    setGoogleLoading(false);
    if (authError) setError(authError);
  }

  if (pendingConfirmationEmail) {
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
                <Icon name="mail-unread-outline" size={28} color={colors.accent} />
              </Box>
              <Heading color="$textDark0" size="2xl" textAlign="center">
                {t('auth.confirmTitle')}
              </Heading>
              <Text color="$textDark500" size="sm" textAlign="center">
                {t('auth.confirmBody', { email: pendingConfirmationEmail })}
              </Text>
            </VStack>

            <Box bg="$backgroundDark900" borderRadius="$2xl" borderWidth={1} borderColor="$borderDark800" p="$5" {...cardShadow}>
              <VStack space="md">
                {resendSent && (
                  <Text color="$success400" size="sm" textAlign="center">
                    {t('auth.confirmResent')}
                  </Text>
                )}
                {error && (
                  <Text color="$error400" size="sm" textAlign="center">
                    {error}
                  </Text>
                )}
                <Button
                  size="lg"
                  borderRadius="$lg"
                  variant="outline"
                  borderColor="$borderDark700"
                  bg="$backgroundDark800"
                  onPress={() => handleResendConfirmation(pendingConfirmationEmail)}
                  isDisabled={loading}
                >
                  <ButtonText color="$textDark0">{loading ? '...' : t('auth.resendConfirmation')}</ButtonText>
                </Button>
                <Button
                  size="lg"
                  borderRadius="$lg"
                  bg="$primary500"
                  onPress={() => {
                    setPendingConfirmationEmail(null);
                    switchMode('signIn');
                  }}
                >
                  <ButtonText>{t('auth.backToSignIn')}</ButtonText>
                </Button>
              </VStack>
            </Box>
          </VStack>
        </KeyboardAvoidingView>
      </Box>
    );
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
              <Icon name="barbell" size={28} color={colors.accent} />
            </Box>
            <Heading color="$textDark0" size="2xl">
              Setwise
            </Heading>
            <Text color="$textDark500" size="sm" textAlign="center">
              {mode === 'forgotPassword'
                ? t('auth.resetSubtitle')
                : mode === 'signIn'
                  ? t('auth.signInSubtitle')
                  : t('auth.signUpSubtitle')}
            </Text>
            {mode !== 'forgotPassword' && (
              <Text color="$textDark600" size="xs" textAlign="center">
                {t('auth.tagline')}
              </Text>
            )}
          </VStack>

          <Animated.View
            style={{
              opacity: cardAnim,
              transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
            }}
          >
            <Box
              bg="$backgroundDark900"
              borderRadius="$2xl"
              borderWidth={1}
              borderColor="$borderDark800"
              p="$5"
              {...cardShadow}
            >
              <VStack space="md">
                {mode === 'signUp' && (
                  <HStack space="sm">
                    <Input
                      flex={1}
                      variant="outline"
                      size="lg"
                      borderColor="$borderDark700"
                      borderRadius="$lg"
                      bg="$backgroundDark800"
                    >
                      <InputSlot pl="$3">
                        <Icon name="person-outline" size={18} color={colors.textMuted} />
                      </InputSlot>
                      <InputField
                        placeholder={t('auth.firstName')}
                        placeholderTextColor={colors.textMuted}
                        color="$textDark0"
                        value={firstName}
                        onChangeText={setFirstName}
                      />
                    </Input>
                    <Input
                      flex={1}
                      variant="outline"
                      size="lg"
                      borderColor="$borderDark700"
                      borderRadius="$lg"
                      bg="$backgroundDark800"
                    >
                      <InputField
                        placeholder={t('auth.lastName')}
                        placeholderTextColor={colors.textMuted}
                        color="$textDark0"
                        value={lastName}
                        onChangeText={setLastName}
                      />
                    </Input>
                  </HStack>
                )}

                <Input variant="outline" size="lg" borderColor="$borderDark700" borderRadius="$lg" bg="$backgroundDark800">
                  <InputSlot pl="$3">
                    <Icon name="mail-outline" size={18} color={colors.textMuted} />
                  </InputSlot>
                  <InputField
                    placeholder={t('auth.email')}
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    color="$textDark0"
                    value={email}
                    onChangeText={setEmail}
                  />
                </Input>

                {mode !== 'forgotPassword' && (
                  <Input variant="outline" size="lg" borderColor="$borderDark700" borderRadius="$lg" bg="$backgroundDark800">
                    <InputSlot pl="$3">
                      <Icon name="lock-closed-outline" size={18} color={colors.textMuted} />
                    </InputSlot>
                    <InputField
                      placeholder={t('auth.password')}
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
                )}

                {mode === 'signUp' && (
                  <Input variant="outline" size="lg" borderColor="$borderDark700" borderRadius="$lg" bg="$backgroundDark800">
                    <InputSlot pl="$3">
                      <Icon name="lock-closed-outline" size={18} color={colors.textMuted} />
                    </InputSlot>
                    <InputField
                      placeholder={t('auth.passwordConfirm')}
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      color="$textDark0"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                    />
                    <InputSlot pr="$3">
                      <Pressable onPress={() => setShowConfirmPassword((v) => !v)} hitSlop={8}>
                        <Icon
                          name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={18}
                          color={colors.textMuted}
                        />
                      </Pressable>
                    </InputSlot>
                  </Input>
                )}

                {mode === 'signIn' && (
                  <Pressable onPress={() => switchMode('forgotPassword')} alignSelf="flex-end">
                    <Text color={colors.accent} size="xs" fontWeight="$semibold">
                      {t('auth.forgotPassword')}
                    </Text>
                  </Pressable>
                )}

                {resetSent && mode === 'forgotPassword' && (
                  <Text color="$success400" size="sm" textAlign="center">
                    {t('auth.resetSent')}
                  </Text>
                )}

                {error && (
                  <Text color="$error400" size="sm" textAlign="center">
                    {error}
                  </Text>
                )}

                {unconfirmedEmail && (
                  <Pressable onPress={() => handleResendConfirmation(unconfirmedEmail)}>
                    <Text color={colors.accent} size="xs" fontWeight="$semibold" textAlign="center">
                      {resendSent ? t('auth.resendSent') : t('auth.resendConfirmation')}
                    </Text>
                  </Pressable>
                )}

                {mode === 'forgotPassword' ? (
                  <Button size="lg" borderRadius="$lg" bg="$primary500" onPress={handleResetPassword} isDisabled={loading}>
                    <ButtonText>{loading ? '...' : t('auth.sendResetLink')}</ButtonText>
                  </Button>
                ) : (
                  <>
                    <Button size="lg" borderRadius="$lg" bg="$primary500" onPress={handleSubmit} isDisabled={loading}>
                      <ButtonText>{loading ? '...' : mode === 'signIn' ? t('auth.signIn') : t('auth.signUp')}</ButtonText>
                    </Button>

                    <HStack alignItems="center" space="sm">
                      <Divider bg="$borderDark800" flex={1} />
                      <Text color="$textDark500" size="xs">
                        {t('auth.or')}
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
                          {googleLoading ? '...' : t('auth.continueWithGoogle')}
                        </ButtonText>
                      </HStack>
                    </Button>
                  </>
                )}
              </VStack>
            </Box>
          </Animated.View>

          <Pressable
            onPress={() => (mode === 'forgotPassword' ? switchMode('signIn') : switchMode(mode === 'signIn' ? 'signUp' : 'signIn'))}
          >
            <Text color="$textDark400" textAlign="center" size="sm">
              {mode === 'forgotPassword'
                ? t('auth.backToSignIn')
                : mode === 'signIn'
                  ? t('auth.noAccount')
                  : t('auth.haveAccount')}
            </Text>
          </Pressable>
        </VStack>
      </KeyboardAvoidingView>
    </Box>
  );
}
