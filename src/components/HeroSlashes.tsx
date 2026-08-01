import React from 'react';
import Svg, { Polygon } from 'react-native-svg';
import { colors } from '@/theme';

interface Props {
  height: number;
}

/**
 * Angular slashes cutting across a gradient hero. Pure decoration, but it's
 * what carries the warrior read without an image asset - the app ships no
 * photography and a flat gradient alone looks unfinished.
 *
 * Points are expressed against a 250-tall reference and scaled, so the same
 * diagonal angle holds whatever height the host hero uses.
 */
export default function HeroSlashes({ height }: Props) {
  const k = height / 250;
  const slash = (topLeft: number, topRight: number, bottomLeft: number, bottomRight: number) =>
    `${topLeft},0 ${topRight},0 ${bottomRight},${height} ${bottomLeft},${height}`;

  return (
    <Svg width="100%" height={height} style={{ position: 'absolute', top: 0, left: 0 }} pointerEvents="none">
      <Polygon points={slash(220, 300, 10 * k, 90 * k)} fill={colors.accent} opacity={0.07} />
      <Polygon points={slash(320, 348, 110 * k, 138 * k)} fill={colors.accent} opacity={0.12} />
      <Polygon points={slash(400, 460, 190 * k, 250 * k)} fill="#FFFFFF" opacity={0.04} />
    </Svg>
  );
}
