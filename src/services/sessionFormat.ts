/**
 * Session clock formatting, shared by the live timer, the summary and the
 * history list so a duration never renders three different ways.
 *
 * Under an hour it reads as mm:ss (a 47-minute session is "47:12", not
 * "0:47:12"); an hour or more promotes to h:mm:ss.
 */
export function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/** Compact form for list rows, where seconds are noise: "1s 12dk" / "47dk". */
export function formatDurationShort(totalSeconds: number, hourLabel: string, minuteLabel: string): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.round((safe % 3600) / 60);

  if (hours > 0) return `${hours}${hourLabel} ${minutes}${minuteLabel}`;
  return `${minutes}${minuteLabel}`;
}
