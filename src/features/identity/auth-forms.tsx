"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  AuthApiError,
  createPasswordSession,
  getCurrentSession,
  logoutCurrentSession,
  registerWithEmailAndPassword,
  requestEmailChallenge,
  verifyChallenge,
} from "./auth-api";
import { isAcceptedPassphrase, normalizeEmail, normalizeOtpEntry } from "./auth-policy";
import { AuthShell } from "./auth-shell";
import styles from "./auth.module.css";

function messageFor(error: unknown): string {
  if (!(error instanceof AuthApiError)) return "We could not complete this request. Please try again.";
  if (error.code === "AUTHENTICATION_FAILED") return "We couldn’t sign you in with those details.";
  if (error.code === "AUTH_RATE_LIMITED") return "Too many attempts. Please wait a little and try again.";
  if (error.code === "AUTH_INPUT_INVALID") return "Please check the information and try again.";
  if (error.status === 503) return "Authentication is temporarily unavailable. Please try again shortly.";
  return error.message;
}

function FormMessage({ error, status }: { error: string; status: string }) {
  if (error) return <p className={styles.errorBox} role="alert">{error}</p>;
  if (status) return <p className={styles.statusBox} role="status">{status}</p>;
  return null;
}

function PasswordField({ id, label, autoComplete, value, onChange }: {
  id: string; label: string; autoComplete: string; value: string; onChange: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  return <div className={styles.field}>
    <label className={styles.label} htmlFor={id}>{label}</label>
    <div className={styles.passwordRow}>
      <input className={styles.passwordInput} id={id} name={id} type={visible ? "text" : "password"}
        autoComplete={autoComplete} required minLength={15} maxLength={128} value={value}
        onChange={event => onChange(event.currentTarget.value)} aria-describedby={`${id}-hint`} />
      <button className={styles.togglePassword} type="button" aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
        aria-pressed={visible} onClick={() => setVisible(current => !current)}>{visible ? "Hide" : "Show"}</button>
    </div>
    <p id={`${id}-hint`} className={styles.hint}>Use 15–128 characters. Spaces are allowed.</p>
  </div>;
}

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    if (!isAcceptedPassphrase(password)) { setError("Password must be 15–128 characters."); return; }
    setBusy(true);
    try {
      await createPasswordSession({ email: normalizeEmail(email), password });
      setPassword(""); router.replace("/account"); router.refresh();
    } catch (cause) { setError(messageFor(cause)); }
    finally { setBusy(false); }
  }
  return <AuthShell eyebrow="Welcome back" title="Sign in to Renivet" description="Use your email and password to continue to your account.">
    <form className={styles.form} onSubmit={submit}>
      <FormMessage error={error} status="" />
      <div className={styles.field}><label className={styles.label} htmlFor="signin-email">Email address</label>
        <input className={styles.input} id="signin-email" name="email" type="email" autoComplete="username" inputMode="email"
          maxLength={254} required value={email} onChange={event => setEmail(event.currentTarget.value)} /></div>
      <PasswordField id="signin-password" label="Password" autoComplete="current-password" value={password} onChange={setPassword} />
      <div className={styles.formLinks}><Link className={styles.link} href="/recover">Forgot password?</Link>
        <Link className={styles.link} href="/register">Create account</Link></div>
      <button className={styles.primaryButton} type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
    </form>
  </AuthShell>;
}

