import React from 'react';
import Svg, { Polyline, Circle, Line } from 'react-native-svg';

interface Point {
  timestamp: number;
  value: number;
}

interface Props {
  data: Point[];
  width?: number;
  height?: number;
  color?: string;
  gridColor?: string;
}

/**
 * Minimal line chart built directly on react-native-svg (already a project
 * dependency) instead of pulling in a charting library - keeps this simple
 * "value over time" case dependency-free.
 */
export default function LineChart({ data, width = 320, height = 140, color = '#4C8C5C', gridColor = '#2A2823' }: Props) {
  const padding = 12;
  const sorted = [...data].sort((a, b) => a.timestamp - b.timestamp);

  if (sorted.length === 0) {
    return <Svg width={width} height={height} />;
  }

  const minX = sorted[0].timestamp;
  const maxX = sorted[sorted.length - 1].timestamp;
  const values = sorted.map((p) => p.value);
  const minY = Math.min(...values);
  const maxY = Math.max(...values);

  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;

  function toSvgX(x: number) {
    return padding + ((x - minX) / spanX) * (width - padding * 2);
  }
  function toSvgY(y: number) {
    if (sorted.length === 1 || maxY === minY) return height / 2;
    return height - padding - ((y - minY) / spanY) * (height - padding * 2);
  }

  const points = sorted.map((p) => `${toSvgX(p.timestamp)},${toSvgY(p.value)}`).join(' ');
  const last = sorted[sorted.length - 1];

  return (
    <Svg width={width} height={height}>
      <Line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke={gridColor} strokeWidth={1} />
      {sorted.length > 1 ? (
        <Polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      ) : null}
      <Circle cx={toSvgX(last.timestamp)} cy={toSvgY(last.value)} r={4} fill={color} />
    </Svg>
  );
}
