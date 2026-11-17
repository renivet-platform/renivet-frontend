export type MfaEnforcementMode = "enforced" | "deferred";

/** Unknown or absent server policy must preserve the existing enforced UX. */
export function normalizeMfaEnforcementMode(value: unknown): MfaEnforcementMode {
  return value === "deferred" ? "deferred" : "enforced";
}

export function shouldRequestMfaStepUp(mode: MfaEnforcementMode): boolean {
  return mode === "enforced";
}