export function RegisterForm() {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [challengeId, setChallengeId] = useState(""); const [code, setCode] = useState(""); const [verified, setVerified] = useState(false);
  const [error, setError] = useState(""); const [status, setStatus] = useState(""); const [busy, setBusy] = useState(false);
  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setStatus("");
    if (!isAcceptedPassphrase(password)) { setError("Password must be 15–128 characters."); return; }
    setBusy(true);
    try {
      const canonicalEmail = normalizeEmail(email);
      await registerWithEmailAndPassword({ email: canonicalEmail, password });
      setPassword("");
      const challenge = await requestEmailChallenge({ channel: "email", purpose: "email_verification", destination: canonicalEmail });
      setChallengeId(challenge.challengeId); setStatus("If this email can be registered, a verification code will be sent. Enter it below to verify your address.");
    } catch (cause) { setError(messageFor(cause)); }
    finally { setBusy(false); }
  }
  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setStatus("");
    if (!/^\d{6}$/.test(code)) { setError("Enter the six-digit code."); return; }
    setBusy(true);
    try {
      await verifyChallenge(challengeId, { purpose: "email_verification", code });
      setCode(""); setChallengeId(""); setVerified(true); setStatus("");
    } catch (cause) { setError(messageFor(cause)); }
    finally { setBusy(false); }
  }
  return <AuthShell eyebrow="Join Renivet" title="Create your account" description="Start with an email address and a password. We’ll ask you to verify your email.">
    {verified ? <div className={styles.form}><p className={styles.successBox} role="status">Your email is verified. You can now sign in.</p><Link className={styles.primaryButton} href="/sign-in">Go to sign in</Link></div>
      : !challengeId ? <form className={styles.form} onSubmit={register}>
      <FormMessage error={error} status={status} />
      <div className={styles.field}><label className={styles.label} htmlFor="register-email">Email address</label>
        <input className={styles.input} id="register-email" name="email" type="email" autoComplete="email" inputMode="email" maxLength={254}
          required value={email} onChange={event => setEmail(event.currentTarget.value)} /></div>
      <PasswordField id="register-password" label="Create password" autoComplete="new-password" value={password} onChange={setPassword} />
      <p className={styles.hint}>Your email is treated the same whether it is new or already registered.</p>
      <button className={styles.primaryButton} type="submit" disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
      <p className={styles.hint}>Already have an account? <Link className={styles.link} href="/sign-in">Sign in</Link></p>
    </form> : <form className={styles.form} onSubmit={verify}>
      <FormMessage error={error} status={status} />
      <p className={styles.statusBox}>Verification code for <strong>{normalizeEmail(email)}</strong></p>
      <div className={styles.field}><label className={styles.label} htmlFor="register-code">Six-digit verification code</label>
        <input className={styles.input} id="register-code" name="one-time-code" type="text" inputMode="numeric" autoComplete="one-time-code"
          pattern="[0-9]{6}" maxLength={6} required value={code} onChange={event => setCode(normalizeOtpEntry(event.currentTarget.value))} /></div>
      <button className={styles.primaryButton} type="submit" disabled={busy}>{busy ? "Verifying…" : "Verify email"}</button>
      <button className={styles.secondaryButton} type="button" disabled={busy} onClick={() => { setChallengeId(""); setCode(""); setError(""); setStatus(""); }}>Start again</button>
    </form>}
  </AuthShell>;
}

