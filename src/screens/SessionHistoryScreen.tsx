import React, { useCallback, useState } from 'react';
import { FlatList } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box, VStack, HStack, Heading, Text, Pressable, Spinner } from '@gluestack-ui/themed';
import Icon from '@/components/Icon';
import WarriorCard from '@/components/WarriorCard';
import { useAuth } from '@/contexts/AuthContext';
import { fetchSessionHistory, SessionSummary } from '@/services/workouts';
import { formatDurationShort } from '@/services/sessionFormat';
import { useI18n } from '@/i18n';
import { colors } from '@/theme';

/**
 * Past sessions, newest first. The calendar already answers "did I train on
 * this day"; this answers "what were my last sessions like" - duration,
 * volume and exercises in one column you can scan without tapping into days.
 */
export default function SessionHistoryScreen() {
  const { t, dateLocale } = useI18n();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      if (!userId) {
        setSessions([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      fetchSessionHistory(userId)
        .then((rows) => {
          if (!cancelled) setSessions(rows);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [userId])
  );

  const totalVolume = sessions.reduce((sum, s) => sum + s.totalVolumeKg, 0);

  return (
    <Box flex={1} bg="transparent" pt={insets.top + 8} px="$4">
      <HStack alignItems="center" space="sm" mb="$4">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Icon name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <VStack flex={1}>
          <Text color={colors.accent} fontSize={11} fontWeight="$bold" letterSpacing={1.4} textTransform="uppercase">
            {t('history.kicker')}
          </Text>
          <Heading color="$textDark0" size="xl">
            {t('history.title')}
          </Heading>
        </VStack>
      </HStack>

      {loading ? (
        <Box flex={1} alignItems="center" justifyContent="center">
          <Spinner color="$primary400" />
        </Box>
      ) : sessions.length === 0 ? (
        <Text color={colors.textMuted} size="sm">
          {t('history.empty')}
        </Text>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.workoutId}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListHeaderComponent={
            <Text color={colors.textMuted} fontSize={11} mb="$3" fontFamily="$mono">
              {t('history.totals', { count: sessions.length, volume: totalVolume })}
            </Text>
          }
          renderItem={({ item }) => {
            const date = new Date(`${item.dateKey}T00:00:00`);
            return (
              <WarriorCard mb={8} cut={16}>
                <VStack space="xs">
                <HStack alignItems="center" justifyContent="space-between">
                  <Text color="$textDark0" size="sm" fontWeight="$bold" textTransform="capitalize">
                    {date.toLocaleDateString(dateLocale, { weekday: 'long', day: 'numeric', month: 'long' })}
                  </Text>
                  {/* A back-filled day has no start or end, so it says so
                      instead of showing a made-up duration. */}
                  <HStack alignItems="center" space="xs">
                    <Icon
                      name={item.durationSeconds != null ? 'time-outline' : 'add'}
                      size={12}
                      color={colors.textMuted}
                    />
                    <Text color={colors.textSecondary} fontSize={12} fontFamily="$mono">
                      {item.durationSeconds != null
                        ? formatDurationShort(item.durationSeconds, t('history.hourShort'), t('history.minuteShort'))
                        : item.unfinished
                          ? t('history.unfinished')
                          : t('history.manual')}
                    </Text>
                  </HStack>
                </HStack>

                <HStack space="md">
                  <Text color={colors.textMuted} fontSize={11} fontFamily="$mono">
                    {t('history.setCount', { count: item.setCount })}
                  </Text>
                  <Text color={colors.textMuted} fontSize={11} fontFamily="$mono">
                    {t('history.volume', { volume: item.totalVolumeKg })}
                  </Text>
                </HStack>

                <Text color={colors.textSecondary} fontSize={12} numberOfLines={2}>
                  {item.exerciseNames.join(' · ')}
                </Text>
                </VStack>
              </WarriorCard>
            );
          }}
        />
      )}
    </Box>
  );
}
