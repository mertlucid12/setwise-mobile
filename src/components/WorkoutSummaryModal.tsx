import React from 'react';
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalBody,
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  ButtonText,
  Spinner,
} from '@gluestack-ui/themed';
import Icon, { IconName } from '@/components/Icon';
import { SessionSummary } from '@/services/workouts';
import { formatDuration } from '@/services/sessionFormat';
import { useI18n } from '@/i18n';
import { colors, cardShadow } from '@/theme';

/**
 * Post-session summary. Finishing a workout used to just clear a banner,
 * which gave the session no ending - this is the payoff screen that makes
 * "Finish" mean something: what you actually did, in the numbers the app
 * already tracks. Nothing here is estimated.
 */
interface Props {
  visible: boolean;
  onClose: () => void;
  summary: SessionSummary | null;
  loading: boolean;
}

function Stat({ icon, value, unit, label }: { icon: IconName; value: string; unit?: string; label: string }) {
  return (
    <VStack
      flex={1}
      bg={colors.surfaceAlt}
      borderWidth={1}
      borderColor={colors.border}
      borderRadius="$xl"
      py="$3"
      px="$2"
      alignItems="center"
      space="xs"
    >
      <Icon name={icon} size={16} color={colors.accent} />
      <HStack alignItems="baseline" space="xs">
        <Text color="$textDark0" fontSize={19} fontWeight="$extrabold" fontFamily="$mono">
          {value}
        </Text>
        {unit && (
          <Text color={colors.textMuted} fontSize={10} fontFamily="$mono">
            {unit}
          </Text>
        )}
      </HStack>
      <Text
        color={colors.textMuted}
        fontSize={9}
        fontFamily="$mono"
        letterSpacing={1.2}
        textTransform="uppercase"
      >
        {label}
      </Text>
    </VStack>
  );
}

export default function WorkoutSummaryModal({ visible, onClose, summary, loading }: Props) {
  const { t } = useI18n();

  return (
    <Modal isOpen={visible} onClose={onClose}>
      <ModalBackdrop />
      <ModalContent bg={colors.surface} borderColor={colors.border} borderWidth={1} borderRadius="$2xl" {...cardShadow}>
        <ModalBody>
          <VStack space="md" py="$3">
            <VStack alignItems="center" space="xs">
              <Box
                w={52}
                h={52}
                borderRadius="$full"
                bg="#410001"
                borderWidth={1}
                borderColor={colors.accent}
                alignItems="center"
                justifyContent="center"
              >
                <Icon name="flame" size={26} color={colors.accent} />
              </Box>
              <Heading color="$textDark0" size="lg" textAlign="center">
                {t('summary.title')}
              </Heading>
              <Text color={colors.textMuted} fontSize={12} textAlign="center">
                {t('summary.subtitle')}
              </Text>
            </VStack>

            {loading ? (
              <Box py="$6" alignItems="center">
                <Spinner color="$primary400" />
              </Box>
            ) : summary ? (
              <>
                <HStack space="sm">
                  <Stat
                    icon="time-outline"
                    value={summary.durationSeconds != null ? formatDuration(summary.durationSeconds) : '—'}
                    label={t('summary.duration')}
                  />
                  <Stat icon="barbell" value={String(summary.setCount)} label={t('summary.sets')} />
                  <Stat
                    icon="stats-chart"
                    value={String(summary.totalVolumeKg)}
                    unit="kg"
                    label={t('summary.volume')}
                  />
                </HStack>

                {summary.exerciseNames.length > 0 && (
                  <VStack space="xs">
                    <Text
                      color={colors.accent}
                      fontSize={11}
                      fontWeight="$bold"
                      letterSpacing={1.2}
                      textTransform="uppercase"
                    >
                      {t('summary.exercises')}
                    </Text>
                    {summary.exerciseNames.map((name) => (
                      <HStack
                        key={name}
                        alignItems="center"
                        space="sm"
                        bg={colors.surfaceAlt}
                        borderWidth={1}
                        borderLeftWidth={3}
                        borderColor={colors.border}
                        borderLeftColor={colors.primary}
                        borderRadius="$lg"
                        px="$3"
                        py="$2"
                      >
                        <Text color="$textDark0" size="sm" fontWeight="$semibold" numberOfLines={1}>
                          {name}
                        </Text>
                      </HStack>
                    ))}
                  </VStack>
                )}
              </>
            ) : (
              <Text color={colors.textMuted} size="sm" textAlign="center">
                {t('summary.empty')}
              </Text>
            )}

            <Button h={48} borderRadius="$xl" bg="$primary500" onPress={onClose}>
              <ButtonText fontWeight="$black" letterSpacing={1.2} textTransform="uppercase">
                {t('summary.done')}
              </ButtonText>
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