export function RecoveryForm() {
  const [email, setEmail] = useState(""); const [challengeId, setChallengeId] = useState(""); const [resetDone, setResetDone] = useState(false);
  const [code, setCode] = useState(""); const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState(""); const [status, setStatus] = useState(""); const [busy, setBusy] = useState(false);
  async function request(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setStatus(""); setBusy(true);
    try {
      const result = await requestEmailChallenge({ channel: "email", purpose: "password_recovery", destination: normalizeEmail(email) });
      setChallengeId(result.challengeId); setStatus("If the address is eligible, a recovery code will be sent.");
    } catch (cause) { setError(messageFor(cause)); }
    finally { setBusy(false); }
  }
  async function reset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setStatus("");
    if (!/^\d{6}$/.test(code)) { setError("Enter the six-digit code."); return; }
    if (!isAcceptedPassphrase(newPassword)) { setError("Password must be 15–128 characters."); return; }
    setBusy(true);
    try {
      await verifyChallenge(challengeId, { purpose: "password_recovery", code, newPassword });
      setChallengeId(""); setCode(""); setNewPassword(""); setResetDone(true);
    } catch (cause) { setError(messageFor(cause)); }
    finally { setBusy(false); }
  }
  return <AuthShell eyebrow="Account recovery" title="Reset your password" description="Request a one-time code using the email on your account.">
    {resetDone ? <div className={styles.form}><p className={styles.successBox} role="status">If the code was valid, your password has been reset.</p><Link className={styles.primaryButton} href="/sign-in">Sign in with your new password</Link></div>
      : !challengeId ? <form className={styles.form} onSubmit={request}>
      <FormMessage error={error} status={status} />
      <div className={styles.field}><label className={styles.label} htmlFor="recovery-email">Email address</label>
        <input className={styles.input} id="recovery-email" name="email" type="email" autoComplete="email" inputMode="email" maxLength={254}
          required value={email} onChange={event => setEmail(event.currentTarget.value)} /></div>
      <button className={styles.primaryButton} type="submit" disabled={busy}>{busy ? "Requesting code…" : "Send recovery code"}</button>
      <Link className={styles.link} href="/sign-in">Back to sign in</Link>
    </form> : <form className={styles.form} onSubmit={reset}>
      <FormMessage error={error} status={status} />
      <div className={styles.field}><label className={styles.label} htmlFor="recovery-code">Six-digit recovery code</label>
        <input className={styles.input} id="recovery-code" name="one-time-code" type="text" inputMode="numeric" autoComplete="one-time-code"
          pattern="[0-9]{6}" maxLength={6} required value={code} onChange={event => setCode(normalizeOtpEntry(event.currentTarget.value))} /></div>
      <PasswordField id="recovery-password" label="New password" autoComplete="new-password" value={newPassword} onChange={setNewPassword} />
      <button className={styles.primaryButton} type="submit" disabled={busy}>{busy ? "Resetting password…" : "Reset password"}</button>
      <button className={styles.secondaryButton} type="button" disabled={busy} onClick={() => { setChallengeId(""); setCode(""); setError(""); setStatus(""); }}>Request another code</button>
    </form>}
  </AuthShell>;
}

export function AccountSession() {
  const router = useRouter();
  const [state, setState] = useState<"loading" | "ready" | "expired" | "error">("loading");
  const [csrf, setCsrf] = useState(""); const [error, setError] = useState("");
  async function inspect() {
    setState("loading"); setError("");
    try { const session = await getCurrentSession(); setCsrf(session.csrfToken); setState("ready"); }
    catch (cause) {
      if (cause instanceof AuthApiError && cause.status === 401) setState("expired");
      else { setError(messageFor(cause)); setState("error"); }
    }
  }
  // Load on mount without placing session data in browser storage or URLs.
  useEffect(() => { void inspect(); }, []);
  async function signOut() {
    setError(""); setState("loading");
    try { await logoutCurrentSession(csrf); setCsrf(""); router.replace("/sign-in"); router.refresh(); }
    catch (cause) { setError(messageFor(cause)); setState("error"); }
  }
  return <AuthShell eyebrow="Your account" title="Account session" description="This page is shown only after the backend confirms your session.">
    {state === "loading" && <p className={styles.loading} role="status">Checking your session…</p>}
    {state === "ready" && <div className={styles.form}><p className={styles.successBox}>You are signed in.</p>
      {error && <FormMessage error={error} status="" />}<button className={styles.primaryButton} type="button" onClick={signOut}>Sign out</button></div>}
    {state === "expired" && <div className={styles.form}><p className={styles.statusBox}>Your session has expired. Sign in to continue.</p><Link className={styles.primaryButton} href="/sign-in">Go to sign in</Link></div>}
    {state === "error" && <div className={styles.form}><FormMessage error={error} status=""/><button className={styles.secondaryButton} type="button" onClick={() => void inspect()}>Try again</button></div>}
  </AuthShell>;
}
