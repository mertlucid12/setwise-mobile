import React, { useState } from 'react';
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Pressable,
} from '@gluestack-ui/themed';
import Icon, { IconName } from '@/components/Icon';
import { Weekday } from '@/types';
import { useI18n } from '@/i18n';
import { colors } from '@/theme';

/**
 * Where a routine on a given date came from. The weekly plan and a one-off
 * addition need different verbs: you "skip just this Monday" out of a
 * recurrence, but you "remove" a session you dropped onto a single day.
 */
export type PlannedSource = 'weekly' | 'added';

interface Props {
  visible: boolean;
  onClose: () => void;
  routineTitle: string;
  source: PlannedSource;
  /** The tapped day, and its weekday under the Monday-first grid. */
  dateLabel: string;
  weekday: Weekday;
  weekdayLabel: string;
  /** Other dates in the same week, for "move this one to another day". */
  weekDays: { dateKey: string; weekday: Weekday; label: string; isSelf: boolean }[];
  weekdayLabels: string[];
  onSkipThisDay: () => Promise<void>;
  onRemoveFromWeek: () => Promise<void>;
  onMoveToDate: (dateKey: string) => Promise<void>;
  onSwapWeekday: (other: Weekday) => Promise<void>;
}

function OptionCard({
  icon,
  title,
  body,
  tone = 'normal',
  onPress,
}: {
  icon: IconName;
  title: string;
  body: string;
  tone?: 'normal' | 'danger';
  onPress: () => void;
}) {
  const accent = tone === 'danger' ? colors.statusHot : colors.primary;
  return (
    <Pressable
      onPress={onPress}
      bg={colors.surfaceAlt}
      borderWidth={1}
      borderLeftWidth={3}
      borderColor={colors.border}
      borderLeftColor={accent}
      borderRadius="$2xl"
      px="$3"
      py="$3"
      flexDirection="row"
      alignItems="center"
    >
      <Box
        w={34}
        h={34}
        borderRadius="$xl"
        bg={colors.surface}
        borderWidth={1}
        borderColor={colors.border}
        alignItems="center"
        justifyContent="center"
        mr="$3"
      >
        <Icon name={icon} size={16} color={accent} />
      </Box>
      <VStack flex={1}>
        <Text color="$textDark0" size="sm" fontWeight="$bold">
          {title}
        </Text>
        <Text color={colors.textMuted} fontSize={11}>
          {body}
        </Text>
      </VStack>
      <Icon name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

function DayChip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      bg={colors.surfaceAlt}
      borderWidth={1}
      borderColor={colors.border}
      borderRadius="$xl"
      px="$3"
      py="$2"
      mr="$2"
      mb="$2"
    >
      <Text color="$textDark0" fontSize={12} fontWeight="$bold" textTransform="capitalize">
        {label}
      </Text>
    </Pressable>
  );
}

type Step = 'choose' | 'move' | 'swap';

/**
 * The edit menu for one planned session on one date.
 *
 * Its whole reason to exist is the difference between "this week" and "every
 * week" - the weekly plan alone could only answer the second, so changing one
 * Monday meant rewriting every Monday. Each option here says which of the two
 * it does, because getting that wrong silently rewrites the user's history.
 */
export default function PlannedRoutineSheet({
  visible,
  onClose,
  routineTitle,
  source,
  dateLabel,
  weekday,
  weekdayLabel,
  weekDays,
  weekdayLabels,
  onSkipThisDay,
  onRemoveFromWeek,
  onMoveToDate,
  onSwapWeekday,
}: Props) {
  const { t } = useI18n();
  const [step, setStep] = useState<Step>('choose');
  const [busy, setBusy] = useState(false);

  function close() {
    setStep('choose');
    onClose();
  }

  async function run(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    try {
      await action();
      close();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal isOpen={visible} onClose={close} size="lg">
      <ModalBackdrop />
      <ModalContent bg={colors.surface} borderColor={colors.border} borderWidth={1} borderRadius="$2xl">
        <ModalHeader borderBottomWidth={1} borderBottomColor={colors.border}>
          <VStack flex={1}>
            <Text color={colors.accent} fontSize={10} fontWeight="$bold" letterSpacing={1.4} textTransform="uppercase">
              {dateLabel}
            </Text>
            <Heading color="$textDark0" size="md" numberOfLines={1}>
              {routineTitle}
            </Heading>
          </VStack>
          <ModalCloseButton>
            <Icon name="close" size={18} color={colors.textMuted} />
          </ModalCloseButton>
        </ModalHeader>

        <ModalBody>
          {step === 'choose' && (
            <VStack space="sm" py="$1">
              {source === 'weekly' ? (
                <>
                  <OptionCard
                    icon="calendar-outline"
                    title={t('plan.moveThisWeek')}
                    body={t('plan.moveThisWeekBody')}
                    onPress={() => setStep('move')}
                  />
                  <OptionCard
                    icon="swords"
                    title={t('plan.swapDays')}
                    body={t('plan.swapDaysBody', { day: weekdayLabel })}
                    onPress={() => setStep('swap')}
                  />
                  <OptionCard
                    icon="close"
                    title={t('plan.skipThisDay')}
                    body={t('plan.skipThisDayBody')}
                    onPress={() => run(onSkipThisDay)}
                  />
                  <OptionCard
                    icon="trash-outline"
                    title={t('plan.removeEveryWeek', { day: weekdayLabel })}
                    body={t('plan.removeEveryWeekBody')}
                    tone="danger"
                    onPress={() => run(onRemoveFromWeek)}
                  />
                </>
              ) : (
                <>
                  <OptionCard
                    icon="calendar-outline"
                    title={t('plan.moveThisWeek')}
                    body={t('plan.moveThisWeekBody')}
                    onPress={() => setStep('move')}
                  />
                  <OptionCard
                    icon="trash-outline"
                    title={t('plan.removeFromDay')}
                    body={t('plan.removeFromDayBody')}
                    tone="danger"
                    onPress={() => run(onSkipThisDay)}
                  />
                </>
              )}
            </VStack>
          )}

          {step === 'move' && (
            <VStack space="sm" py="$1">
              <Text color={colors.textMuted} fontSize={12}>
                {t('plan.movePrompt')}
              </Text>
              <HStack flexWrap="wrap">
                {weekDays
                  .filter((d) => !d.isSelf)
                  .map((d) => (
                    <DayChip key={d.dateKey} label={d.label} onPress={() => run(() => onMoveToDate(d.dateKey))} />
                  ))}
              </HStack>
            </VStack>
          )}

          {step === 'swap' && (
            <VStack space="sm" py="$1">
              <Text color={colors.textMuted} fontSize={12}>
                {t('plan.swapPrompt', { day: weekdayLabel })}
              </Text>
              <HStack flexWrap="wrap">
                {weekdayLabels.map((label, idx) =>
                  idx === weekday ? null : (
                    <DayChip key={label} label={label} onPress={() => run(() => onSwapWeekday(idx as Weekday))} />
                  )
                )}
              </HStack>
            </VStack>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
