export const AUTH_THEME = {
  page: "#f6f4ef",
  surface: "#ffffff",
  ink: "#1b2420",
  muted: "#5d6963",
  primary: "#1f5a45",
  primaryText: "#ffffff",
  border: "#79817c",
  focus: "#1d4f86",
  error: "#a3261b",
  success: "#1d653a",
  soft: "#e4eee8",
} as const;

function channel(hex: string, offset: number): number {
  const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(color: string): number {
  const hex = color.replace(/^#/, "");
  if (!/^[0-9a-f]{6}$/i.test(hex)) throw new Error("Colors must be six-digit hex values.");
  return 0.2126 * channel(hex, 0) + 0.7152 * channel(hex, 2) + 0.0722 * channel(hex, 4);
}

export function contrastRatio(foreground: string, background: string): number {
  const first = luminance(foreground);
  const second = luminance(background);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}
