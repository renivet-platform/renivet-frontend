export type PrototypeState =
  | "ready"
  | "validation-error"
  | "loading"
  | "recoverable-error"
  | "denied"
  | "expired"
  | "service-unavailable"
  | "success-preview"
  | "invalid-code"
  | "already-used"
  | "rate-limited"
  | "empty"
  | "suspended"
  | "audit-unavailable";

export type PrototypeScreenId =
  | "sign-in"
  | "register"
  | "email-verification"
  | "recover"
  | "recovery-code"
  | "account-session"
  | "session-expired"
  | "admin-mfa"
  | "seller-access"
  | "team-permissions";

export interface PrototypeScreen {
  id: PrototypeScreenId;
  sourceId: "CU-08" | "CU-09" | "SE-20" | "AD-01" | "AD-06";
  title: string;
  audience: "customer" | "seller" | "admin";
  stage: string;
  eyebrow: string;
  heading: string;
  description: string;
  fields: Array<{ label: string; placeholder: string; type: "email" | "password" | "text" }>;
  primaryAction: string;
  secondaryAction?: string;
  nextStepId?: PrototypeScreenId;
  alternateStepId?: PrototypeScreenId;
  states: PrototypeState[];
  securityNote: string;
  approval: "proposed";
}

const screens: PrototypeScreen[] = [
  {
    id: "sign-in", sourceId: "CU-08", title: "Sign in", audience: "customer", stage: "Account access",
    eyebrow: "A familiar place to return", heading: "Welcome back.",
    description: "Sign in to continue to your Renivet account.",
    fields: [{ label: "Email address", placeholder: "you@example.com", type: "email" }, { label: "Password", placeholder: "Enter your password", type: "password" }],
    primaryAction: "Continue", secondaryAction: "Forgot password?", nextStepId: "account-session", alternateStepId: "recover",
    states: ["ready", "validation-error", "loading", "recoverable-error", "denied", "expired", "service-unavailable"],
    securityNote: "Sign-in is confirmed by Renivet. This preview never sends credentials.", approval: "proposed",
  },
  {
    id: "register", sourceId: "CU-09", title: "Create account", audience: "customer", stage: "Create your account",
    eyebrow: "Start with the essentials", heading: "Make it yours.",
    description: "Create an account with an email address you can verify.",
    fields: [{ label: "Email address", placeholder: "you@example.com", type: "email" }, { label: "Create a password", placeholder: "15 characters or more", type: "password" }],
    primaryAction: "Create account", secondaryAction: "I already have an account", nextStepId: "email-verification", alternateStepId: "sign-in",
    states: ["ready", "validation-error", "loading", "recoverable-error", "success-preview", "service-unavailable"],
    securityNote: "Verification and account creation require a real backend response.", approval: "proposed",
  },
  {
    id: "email-verification", sourceId: "CU-09", title: "Verify email", audience: "customer", stage: "Code challenge",
    eyebrow: "One secure step at a time", heading: "Check your inbox.",
    description: "Enter the six-digit code provided for the address you registered.",
    fields: [{ label: "Six-digit code", placeholder: "000000", type: "text" }],
    primaryAction: "Verify code", secondaryAction: "Return to sign in", nextStepId: "account-session", alternateStepId: "sign-in",
    states: ["ready", "validation-error", "loading", "invalid-code", "expired", "already-used", "rate-limited", "service-unavailable", "success-preview"],
    securityNote: "Code expiry and resend availability come from the server; this preview uses no timer.", approval: "proposed",
  },
  {
    id: "recover", sourceId: "CU-09", title: "Recover account", audience: "customer", stage: "Account recovery",
    eyebrow: "A safe way back in", heading: "Let’s get you back.",
    description: "Request an account recovery step using your email address.",
    fields: [{ label: "Email address", placeholder: "you@example.com", type: "email" }],
    primaryAction: "Continue preview", secondaryAction: "Return to sign in", nextStepId: "recovery-code", alternateStepId: "sign-in",
    states: ["ready", "validation-error", "loading", "recoverable-error", "success-preview", "service-unavailable"],
    securityNote: "Recovery responses should not reveal whether an email address has an account.", approval: "proposed",
  },
  {
    id: "recovery-code", sourceId: "CU-09", title: "Recovery code", audience: "customer", stage: "Recovery challenge",
    eyebrow: "Keep your account yours", heading: "Enter your recovery code.",
    description: "Use the code from the recovery message to continue.",
    fields: [{ label: "Recovery code", placeholder: "Enter your code", type: "text" }],
    primaryAction: "Continue preview", secondaryAction: "Back to recovery options", nextStepId: "sign-in", alternateStepId: "recover",
    states: ["ready", "validation-error", "loading", "invalid-code", "expired", "rate-limited", "service-unavailable", "success-preview"],
    securityNote: "Recovery code checks and password changes require a real backend response.", approval: "proposed",
  },
  {
    id: "account-session", sourceId: "CU-08", title: "Account session", audience: "customer", stage: "Signed-in destination",
    eyebrow: "Your account, in one place", heading: "You’re ready to continue.",
    description: "This screen previews the destination after the service confirms sign-in.", fields: [],
    primaryAction: "Preview next screen", secondaryAction: "Return to sign in", nextStepId: "session-expired", alternateStepId: "sign-in",
    states: ["loading", "success-preview", "expired", "recoverable-error"],
    securityNote: "Preview only: no session was created and no account data is shown.", approval: "proposed",
  },
  {
    id: "session-expired", sourceId: "CU-09", title: "Session expired", audience: "customer", stage: "Session recovery",
    eyebrow: "Your security comes first", heading: "Please sign in again.",
    description: "A real session can expire and require a fresh sign-in.", fields: [],
    primaryAction: "Preview next screen", nextStepId: "sign-in",
    states: ["expired", "loading", "recoverable-error"],
    securityNote: "The backend determines session validity; this preview stores no session.", approval: "proposed",
  },
  {
    id: "admin-mfa", sourceId: "AD-01", title: "Admin verification", audience: "admin", stage: "Privileged access",
    eyebrow: "Restricted workspace", heading: "Verify your identity.",
    description: "A second verification step is required before a privileged area can open.",
    fields: [{ label: "Verification code", placeholder: "Enter your code", type: "text" }],
    primaryAction: "Preview next screen", secondaryAction: "Use an approved recovery option", nextStepId: "team-permissions",
    states: ["ready", "validation-error", "loading", "invalid-code", "expired", "rate-limited", "denied", "service-unavailable"],
    securityNote: "Preview only: the backend verifies the session, role and step-up requirement. No admin actions are available here.", approval: "proposed",
  },
  {
    id: "seller-access", sourceId: "SE-20", title: "Brand access", audience: "seller", stage: "Membership check",
    eyebrow: "Your work, in the right hands", heading: "Check your access.",
    description: "Renivet confirms your brand access before showing seller information.", fields: [],
    primaryAction: "Preview next screen", nextStepId: "sign-in",
    states: ["ready", "loading", "success-preview", "empty", "denied", "suspended", "expired", "service-unavailable"],
    securityNote: "Preview only: only the backend can confirm current membership. No brand name or seller data is shown here.", approval: "proposed",
  },
  {
    id: "team-permissions", sourceId: "AD-06", title: "Team permissions", audience: "admin", stage: "Access review",
    eyebrow: "Clear roles. Accountable changes.", heading: "Review access safely.",
    description: "A permitted reviewer sees only the access details their role allows.", fields: [],
    primaryAction: "Preview next screen", nextStepId: "admin-mfa",
    states: ["ready", "loading", "success-preview", "empty", "denied", "expired", "audit-unavailable", "service-unavailable"],
    securityNote: "Preview only: the backend controls role, scope and audit. No staff records or permissions are represented here.", approval: "proposed",
  },
];

