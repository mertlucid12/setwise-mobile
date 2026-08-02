import React from 'react';
import { ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Pressable,
  Spinner,
  SafeAreaView,
} from '@gluestack-ui/themed';
import Icon from '@/components/Icon';
import { useAppToast } from '@/components/AppToast';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import AnimatedBackground from '@/components/AnimatedBackground';
import { useI18n } from '@/i18n';
import { colors, cardShadow } from '@/theme';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { t, lang, setLang } = useI18n();
  const { session, signOut } = useAuth();
  const { profile, loading } = useProfile();
  const toast = useAppToast();

  async function handleSignOut() {
    await signOut();
    toast({ title: t('toast.signedOut'), variant: 'info' });
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <Box flex={1} bg="transparent" alignItems="center" justifyContent="center">
          <Spinner color="$primary400" />
        </Box>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Box flex={1} bg="transparent">
        <AnimatedBackground />
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <Box px="$4" pt="$4" pb="$8">
            <Text color={colors.accent} fontSize={12} fontWeight="$bold" letterSpacing={1.2} textTransform="uppercase">
              {t('profile.account')}
            </Text>
            <Heading color="$textDark0" size="xl" mb="$1">
              {t('profile.title')}
            </Heading>
            {/* The name, not the address: this is the user's own profile, so
                it should greet them the way the app does everywhere else.
                The email is still the fallback - a brand-new account has no
                name yet, and an empty line here would read as a bug. */}
            <Text color="$textDark500" size="sm" mb="$5">
              {profile.displayName?.trim() || session?.user.email}
            </Text>

            <Box bg="$backgroundDark900" borderWidth={1} borderColor="$borderDark800" borderRadius="$xl" p="$4" mb="$4" {...cardShadow}>
              <HStack alignItems="center" justifyContent="space-between">
                <Text color="$textDark0" fontWeight="$bold" size="sm">
                  {t('profile.language')}
                </Text>
                <HStack bg="$backgroundDark800" borderRadius="$full" p={2} space="xs">
                  {(['en', 'tr'] as const).map((code) => (
                    <Pressable
                      key={code}
                      onPress={() => setLang(code)}
                      bg={lang === code ? '$primary500' : 'transparent'}
                      borderRadius="$full"
                      px="$3"
                      py="$1"
                    >
                      <Text
                        color={lang === code ? '$textDark0' : '$textDark500'}
                        size="xs"
                        fontWeight={lang === code ? '$bold' : '$medium'}
                      >
                        {code.toUpperCase()}
                      </Text>
                    </Pressable>
                  ))}
                </HStack>
              </HStack>
            </Box>

            {/* Onboarding's questions live behind this row now: they're
                settings you revisit rarely, and inline they pushed everything
                else on this tab below four blocks of questions. */}
            <Pressable
              onPress={() => navigation.navigate('TrainingProfile' as never)}
              bg="$backgroundDark900"
              borderWidth={1}
              borderColor="$borderDark800"
              borderRadius="$xl"
              p="$4"
              mb="$4"
              flexDirection="row"
              alignItems="center"
              {...cardShadow}
            >
              <Box
                w={40}
                h={40}
                borderRadius="$full"
                bg="$backgroundDark800"
                borderWidth={1}
                borderColor={colors.accent}
                alignItems="center"
                justifyContent="center"
                mr="$3"
              >
                <Icon name="medal-outline" size={19} color={colors.primaryLight} />
              </Box>
              <VStack flex={1}>
                <Text color="$textDark0" fontWeight="$bold" size="sm">
                  {t('profile.trainingProfile')}
                </Text>
                <Text color="$textDark500" size="xs">
                  {t('profile.trainingProfileSub')}
                </Text>
              </VStack>
              <Icon name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate('BodyTracking' as never)}
              bg="$backgroundDark900"
              borderWidth={1}
              borderColor="$borderDark800"
              borderRadius="$xl"
              p="$4"
              mb="$4"
              flexDirection="row"
              alignItems="center"
              {...cardShadow}
            >
              <Box
                w={40}
                h={40}
                borderRadius="$full"
                bg="$backgroundDark800"
                borderWidth={1}
                borderColor={colors.accent}
                alignItems="center"
                justifyContent="center"
                mr="$3"
              >
                <Icon name="body-outline" size={19} color={colors.primaryLight} />
              </Box>
              <VStack flex={1}>
                <Text color="$textDark0" fontWeight="$bold" size="sm">
                  {t('profile.bodyTracking')}
                </Text>
                <Text color="$textDark500" size="xs">
                  {t('profile.bodyTrackingSub')}
                </Text>
              </VStack>
              <Icon name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>

            <Pressable
              onPress={handleSignOut}
              bg="$backgroundDark900"
              borderWidth={1}
              borderColor="$borderDark800"
              borderRadius="$xl"
              p="$4"
              flexDirection="row"
              alignItems="center"
            >
              <Icon name="log-out-outline" size={18} color={colors.danger} />
              <Text color={colors.danger} fontWeight="$semibold" size="sm" ml="$2">
                {t('profile.signOut')}
              </Text>
            </Pressable>
          </Box>
        </ScrollView>
      </Box>
    </SafeAreaView>
  );
}
