export const MIN_PASSPHRASE_LENGTH = 8;
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

export function normalizePhoneNumber(value: string): string | null {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");
  const nationalNumber = trimmed.startsWith("+")
    ? digits.startsWith("91") ? digits.slice(2) : ""
    : digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
  return /^[6-9][0-9]{9}$/.test(nationalNumber) ? `+91${nationalNumber}` : null;
}
