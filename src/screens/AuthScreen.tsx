import React, { useEffect, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
import HeroSlashes from '@/components/HeroSlashes';
import TextFlippingBoard from '@/components/TextFlippingBoard';
import WarriorBackground from '@/components/WarriorBackground';
import { useAppToast } from '@/components/AppToast';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n';
import { colors, cardShadow } from '@/theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_NOT_CONFIRMED = 'Email not confirmed';

const HERO_HEIGHT = 268;
/** shadcn's login block caps its column at max-w-sm; same idea here so the
 *  form stays a readable column on tablets and the web build instead of
 *  stretching edge to edge. */
const COLUMN_MAX_WIDTH = 440;
/** The form panel rides up over the hero's bottom edge, same seam trick as
 *  the routine detail screen, so the two blocks lock together. */
const PANEL_OVERLAP = 20;

type Mode = 'signIn' | 'signUp' | 'forgotPassword';

/**
 * Brand lines for the split-flap board beside the form. Kept in English on
 * both locales on purpose: it's the slogan, not copy - the same way a logo
 * isn't translated. The charset the board flips through is A-Z0-9 only, so
 * these must stay uppercase and unaccented.
 */
const SLOGANS = [
  'LET\nTHE\nMAN\nBORN',
  'EARN\nYOUR\nBODY',
  'NO\nEASY\nDAYS',
  'IRON\nDONT\nLIE',
];

/** Board geometry. It sits in the gutter beside the form, level with the top
 *  of the card, so its width is bounded by whatever is left over next to a
 *  COLUMN_MAX_WIDTH column - four columns at this tile size is what fits.
 *  Every slogan line above therefore stays within four characters. */
const BOARD_ROWS = 4;
const BOARD_COLS = 4;
const BOARD_TILE = 55;

/** Crimson hero shared by the auth screen's two states. */
function AuthHero({
  icon,
  title,
  subtitle,
}: {
  icon: 'barbell' | 'mail-unread-outline';
  title: string;
  subtitle: string;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Box h={HERO_HEIGHT}>
      <LinearGradient
        colors={['#A31621', '#500A10', colors.bg]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: HERO_HEIGHT }}
      />
      <HeroSlashes height={HERO_HEIGHT} />

      <VStack
        flex={1}
        px="$5"
        pt={insets.top + 12}
        pb={PANEL_OVERLAP + 22}
        justifyContent="flex-end"
        space="xs"
        w="100%"
        maxWidth={COLUMN_MAX_WIDTH}
        alignSelf="center"
      >
        <Box
          w={46}
          h={46}
          borderRadius="$xl"
          bg="rgba(10, 9, 8, 0.5)"
          borderWidth={1}
          borderColor={colors.accent}
          alignItems="center"
          justifyContent="center"
          mb="$1"
        >
          <Icon name={icon} size={24} color={colors.accent} />
        </Box>

        {/* Wide tracking is what makes the wordmark read as a lockup rather
            than just a large heading. */}
        <Heading color="$textDark0" fontSize={40} lineHeight={42} letterSpacing={4}>
          {title}
        </Heading>
        <HStack alignItems="center" space="xs">
          <Box w={16} h={2} bg={colors.accent} />
          <Text color={colors.accentSoft} fontSize={11} fontWeight="$bold" letterSpacing={1.2} textTransform="uppercase" flex={1}>
            {subtitle}
          </Text>
        </HStack>
      </VStack>
    </Box>
  );
}

function SegmentTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      flex={1}
      onPress={onPress}
      bg={active ? colors.primary : 'transparent'}
      borderBottomWidth={2}
      borderBottomColor={active ? colors.accent : 'transparent'}
      py="$3"
      alignItems="center"
      justifyContent="center"
    >
      <Text
        color={active ? '$textDark0' : colors.textMuted}
        fontSize={13}
        fontWeight="$black"
        letterSpacing={1.2}
        textTransform="uppercase"
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function AuthScreen() {
  const { t } = useI18n();
  const {
    signIn,
    signUp,
    signInWithGoogle,
    resendConfirmationEmail,
    resetPasswordForEmail,
    sessionExpired,
    acknowledgeSessionExpired,
  } = useAuth();
  const toast = useAppToast();
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

  // Landing on a login form with no explanation reads as a bug, so say why.
  useEffect(() => {
    if (!sessionExpired) return;
    toast({
      title: t('toast.sessionExpired'),
      description: t('toast.sessionExpiredBody'),
      variant: 'info',
    });
    acknowledgeSessionExpired();
  }, [sessionExpired, acknowledgeSessionExpired, toast, t]);

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
      } else {
        toast({ title: t('toast.signedIn') });
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
    else toast({ title: t('toast.signedUp') });
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
    if (resetError) {
      setError(resetError);
    } else {
      setResetSent(true);
      toast({ title: t('toast.resetSent'), description: email.trim() });
    }
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
      <Box flex={1} bg={colors.bg}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
            <AuthHero icon="mail-unread-outline" title={t('auth.confirmTitle')} subtitle={t('auth.confirmKicker')} />

            <Box px="$5" mt={-PANEL_OVERLAP} w="100%" maxWidth={COLUMN_MAX_WIDTH} alignSelf="center">
              <Box bg={colors.surface} borderRadius="$2xl" borderWidth={1} borderColor={colors.border} p="$5" {...cardShadow}>
                <VStack space="md">
                  <Text color={colors.textSecondary} size="sm">
                    {t('auth.confirmBody', { email: pendingConfirmationEmail })}
                  </Text>
                  {resendSent && (
                    <Text color="$success400" size="sm" textAlign="center">
                      {t('auth.confirmResent')}
                    </Text>
                  )}
                  {error && (
                    <Text color={colors.danger} size="sm" textAlign="center">
                      {error}
                    </Text>
                  )}
                  <Button
                    size="lg"
                    borderRadius="$xl"
                    variant="outline"
                    borderColor={colors.border}
                    bg={colors.surfaceAlt}
                    onPress={() => handleResendConfirmation(pendingConfirmationEmail)}
                    isDisabled={loading}
                  >
                    <ButtonText color="$textDark0">{loading ? '...' : t('auth.resendConfirmation')}</ButtonText>
                  </Button>
                  <Button
                    size="lg"
                    borderRadius="$xl"
                    bg="$primary500"
                    onPress={() => {
                      setPendingConfirmationEmail(null);
                      switchMode('signIn');
                    }}
                  >
                    <ButtonText fontWeight="$black" letterSpacing={1} textTransform="uppercase">
                      {t('auth.backToSignIn')}
                    </ButtonText>
                  </Button>
                </VStack>
              </Box>
            </Box>
          </ScrollView>
        </KeyboardAvoidingView>
      </Box>
    );
  }

  const heroSubtitle =
    mode === 'forgotPassword'
      ? t('auth.resetSubtitle')
      : mode === 'signIn'
        ? t('auth.signInSubtitle')
        : t('auth.signUpSubtitle');

  return (
    <Box flex={1} bg={colors.bg}>
      {/* Embers sit behind the scroll content, above the flat background. */}
      <WarriorBackground />

      {/* The board lives in the background layer rather than the scroll flow:
          in-flow it landed below the fold on a tall screen. Its top is pinned
          to the card's top edge so the two read as one row, and it's
          non-interactive. Only on the two main modes - the reset detour is a
          task, and theatre mid-task is noise. */}
      {mode !== 'forgotPassword' && (
        <Box position="absolute" right={10} top={HERO_HEIGHT - PANEL_OVERLAP} pointerEvents="none">
          <TextFlippingBoard
            messages={SLOGANS}
            rows={BOARD_ROWS}
            cols={BOARD_COLS}
            tileSize={BOARD_TILE}
          />
        </Box>
      )}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AuthHero icon="barbell" title="SETWISE" subtitle={heroSubtitle} />

          <Animated.View
            style={{
              opacity: cardAnim,
              transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
            }}
          >
            <Box
              px="$5"
              mt={-PANEL_OVERLAP}
              w="100%"
              maxWidth={COLUMN_MAX_WIDTH}
              alignSelf="center"
            >
              <Box
                bg={colors.surface}
                borderRadius="$2xl"
                borderWidth={1}
                borderColor={colors.border}
                overflow="hidden"
                {...cardShadow}
              >
                {/* Reset is a detour off the two main modes, so it drops the
                    tabs entirely rather than showing a third one. */}
                {mode !== 'forgotPassword' && (
                  <HStack borderBottomWidth={1} borderBottomColor={colors.border}>
                    <SegmentTab
                      label={t('auth.signIn')}
                      active={mode === 'signIn'}
                      onPress={() => switchMode('signIn')}
                    />
                    <SegmentTab
                      label={t('auth.signUp')}
                      active={mode === 'signUp'}
                      onPress={() => switchMode('signUp')}
                    />
                  </HStack>
                )}

                <VStack space="md" p="$5">
                  {mode === 'forgotPassword' && (
                    <Pressable onPress={() => switchMode('signIn')} flexDirection="row" alignItems="center" mb="$1">
                      <Icon name="chevron-back" size={16} color={colors.accent} />
                      <Text color={colors.accent} size="xs" fontWeight="$bold" ml="$1">
                        {t('auth.backToSignIn')}
                      </Text>
                    </Pressable>
                  )}

                  {mode === 'signUp' && (
                    <HStack space="sm">
                      <Input flex={1} variant="outline" size="lg" borderColor={colors.border} borderRadius="$xl" bg={colors.surfaceAlt}>
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
                      <Input flex={1} variant="outline" size="lg" borderColor={colors.border} borderRadius="$xl" bg={colors.surfaceAlt}>
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

                  <Input variant="outline" size="lg" borderColor={colors.border} borderRadius="$xl" bg={colors.surfaceAlt}>
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
                    <Input variant="outline" size="lg" borderColor={colors.border} borderRadius="$xl" bg={colors.surfaceAlt}>
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
                    <Input variant="outline" size="lg" borderColor={colors.border} borderRadius="$xl" bg={colors.surfaceAlt}>
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
                    <HStack
                      alignItems="center"
                      space="xs"
                      bg="rgba(255, 107, 53, 0.08)"
                      borderWidth={1}
                      borderLeftWidth={3}
                      borderColor="rgba(255, 107, 53, 0.3)"
                      borderLeftColor={colors.danger}
                      borderRadius="$lg"
                      px="$3"
                      py="$2"
                    >
                      <Icon name="alert-circle" size={15} color={colors.danger} />
                      <Text color={colors.danger} size="xs" flex={1}>
                        {error}
                      </Text>
                    </HStack>
                  )}

                  {unconfirmedEmail && (
                    <Pressable onPress={() => handleResendConfirmation(unconfirmedEmail)}>
                      <Text color={colors.accent} size="xs" fontWeight="$semibold" textAlign="center">
                        {resendSent ? t('auth.resendSent') : t('auth.resendConfirmation')}
                      </Text>
                    </Pressable>
                  )}

                  {mode === 'forgotPassword' ? (
                    <Button size="lg" h={52} borderRadius="$xl" bg="$primary500" onPress={handleResetPassword} isDisabled={loading}>
                      <ButtonText fontWeight="$black" letterSpacing={1.2} textTransform="uppercase">
                        {loading ? '...' : t('auth.sendResetLink')}
                      </ButtonText>
                    </Button>
                  ) : (
                    <>
                      <Button size="lg" h={52} borderRadius="$xl" bg="$primary500" onPress={handleSubmit} isDisabled={loading}>
                        <HStack alignItems="center" space="sm">
                          {!loading && <Icon name="flame" size={17} color="#FFFFFF" />}
                          <ButtonText fontWeight="$black" letterSpacing={1.2} textTransform="uppercase">
                            {loading ? '...' : mode === 'signIn' ? t('auth.signIn') : t('auth.signUp')}
                          </ButtonText>
                        </HStack>
                      </Button>

                      <HStack alignItems="center" space="sm">
                        <Divider bg={colors.border} flex={1} />
                        <Text color={colors.textMuted} size="xs" textTransform="uppercase" letterSpacing={1}>
                          {t('auth.or')}
                        </Text>
                        <Divider bg={colors.border} flex={1} />
                      </HStack>

                      <Button
                        size="lg"
                        h={52}
                        borderRadius="$xl"
                        variant="outline"
                        borderColor={colors.border}
                        bg={colors.surfaceAlt}
                        onPress={handleGoogleSignIn}
                        isDisabled={googleLoading}
                      >
                        <HStack alignItems="center" space="sm">
                          <Ionicons name="logo-google" size={18} color={colors.textPrimary} />
                          <ButtonText color="$textDark0" fontWeight="$semibold">
                            {googleLoading ? '...' : t('auth.continueWithGoogle')}
                          </ButtonText>
                        </HStack>
                      </Button>
                    </>
                  )}
                </VStack>
              </Box>
            </Box>
          </Animated.View>

          <Text color={colors.textMuted} size="xs" textAlign="center" px="$8" mt="$5">
            {t('auth.tagline')}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Box>
  );
}