export function getOnboardingPrototypeScreens(): PrototypeScreen[] {
  return screens.map(screen => ({ ...screen, fields: [...screen.fields], states: [...screen.states] }));
}

export function getPrototypeStateCopy(state: PrototypeState): { label: string; message: string } {
  const copy: Record<PrototypeState, { label: string; message: string }> = {
    ready: { label: "Ready", message: "This is a proposed starting state. No information will be submitted." },
    "validation-error": { label: "Check required details", message: "Review the highlighted information and try again." },
    loading: { label: "Working", message: "A real service would process this step. This preview makes no request." },
    "recoverable-error": { label: "Could not continue", message: "We could not complete that step. Check your details or try again." },
    denied: { label: "Access not available", message: "This account does not currently have access to this area." },
    expired: { label: "Session or code expired", message: "This step has expired. Return to sign in or request a new step when available." },
    "service-unavailable": { label: "Service unavailable", message: "This service is temporarily unavailable. Try again later." },
    "success-preview": { label: "Success state preview", message: "Illustration only: no request, code, session or permission was sent, verified, created or changed." },
    "invalid-code": { label: "Code not accepted", message: "That code could not be accepted. Check it and try again." },
    "already-used": { label: "Code already used", message: "This code has already been used. Request a new step if the service allows it." },
    "rate-limited": { label: "Please wait before trying again", message: "Too many attempts were made. Try again later." },
    empty: { label: "No active access", message: "There is no active access to show. Contact your organization administrator for next steps." },
    suspended: { label: "Access temporarily unavailable", message: "Access is temporarily unavailable. Contact your organization administrator." },
    "audit-unavailable": { label: "Review history unavailable", message: "The audit service could not provide review history. Try again later." },
  };
  return copy[state];
}
