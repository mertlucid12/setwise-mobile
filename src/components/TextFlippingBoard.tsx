import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, HStack, VStack, Text } from '@gluestack-ui/themed';
import { colors } from '@/theme';

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
  const tickRef = useRef(0);

  useEffect(() => {
    tickRef.current = 0;

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
        setCells(
          target.map((char) =>
            char === ' ' && Math.random() < IDLE_FLIP_CHANCE ? randomGlyph() : char
          )
        );
        return;
      }

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
    <VStack space="xs" alignItems="center">
      {Array.from({ length: rows }, (_, row) => (
        <HStack key={row} space="xs">
          {Array.from({ length: cols }, (_, col) => {
            const char = cells[row * cols + col] ?? ' ';
            const lit = char !== ' ';
            return (
              <Box
                key={col}
                w={tileSize}
                h={tileSize * 1.35}
                borderRadius="$sm"
                bg={lit ? 'rgba(10, 9, 8, 0.72)' : 'rgba(10, 9, 8, 0.34)'}
                borderWidth={1}
                borderColor={lit ? 'rgba(212, 175, 55, 0.35)' : 'rgba(255, 255, 255, 0.10)'}
                alignItems="center"
                justifyContent="center"
                overflow="hidden"
              >
                {/* The hairline is the split-flap seam - it's what makes a
                    tile read as a mechanical flap rather than a text box. */}
                <Box position="absolute" left={0} right={0} top="50%" h={1} bg="rgba(0, 0, 0, 0.55)" />
                <Text
                  color={colors.accentSoft}
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
    </VStack>
  );
}
