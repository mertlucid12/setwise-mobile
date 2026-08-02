import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import { GLView } from 'expo-gl';
import { colors } from '@/theme';

/**
 * Animated GLSL background - domain-warped fBm noise that drifts like heat in
 * a dark forge. Two presets:
 *
 *   'forge'  - the login backdrop. Brighter, with blood-red glow pockets, so
 *              the auth screen has something alive behind it.
 *   'ember'  - the in-app backdrop. The same technique tuned much darker so it
 *              reads as moving texture behind content, never as decoration
 *              competing with it.
 *
 * Both shaders are the reference implementations, unchanged apart from
 * dropping the mouse uniform (there is no cursor on a phone).
 *
 * Two things are deliberate and worth keeping:
 *
 *  - The loop is throttled to ~30fps. Six octaves of fBm per pixel is a real
 *    per-frame cost, and this runs behind every screen; at 60fps it heats the
 *    device for motion nobody can perceive at this speed.
 *  - Any failure - no GL context, a driver that rejects the program, a
 *    runtime without expo-gl - falls back to the flat background colour
 *    rather than throwing. A missing backdrop is a cosmetic loss; a crash on
 *    the login screen is not.
 */
type Preset = 'forge' | 'ember';

const VERTEX = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FORGE = `precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
varying vec2 v_texCoord;

float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

float smoothNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = noise(i);
    float b = noise(i + vec2(1.0, 0.0));
    float c = noise(i + vec2(0.0, 1.0));
    float d = noise(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
        v += a * smoothNoise(p);
        p *= 2.0;
        a *= 0.5;
    }
    return v;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = uv * 3.0;

    float t = u_time * 0.2;
    float n1 = fbm(p + vec2(t * 0.5, t * 0.2));
    float n2 = fbm(p - vec2(t * 0.3, t * 0.5) + n1);

    vec3 color1 = vec3(0.07, 0.07, 0.07);
    vec3 color2 = vec3(0.9, 0.13, 0.12);
    vec3 color3 = vec3(0.2, 0.05, 0.05);

    float intensity = smoothstep(0.3, 0.7, n2);
    vec3 finalColor = mix(color1, color3, n1);
    finalColor = mix(finalColor, color2 * 0.5, intensity * 0.4);

    float glow = smoothstep(0.4, 0.5, n2 * n1);
    finalColor += color2 * glow * 0.2;

    gl_FragColor = vec4(finalColor, 1.0);
}`;

const EMBER = `precision highp float;
uniform float u_time;
uniform vec2 u_resolution;

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

#define OCTAVES 6
float fbm(vec2 st) {
    float value = 0.0;
    float amplitude = .5;
    for (int i = 0; i < OCTAVES; i++) {
        value += amplitude * noise(st);
        st *= 2.;
        amplitude *= .5;
    }
    return value;
}

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    st.x *= u_resolution.x / u_resolution.y;

    vec3 color = vec3(0.0);
    vec2 q = vec2(0.);
    q.x = fbm(st + 0.00 * u_time);
    q.y = fbm(st + vec2(1.0));

    vec2 r = vec2(0.);
    r.x = fbm(st + 1.0 * q + vec2(1.7, 9.2) + 0.15 * u_time);
    r.y = fbm(st + 1.0 * q + vec2(8.3, 2.8) + 0.126 * u_time);

    float f = fbm(st + r);

    color = mix(vec3(0.05, 0.05, 0.05),
                vec3(0.15, 0.05, 0.05),
                clamp((f * f) * 4.0, 0.0, 1.0));

    color = mix(color,
                vec3(0.1, 0.1, 0.1),
                clamp(length(q), 0.0, 1.0));

    color = mix(color,
                vec3(0.3, 0.0, 0.0),
                clamp(length(r.x), 0.0, 1.0) * 0.2);

    gl_FragColor = vec4((f * f * f + 0.6 * f * f + 0.5 * f) * color, 1.0);
}`;

const FRAME_MS = 1000 / 30;

interface Props {
  preset?: Preset;
  /** Dimming veil over the shader, so content keeps its contrast. */
  overlayOpacity?: number;
}

export default function ShaderBackground({ preset = 'ember', overlayOpacity = 0 }: Props) {
  const [failed, setFailed] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled?.().then((enabled) => {
      if (!cancelled) setReduceMotion(!!enabled);
    });
    return () => {
      cancelled = true;
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  if (failed || reduceMotion) {
    return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }]} />;
  }

  function onContextCreate(gl: WebGLRenderingContext & { endFrameEXP: () => void }) {
    try {
      const compile = (type: number, src: string) => {
        const shader = gl.createShader(type)!;
        gl.shaderSource(shader, src);
        gl.compileShader(shader);
        return shader;
      };

      const program = gl.createProgram()!;
      gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, preset === 'forge' ? FORGE : EMBER));
      gl.linkProgram(program);
      gl.useProgram(program);

      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

      const position = gl.getAttribLocation(program, 'a_position');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

      const uTime = gl.getUniformLocation(program, 'u_time');
      const uResolution = gl.getUniformLocation(program, 'u_resolution');

      const width = gl.drawingBufferWidth;
      const height = gl.drawingBufferHeight;
      gl.viewport(0, 0, width, height);

      const start = Date.now();
      let last = 0;

      const render = () => {
        const now = Date.now();
        if (now - last >= FRAME_MS) {
          last = now;
          if (uTime) gl.uniform1f(uTime, (now - start) / 1000);
          if (uResolution) gl.uniform2f(uResolution, width, height);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
          gl.endFrameEXP();
        }
        frameRef.current = requestAnimationFrame(render);
      };
      render();
    } catch {
      setFailed(true);
    }
  }

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <GLView style={StyleSheet.absoluteFill} onContextCreate={onContextCreate} />
      {overlayOpacity > 0 && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg, opacity: overlayOpacity }]} />
      )}
    </View>
  );
}
