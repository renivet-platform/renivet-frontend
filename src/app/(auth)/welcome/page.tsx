import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/features/identity/auth-shell";
import styles from "@/features/identity/auth.module.css";

export const metadata: Metadata = { title: "Continue to Renivet | Renivet" };
export default function WelcomePage() {
  return <AuthShell screenId="CU-09W" eyebrow="Your Renivet account" title="You’re in the right place" description="Continue with the account you verified, or return to sign in if you have not finished setup.">
    <div className={styles.form}><Link className={styles.primaryButton} href="/account">Continue to account &amp; security</Link><Link className={styles.link} href="/sign-in">Back to sign in</Link></div>
  </AuthShell>;
}
