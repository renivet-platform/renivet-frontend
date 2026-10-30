export const AUTH_THEME = {
  page: "#f4f6f1",
  surface: "#ffffff",
  ink: "#031400",
  muted: "#45564e",
  primary: "#17483b",
  primaryText: "#ffffff",
  border: "#aab7ae",
  focus: "#0b6b53",
  error: "#9a211c",
  success: "#17643c",
  soft: "#e8eee7",
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
