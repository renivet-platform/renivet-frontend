export const MIN_PASSPHRASE_LENGTH = 15;
export const MAX_PASSPHRASE_LENGTH = 128;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isAcceptedPassphrase(value: string): boolean {
  return value.length >= MIN_PASSPHRASE_LENGTH && value.length <= MAX_PASSPHRASE_LENGTH;
}

export function normalizeOtpEntry(value: string): string {
  return value.replace(/[^0-9]/g, "").slice(0, 6);
}
