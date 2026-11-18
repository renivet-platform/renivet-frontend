export type PrototypeWave = "W1" | "W2" | "W3 context" | "W3/W4";
export type ScreenIntegration = "connected" | "context-only" | "api-needed" | "content-needed";

export interface PrototypeScreen {
  id: string;
  name: string;
  route: string;
  wave: PrototypeWave;
  integration: ScreenIntegration;
}

/** Canonical route map for the approved 17 Nov handoff (40 screens / 168 states). */
export const ren2_117Screens: readonly PrototypeScreen[] = [
  { id: "CU-01", name: "New in", route: "/", wave: "W3 context", integration: "context-only" },
  { id: "CU-03", name: "Product", route: "/shop/products/[productId]", wave: "W3 context", integration: "context-only" },
  { id: "CU-05A", name: "Brands", route: "/shop/brands", wave: "W3 context", integration: "context-only" },
  { id: "CU-05B", name: "Brand", route: "/shop/brands/[slug]", wave: "W3 context", integration: "context-only" },
  { id: "CU-06", name: "Saved", route: "/shop/saved", wave: "W3 context", integration: "context-only" },
  { id: "CU-08", name: "Sign in", route: "/sign-in", wave: "W1", integration: "connected" },
  { id: "CU-09B", name: "Enter your code", route: "/sign-in?step=verify", wave: "W1", integration: "connected" },
  { id: "CU-09A", name: "Create account", route: "/register", wave: "W1", integration: "connected" },
  { id: "CU-09W", name: "Finish account", route: "/welcome", wave: "W1", integration: "connected" },
  { id: "CU-09C", name: "Reset password", route: "/recover", wave: "W1", integration: "connected" },
  { id: "CU-09D", name: "Choose new password", route: "/reset-password", wave: "W1", integration: "connected" },
  { id: "CU-09E", name: "Account and security", route: "/account", wave: "W1", integration: "connected" },
  { id: "CU-21A", name: "Privacy and communication", route: "/privacy", wave: "W1", integration: "api-needed" },
  { id: "CU-21B", name: "Data requests", route: "/privacy/requests", wave: "W1", integration: "api-needed" },
  { id: "CU-22", name: "Policy", route: "/legal/[policy]", wave: "W3/W4", integration: "content-needed" },
  { id: "AD-01", name: "Staff sign in", route: "/operations/sign-in", wave: "W1", integration: "connected" },
  { id: "SE-20A", name: "Your brands", route: "/brands", wave: "W1", integration: "connected" },
  { id: "SE-01", name: "Sell on Renivet", route: "/brands/join", wave: "W2", integration: "api-needed" },
  { id: "SE-02", name: "Brand application", route: "/brands/join/application", wave: "W2", integration: "api-needed" },
  { id: "SE-06", name: "Application status", route: "/brands/[brandId]/onboarding", wave: "W2", integration: "connected" },
  { id: "SE-07", name: "Brand home", route: "/brands/[brandId]/workspace", wave: "W2", integration: "connected" },
  { id: "SE-08", name: "Products", route: "/brands/[brandId]/products", wave: "W2", integration: "connected" },
  { id: "SE-09", name: "Edit product", route: "/brands/[brandId]/products/[productId]", wave: "W2", integration: "connected" },
  { id: "SE-12", name: "Imports", route: "/brands/[brandId]/imports", wave: "W2", integration: "connected" },
  { id: "SE-12A", name: "New import", route: "/brands/[brandId]/imports?step=mapping", wave: "W2", integration: "connected" },
  { id: "SE-12C", name: "Import results", route: "/brands/[brandId]/imports?step=results", wave: "W2", integration: "connected" },
  { id: "SE-13", name: "Inventory", route: "/brands/[brandId]/inventory", wave: "W2", integration: "connected" },
  { id: "SE-20C", name: "Team and access", route: "/brands/[brandId]/team", wave: "W1", integration: "connected" },
  { id: "SE-18", name: "Payout account", route: "/brands/[brandId]/payouts", wave: "W2", integration: "api-needed" },
  { id: "AD-02", name: "Operations home", route: "/operations", wave: "W2", integration: "connected" },
  { id: "AD-03", name: "Brand applications", route: "/brand-approvals", wave: "W2", integration: "connected" },
  { id: "AD-04", name: "Application review", route: "/brand-approvals/[brandId]", wave: "W2", integration: "api-needed" },
  { id: "AD-05", name: "Bank verification", route: "/operations/bank", wave: "W2", integration: "api-needed" },
  { id: "AD-08A", name: "Review queue", route: "/operations/[queue]", wave: "W2", integration: "connected" },
  { id: "AD-08B", name: "Review item", route: "/operations/[queue]/[id]", wave: "W2", integration: "connected" },
  { id: "AD-07", name: "Taxonomy", route: "/taxonomy", wave: "W2", integration: "connected" },
  { id: "AD-09", name: "Inventory exceptions", route: "/operations/exceptions", wave: "W2", integration: "api-needed" },
  { id: "AD-06", name: "Staff and access", route: "/operations/staff", wave: "W1", integration: "api-needed" },
  { id: "AD-20", name: "Audit log", route: "/operations/audit", wave: "W1", integration: "api-needed" },
  { id: "AD-19", name: "Privacy requests", route: "/operations/privacy", wave: "W1", integration: "api-needed" },
] as const;

export function prototypeScreenById(id: string): PrototypeScreen | undefined {
  return ren2_117Screens.find((screen) => screen.id === id);
}
