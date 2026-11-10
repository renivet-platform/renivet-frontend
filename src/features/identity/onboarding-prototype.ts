export type PrototypeState = "ready" | "recoverable-error" | "expired" | "denied" | "empty";

export interface PrototypeScreen {
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
  states: PrototypeState[];
  securityNote: string;
  approval: "proposed";
}

const screens: PrototypeScreen[] = [
  {
    sourceId: "CU-08",
    title: "Sign in",
    audience: "customer",
    stage: "Account access",
    eyebrow: "A familiar place to return",
    heading: "Welcome back.",
    description: "Sign in to continue to your Renivet account.",
    fields: [
      { label: "Email address", placeholder: "you@example.com", type: "email" },
      { label: "Password", placeholder: "Enter your password", type: "password" },
    ],
    primaryAction: "Continue",
    secondaryAction: "Create an account",
    states: ["ready", "recoverable-error"],
    securityNote: "Sign-in is confirmed by Renivet. This preview never sends credentials.",
    approval: "proposed",
  },
  {
    sourceId: "CU-09",
    title: "Create account",
    audience: "customer",
    stage: "Create your account",
    eyebrow: "Start with the essentials",
    heading: "Make it yours.",
    description: "Create an account with an email address you can verify.",
    fields: [
      { label: "Email address", placeholder: "you@example.com", type: "email" },
      { label: "Create a password", placeholder: "15 characters or more", type: "password" },
    ],
    primaryAction: "Create account",
    secondaryAction: "I already have an account",
    states: ["ready", "recoverable-error"],
    securityNote: "Verification and account creation require a real backend response.",
    approval: "proposed",
  },
  {
    sourceId: "CU-09",
    title: "Verify or recover",
    audience: "customer",
    stage: "Code challenge",
    eyebrow: "One secure step at a time",
    heading: "Check your inbox.",
    description: "Enter the six-digit code sent to the address you provided.",
    fields: [
      { label: "Six-digit code", placeholder: "000000", type: "text" },
    ],
    primaryAction: "Verify code",
    secondaryAction: "Request another code",
    states: ["ready", "recoverable-error", "expired"],
    securityNote: "Code expiry and resend availability come from the server; this preview uses no timer.",
    approval: "proposed",
  },
  {
    sourceId: "SE-20",
    title: "Brand access",
    audience: "seller",
    stage: "Membership check",
    eyebrow: "Your work, in the right hands",
    heading: "Check your access.",
    description: "Renivet confirms your brand access before showing seller information.",
    fields: [],
    primaryAction: "Return to account",
    secondaryAction: "Get help with access",
    states: ["ready", "empty", "denied", "expired"],
    securityNote: "Preview only: only the backend can confirm current membership. No brand name or seller data is shown here.",
    approval: "proposed",
  },
  {
    sourceId: "AD-01",
    title: "Admin sign-in",
    audience: "admin",
    stage: "Privileged access",
    eyebrow: "Restricted workspace",
    heading: "Verify your identity.",
    description: "A second verification step is required before a privileged area can open.",
    fields: [
      { label: "Verification code", placeholder: "Enter your code", type: "text" },
    ],
    primaryAction: "Verify identity",
    secondaryAction: "Use an approved recovery option",
    states: ["ready", "recoverable-error", "denied", "expired"],
    securityNote: "Preview only: the backend verifies the session, role and step-up requirement. No admin actions are available here.",
    approval: "proposed",
  },
  {
    sourceId: "AD-06",
    title: "Team permissions",
    audience: "admin",
    stage: "Access review",
    eyebrow: "Clear roles. Accountable changes.",
    heading: "Review access safely.",
    description: "A permitted reviewer sees only the access details their role allows.",
    fields: [],
    primaryAction: "Return to secure sign-in",
    secondaryAction: "View access guidance",
    states: ["ready", "empty", "denied", "expired"],
    securityNote: "Preview only: the backend controls role, scope and audit. No staff records or permissions are represented here.",
    approval: "proposed",
  },
];

export function getOnboardingPrototypeScreens(): PrototypeScreen[] {
  return screens.map(screen => ({ ...screen, fields: [...screen.fields], states: [...screen.states] }));
}

export function getPrototypeStateCopy(state: PrototypeState): { label: string; message: string } {
  switch (state) {
    case "ready":
      return { label: "Ready", message: "This is a proposed starting state. No information will be submitted." };
    case "recoverable-error":
      return { label: "Could not continue", message: "We could not complete that step. Check your details or try again." };
    case "expired":
      return { label: "Session or code expired", message: "This step has expired. Return to sign in or request a new step when available." };
    case "denied":
      return { label: "Access not available", message: "This account does not currently have access to this area." };
    case "empty":
      return { label: "No active access", message: "There is no active access to show. Contact your organization administrator for next steps." };
  }
}
