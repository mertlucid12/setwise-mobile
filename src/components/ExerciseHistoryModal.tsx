import React from 'react';
import { FlatList } from 'react-native';
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Heading,
  Text,
  Box,
} from '@gluestack-ui/themed';
import Icon from '@/components/Icon';
import { SetEntry } from '@/types';
import { estimateOneRepMax } from '@/services/oneRepMax';
import { useI18n } from '@/i18n';
import LineChart from './LineChart';
import { colors } from '@/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  exerciseName: string;
  sets: SetEntry[];
}

export default function ExerciseHistoryModal({ visible, onClose, exerciseName, sets }: Props) {
  const { t, dateLocale } = useI18n();
  const workingSets = sets.filter((s) => s.setType !== 'warmup').sort((a, b) => a.timestamp - b.timestamp);
  const chartData = workingSets.map((s) => ({ timestamp: s.timestamp, value: estimateOneRepMax(s.weightKg, s.reps) }));
  const best = chartData.length > 0 ? Math.max(...chartData.map((p) => p.value)) : null;

  return (
    <Modal isOpen={visible} onClose={onClose}>
      <ModalBackdrop />
      <ModalContent bg="$backgroundDark900" borderColor="$borderDark800" borderWidth={1} maxHeight="85%">
        <ModalHeader>
          <Heading color="$textDark0" size="lg">
            {exerciseName}
          </Heading>
          <ModalCloseButton>
            <Icon name="close" size={22} color={colors.textMuted} />
          </ModalCloseButton>
        </ModalHeader>

        <ModalBody>
          {chartData.length === 0 ? (
            <Text color="$textDark400" size="sm">
              {t('history.noHistory')}
            </Text>
          ) : (
            <VStack space="md">
              <VStack space="xs">
                <HStack alignItems="center" space="xs">
                  <Icon name="trending-up" size={14} color={colors.accent} />
                  <Text color={colors.accent} fontWeight="$bold" size="sm" fontFamily="$mono">
                    {t('history.est1rm')} {best != null ? `· ${t('history.best', { weight: best })}` : ''}
                  </Text>
                </HStack>
                <Box alignItems="center">
                  <LineChart data={chartData} width={280} height={130} color={colors.primaryLight} />
                </Box>
              </VStack>

              <VStack space="xs">
                <Text color="$textDark400" size="xs" textTransform="uppercase" letterSpacing={1}>
                  {t('history.past')}
                </Text>
                <FlatList
                  data={[...workingSets].reverse()}
                  keyExtractor={(item) => item.id}
                  style={{ maxHeight: 220 }}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <HStack
                      justifyContent="space-between"
                      alignItems="center"
                      bg="$backgroundDark800"
                      borderRadius="$lg"
                      px="$3"
                      py="$2"
                      mb="$2"
                    >
                      <Text color="$textDark500" size="xs" fontFamily="$mono">
                        {new Date(item.timestamp).toLocaleDateString(dateLocale)}
                      </Text>
                      <Text color="$textDark0" size="sm" fontWeight="$semibold" fontFamily="$mono">
                        {item.weightKg}kg × {item.reps}
                      </Text>
                      <Text color="$textDark500" size="xs" fontFamily="$mono">
                        ~{estimateOneRepMax(item.weightKg, item.reps)}kg 1RM
                      </Text>
                    </HStack>
                  )}
                />
              </VStack>
            </VStack>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
