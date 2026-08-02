import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, HStack, VStack, Text } from '@gluestack-ui/themed';
import { colors, cardShadow } from '@/theme';

/**
 * Split-flap board, the airport/stadium departure sign. It's a fixed grid of
 * tiles - not just the letters - so the empty cells read as part of the board
 * the way they do on a real one, and idle cells keep riffling between
 * messages instead of freezing into a dead rectangle.
 *
 * Driven by a plain interval over component state rather than an animation
 * library: the effect is discrete (one glyph swap per tick, no interpolation),
 * so Reanimated would buy nothing and add a dependency the app doesn't have.
 *
 * Cells settle in reading order, one every FLIPS_PER_TILE ticks, which is what
 * makes a line resolve as a wave rather than all at once.
 */
const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const TICK_MS = 60;
/** Ticks each cell riffles before it locks. */
const FLIPS_PER_TILE = 2;
/** Ticks a finished board rests before the next message flips in. */
const HOLD_TICKS = 55;
/** Chance an idle blank cell riffles on any given hold tick. */
const IDLE_FLIP_CHANCE = 0.06;

/**
 * Colour carries meaning rather than decoration, which is the whole warrior
 * direction in miniature: a flap still spinning burns crimson, a flap that
 * has locked onto its letter turns battle gold. So the board visibly resolves
 * from red noise into a gold slogan instead of just cycling pretty colours.
 */
const SETTLED_COLOR = colors.accentSoft;
const SPINNING_COLOR = colors.primaryLight;

interface Props {
  /** Lines to cycle through. Newlines split a message across board rows. */
  messages: string[];
  rows?: number;
  cols?: number;
  tileSize?: number;
}

function randomGlyph(): string {
  return CHARSET[Math.floor(Math.random() * CHARSET.length)];
}

/**
 * Lays a message into the grid: lines are centred horizontally and the block
 * is centred vertically, so short slogans sit in the middle of the board
 * instead of hugging the top-left corner.
 */
function layout(message: string, rows: number, cols: number): string[] {
  const lines = message.split('\n').map((line) => line.slice(0, cols));
  const top = Math.max(0, Math.floor((rows - lines.length) / 2));
  const grid: string[] = Array(rows * cols).fill(' ');

  lines.forEach((line, i) => {
    const row = top + i;
    if (row >= rows) return;
    const left = Math.floor((cols - line.length) / 2);
    line.split('').forEach((char, j) => {
      grid[row * cols + left + j] = char;
    });
  });

  return grid;
}

export default function TextFlippingBoard({ messages, rows = 4, cols = 9, tileSize = 26 }: Props) {
  const [messageIndex, setMessageIndex] = useState(0);
  const target = useMemo(
    () => layout(messages[messageIndex] ?? '', rows, cols),
    [messages, messageIndex, rows, cols]
  );
  const [cells, setCells] = useState<string[]>(target);
  /** How many cells have locked in, in reading order - drives tile colour. */
  const [settledCount, setSettledCount] = useState(target.length);
  const tickRef = useRef(0);

  useEffect(() => {
    tickRef.current = 0;
    setSettledCount(0);

    const id = setInterval(() => {
      tickRef.current += 1;
      const tick = tickRef.current;
      const settled = Math.floor(tick / FLIPS_PER_TILE);

      if (settled >= target.length) {
        // Board has landed. Hold it - but keep a few blank cells riffling so
        // the sign still looks powered on - then move to the next message.
        if (tick >= target.length * FLIPS_PER_TILE + HOLD_TICKS) {
          setMessageIndex((i) => (i + 1) % messages.length);
          return;
        }
        setSettledCount(target.length);
        setCells(
          target.map((char) =>
            char === ' ' && Math.random() < IDLE_FLIP_CHANCE ? randomGlyph() : char
          )
        );
        return;
      }

      setSettledCount(settled);

      setCells(
        target.map((char, i) => {
          if (i < settled) return char;
          // The cell currently landing riffles every tick; the ones ahead of
          // it flicker sparsely, which reads as the board working its way
          // across rather than a wall of noise.
          if (i === settled) return randomGlyph();
          return Math.random() < 0.08 ? randomGlyph() : ' ';
        })
      );
    }, TICK_MS);

    return () => clearInterval(id);
  }, [target, messages.length]);

  return (
    // Housing: the board is mounted on a plate with a crimson head rail and
    // gold corner ticks, so it reads as hardware bolted to the wall rather
    // than a floating grid of boxes.
    <VStack
      space="xs"
      alignItems="center"
      bg={colors.surface}
      borderWidth={1}
      borderColor={colors.border}
      borderRadius="$2xl"
      p={tileSize * 0.28}
      {...cardShadow}
    >
      <Box w="100%" h={4} bg={colors.primary} borderRadius="$xs" mb={tileSize * 0.14} />

      {Array.from({ length: rows }, (_, row) => (
        <HStack key={row} space="xs">
          {Array.from({ length: cols }, (_, col) => {
            const index = row * cols + col;
            const char = cells[index] ?? ' ';
            const lit = char !== ' ';
            const tint = index < settledCount ? SETTLED_COLOR : SPINNING_COLOR;
            return (
              <Box
                key={col}
                w={tileSize}
                h={tileSize * 1.35}
                borderRadius="$sm"
                bg={lit ? 'rgba(10, 9, 8, 0.82)' : 'rgba(10, 9, 8, 0.34)'}
                borderWidth={1}
                borderColor={lit ? tint : 'rgba(255, 255, 255, 0.10)'}
                alignItems="center"
                justifyContent="center"
                overflow="hidden"
                // A lit flap glows in its own colour, which is what carries the
                // board across a dark screen at this size.
                shadowColor={lit ? tint : 'transparent'}
                shadowOffset={{ width: 0, height: 0 }}
                shadowOpacity={lit ? 0.55 : 0}
                shadowRadius={lit ? tileSize * 0.3 : 0}
              >
                {/* The hairline is the split-flap seam - it's what makes a
                    tile read as a mechanical flap rather than a text box. */}
                <Box position="absolute" left={0} right={0} top="50%" h={1} bg="rgba(0, 0, 0, 0.55)" />
                <Text
                  color={tint}
                  fontSize={tileSize * 0.6}
                  lineHeight={tileSize * 0.72}
                  fontWeight="$black"
                  fontFamily="$mono"
                >
                  {char}
                </Text>
              </Box>
            );
          })}
        </HStack>
      ))}

      <HStack w="100%" justifyContent="space-between" mt={tileSize * 0.14}>
        <Box w={tileSize * 0.4} h={2} bg={colors.accent} />
        <Box w={tileSize * 0.4} h={2} bg={colors.accent} />
      </HStack>
    </VStack>
  );
}
