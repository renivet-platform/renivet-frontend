export type MfaEnforcementMode = "enforced" | "deferred";

/** MFA step-up is deferred by default until the platform explicitly re-enables it. */
export function normalizeMfaEnforcementMode(value: unknown): MfaEnforcementMode {
  return value === "enforced" ? "enforced" : "deferred";
}

export function shouldRequestMfaStepUp(mode: MfaEnforcementMode): boolean {
  return mode === "enforced";
}
