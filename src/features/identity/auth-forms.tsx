"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import {
  AuthApiError,
  createPasswordSession,
  getCurrentSession,
  logoutCurrentSession,
  registerWithEmailAndPassword,
  requestEmailChallenge,
  requestPhoneChallenge,
  requestPhoneRegistrationChallenge,
  requestPhoneLoginChallenge,
  setPhoneForVerification,
  verifyChallenge,
  verifyPhoneChallenge,
  verifyPhoneLogin,
  verifyPhoneRegistration,
} from "./auth-api";
import type { CurrentSession } from "./auth-api";
import { isAcceptedPassphrase, MAX_PASSPHRASE_LENGTH, MIN_PASSPHRASE_LENGTH, normalizeEmail, normalizeOtpEntry, normalizePhoneNumber } from "./auth-policy";
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

function FormMessage({ error, status, id }: { error: string; status: string; id?: string }) {
  if (error) return <p id={id} className={styles.errorBox} role="alert">{error}</p>;
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
        autoComplete={autoComplete} required minLength={MIN_PASSPHRASE_LENGTH} maxLength={MAX_PASSPHRASE_LENGTH} value={value}
        onChange={event => onChange(event.currentTarget.value)} aria-describedby={`${id}-hint`} />
      <button className={styles.togglePassword} type="button" aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
        aria-pressed={visible} onClick={() => setVisible(current => !current)}>{visible ? "Hide" : "Show"}</button>
    </div>
    <p id={`${id}-hint`} className={styles.hint}>Use 8–128 characters. Spaces are allowed.</p>
  </div>;
}

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [phone, setPhone] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const codeInput = useRef<HTMLInputElement>(null);
  useEffect(() => { if (challengeId) codeInput.current?.focus(); }, [challengeId]);
  async function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    if (!isAcceptedPassphrase(password)) { setError("Password must be 8–128 characters."); return; }
    setBusy(true);
    try {
      await createPasswordSession({ email: normalizeEmail(email), password });
      setPassword(""); router.replace("/account"); router.refresh();
    } catch (cause) { setError(messageFor(cause)); }
    finally { setBusy(false); }
  }
  async function requestPhoneCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setStatus("");
    const normalizedPhone = normalizePhoneNumber(phone);
    if (!normalizedPhone) { setError("Enter a valid Indian mobile number."); return; }
    setBusy(true);
    try {
      const challenge = await requestPhoneLoginChallenge(normalizedPhone);
      setPhone(normalizedPhone); setChallengeId(challenge.challengeId);
      setStatus("If this verified number can sign in, a one-time code will be sent.");
    } catch (cause) { setError(messageFor(cause)); }
    finally { setBusy(false); }
  }
  async function verifyPhoneCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setStatus("");
    if (!/^\d{6}$/.test(code)) { setError("Enter the six-digit code."); return; }
    setBusy(true);
    try {
      await verifyPhoneLogin(challengeId, code);
      setCode(""); router.replace("/account"); router.refresh();
    } catch (cause) { setError(messageFor(cause)); }
    finally { setBusy(false); }
  }
  return <AuthShell eyebrow="Welcome back" title="Sign in to Renivet" description="Continue with your email and password or a code sent to your verified phone number.">
    <div className={styles.form}>
      <div role="group" aria-label="Sign-in method" className={styles.formLinks}>
        <button className={styles.secondaryButton} type="button" aria-pressed={method === "email"} onClick={() => { setMethod("email"); setChallengeId(""); setError(""); setStatus(""); }}>Email and password</button>
        <button className={styles.secondaryButton} type="button" aria-pressed={method === "phone"} onClick={() => { setMethod("phone"); setChallengeId(""); setError(""); setStatus(""); }}>Phone number</button>
      </div>
      {method === "email" ? <form className={styles.form} onSubmit={submitEmail}>
        <FormMessage error={error} status={status} />
        <div className={styles.field}><label className={styles.label} htmlFor="signin-email">Email address</label>
          <input className={styles.input} id="signin-email" name="email" type="email" autoComplete="username" inputMode="email" maxLength={254} required value={email} onChange={event => setEmail(event.currentTarget.value)} /></div>
        <PasswordField id="signin-password" label="Password" autoComplete="current-password" value={password} onChange={setPassword} />
        <div className={styles.formLinks}><Link className={styles.link} href="/recover">Forgot password?</Link><Link className={styles.link} href="/register">Create account</Link></div>
        <button className={styles.primaryButton} type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      </form> : !challengeId ? <form className={styles.form} onSubmit={requestPhoneCode}>
        <FormMessage error={error} status={status} />
        <div className={styles.field}><label className={styles.label} htmlFor="signin-phone">Phone number</label>
          <input className={styles.input} id="signin-phone" name="tel" type="tel" autoComplete="tel" inputMode="tel" maxLength={20} required value={phone} aria-describedby="signin-phone-hint" onChange={event => setPhone(event.currentTarget.value)} />
          <p id="signin-phone-hint" className={styles.hint}>Use the verified Indian mobile number on your account.</p></div>
        <button className={styles.primaryButton} type="submit" disabled={busy}>{busy ? "Sending code…" : "Send sign-in code"}</button>
        <p className={styles.hint}>New to Renivet? <Link className={styles.link} href="/register">Create an account</Link></p>
      </form> : <form className={styles.form} onSubmit={verifyPhoneCode}>
        <FormMessage error={error} status={status} />
        <p className={styles.statusBox} role="status">Enter the six-digit code sent to your verified phone.</p>
        <div className={styles.field}><label className={styles.label} htmlFor="signin-phone-code">Six-digit sign-in code</label>
          <input ref={codeInput} className={styles.input} id="signin-phone-code" name="one-time-code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={event => setCode(normalizeOtpEntry(event.currentTarget.value))} />
          <p className={styles.hint}>The code expires in five minutes. Never share it.</p></div>
        <button className={styles.primaryButton} type="submit" disabled={busy}>{busy ? "Signing in…" : "Verify code and sign in"}</button>
        <button className={styles.secondaryButton} type="button" disabled={busy} onClick={() => { setChallengeId(""); setCode(""); setError(""); setStatus(""); }}>Use a different number</button>
      </form>}
    </div>
  </AuthShell>;
}

export function RegisterForm() {
  const router = useRouter();
  const [method, setMethod] = useState<"phone" | "email">("phone");
  const [phone, setPhone] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [challengeId, setChallengeId] = useState(""); const [code, setCode] = useState(""); const [verified, setVerified] = useState(false);
  const [error, setError] = useState(""); const [status, setStatus] = useState(""); const [busy, setBusy] = useState(false);
  const codeInput = useRef<HTMLInputElement>(null);
  const successLink = useRef<HTMLAnchorElement>(null);
  useEffect(() => { if (challengeId) codeInput.current?.focus(); }, [challengeId]);
  useEffect(() => { if (verified) successLink.current?.focus(); }, [verified]);

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setStatus("");
    if (method === "email" && !isAcceptedPassphrase(password)) { setError("Password must be 8–128 characters."); return; }
    setBusy(true);
    try {
      if (method === "phone") {
        const normalized = normalizePhoneNumber(phone);
        if (!normalized) { setError("Enter a valid Indian mobile number."); return; }
        const challenge = await requestPhoneRegistrationChallenge(normalized);
        setPhone(normalized); setChallengeId(challenge.challengeId);
        setStatus("If this number can be registered, we’ll send a one-time code. Your account is activated after verification.");
      } else {
        const canonicalEmail = normalizeEmail(email);
        await registerWithEmailAndPassword({ email: canonicalEmail, password });
        setPassword("");
        const challenge = await requestEmailChallenge({ channel: "email", purpose: "email_verification", destination: canonicalEmail });
        setChallengeId(challenge.challengeId); setStatus("If this email can be registered, a verification code will be sent. Enter it below to verify your address.");
      }
    } catch (cause) { setError(messageFor(cause)); }
    finally { setBusy(false); }
  }

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setStatus("");
    if (!/^\d{6}$/.test(code)) { setError("Enter the six-digit code."); return; }
    setBusy(true);
    try {
      if (method === "phone") {
        await verifyPhoneRegistration(challengeId, code);
        setCode(""); router.replace("/account"); router.refresh();
      } else {
        await verifyChallenge(challengeId, { purpose: "email_verification", code });
        setCode(""); setChallengeId(""); setVerified(true);
      }
    } catch (cause) { setError(messageFor(cause)); }
    finally { setBusy(false); }
  }

  async function resend() {
    setError(""); setStatus(""); setBusy(true);
    try {
      const challenge = method === "phone"
        ? await requestPhoneRegistrationChallenge(normalizePhoneNumber(phone) ?? phone)
        : await requestEmailChallenge({ channel: "email", purpose: "email_verification", destination: normalizeEmail(email) });
      setCode(""); setChallengeId(challenge.challengeId);
      setStatus(method === "phone" ? "If this number can be registered, a new code will be sent." : "If this email can be registered, a new verification code will be sent.");
    } catch (cause) { setError(messageFor(cause)); }
    finally { setBusy(false); }
  }

  return <AuthShell eyebrow="Join Renivet" title="Create your account" description={method === "phone" ? "Use your phone number and a one-time SMS code. No password is needed." : "Start with an email address and a password. We’ll ask you to verify your email."}>
    {verified ? <div className={styles.form}><p className={styles.successBox} role="status" tabIndex={-1}>Your email is verified. You can now sign in.</p><Link ref={successLink} className={styles.primaryButton} href="/sign-in">Go to sign in</Link></div>
      : <>
      <div role="group" aria-label="Registration method" className={styles.methodSelector}>
        <button className={styles.secondaryButton} type="button" aria-pressed={method === "phone"} onClick={() => { setMethod("phone"); setChallengeId(""); setCode(""); setError(""); setStatus(""); }}>Phone number</button>
        <button className={styles.secondaryButton} type="button" aria-pressed={method === "email"} onClick={() => { setMethod("email"); setChallengeId(""); setCode(""); setError(""); setStatus(""); }}>Email and password</button>
      </div>
      {!challengeId ? <form className={styles.form} onSubmit={register}>
        <FormMessage id="register-form-error" error={error} status={status} />
        {method === "phone" ? <div className={styles.field}><label className={styles.label} htmlFor="register-phone">Phone number</label>
          <input className={styles.input} id="register-phone" name="tel" type="tel" autoComplete="tel" inputMode="tel" maxLength={20}
            required value={phone} aria-invalid={error ? true : undefined} aria-describedby={error ? "register-form-error" : "register-phone-hint"} onChange={event => { setPhone(event.currentTarget.value); setError(""); }} />
          <p className={styles.hint} id="register-phone-hint">We’ll text a code to verify this number before activating your account.</p></div> : <>
          <div className={styles.field}><label className={styles.label} htmlFor="register-email">Email address</label>
            <input className={styles.input} id="register-email" name="email" type="email" autoComplete="email" inputMode="email" maxLength={254}
              required value={email} aria-invalid={error ? true : undefined} aria-describedby={error ? "register-form-error" : "register-email-hint"} onChange={event => { setEmail(event.currentTarget.value); setError(""); }} />
            <p className={styles.hint} id="register-email-hint">We use your email to verify and protect your account.</p></div>
          <PasswordField id="register-password" label="Create password" autoComplete="new-password" value={password} onChange={setPassword} />
          <p className={styles.hint}>We won’t reveal whether an email address already has an account.</p>
        </>}
        <button className={styles.primaryButton} type="submit" disabled={busy}>{busy ? "Sending code…" : method === "phone" ? "Continue with phone" : "Create account"}</button>
        <p className={styles.hint}>Already have an account? <Link className={styles.link} href="/sign-in">Sign in</Link></p>
      </form> : <form className={styles.form} onSubmit={verify}>
        <FormMessage id="register-code-error" error={error} status={status} />
        <p className={styles.statusBox} role="status">Enter the six-digit code sent to <strong>{method === "phone" ? phone : normalizeEmail(email)}</strong>. It expires in five minutes.</p>
        <div className={styles.field}><label className={styles.label} htmlFor="register-code">Six-digit verification code</label>
          <input ref={codeInput} className={styles.input} id="register-code" name="one-time-code" type="text" inputMode="numeric" autoComplete="one-time-code"
            pattern="[0-9]{6}" maxLength={6} required value={code} aria-invalid={error ? true : undefined} aria-describedby={error ? "register-code-error" : "register-code-hint"} onChange={event => { setCode(normalizeOtpEntry(event.currentTarget.value)); setError(""); }} />
          <p id="register-code-hint" className={styles.hint}>You can paste the full code. Never share it with anyone.</p></div>
        <button className={styles.primaryButton} type="submit" disabled={busy}>{busy ? "Verifying…" : method === "phone" ? "Verify and create account" : "Verify email"}</button>
        <button className={styles.secondaryButton} type="button" disabled={busy} onClick={() => void resend()}>{busy ? "Sending…" : "Resend code"}</button>
        <button className={styles.secondaryButton} type="button" disabled={busy} onClick={() => { setChallengeId(""); setCode(""); setError(""); setStatus(""); }}>Use a different {method === "phone" ? "number" : "email"}</button>
      </form>}</>}
  </AuthShell>;
}
export function RecoveryForm() {
  const [email, setEmail] = useState(""); const [challengeId, setChallengeId] = useState(""); const [resetDone, setResetDone] = useState(false);
  const [code, setCode] = useState(""); const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState(""); const [status, setStatus] = useState(""); const [busy, setBusy] = useState(false);
  const codeInput = useRef<HTMLInputElement>(null);
  const signInLink = useRef<HTMLAnchorElement>(null);
  useEffect(() => { if (challengeId) codeInput.current?.focus(); }, [challengeId]);
  useEffect(() => { if (resetDone) signInLink.current?.focus(); }, [resetDone]);
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
    if (!isAcceptedPassphrase(newPassword)) { setError("Password must be 8–128 characters."); return; }
    setBusy(true);
    try {
      await verifyChallenge(challengeId, { purpose: "password_recovery", code, newPassword });
      setChallengeId(""); setCode(""); setNewPassword(""); setResetDone(true);
    } catch (cause) { setError(messageFor(cause)); }
    finally { setBusy(false); }
  }
  async function resend() {
    setError(""); setStatus(""); setBusy(true);
    try {
      const result = await requestEmailChallenge({ channel: "email", purpose: "password_recovery", destination: normalizeEmail(email) });
      setCode("");
      setChallengeId(result.challengeId);
      setStatus("If the address is eligible, a new recovery code will be sent.");
    } catch (cause) { setError(messageFor(cause)); }
    finally { setBusy(false); }
  }
  return <AuthShell eyebrow="Account recovery" title="Reset your password" description="Request a one-time code using the email on your account.">
    {resetDone ? <div className={styles.form}><p className={styles.successBox} role="status">If the code was valid, your password has been reset.</p><Link ref={signInLink} className={styles.primaryButton} href="/sign-in">Sign in with your new password</Link></div>
      : !challengeId ? <form className={styles.form} onSubmit={request}>
      <FormMessage id="recovery-form-error" error={error} status={status} />
      <div className={styles.field}><label className={styles.label} htmlFor="recovery-email">Email address</label>
        <input className={styles.input} id="recovery-email" name="email" type="email" autoComplete="email" inputMode="email" maxLength={254}
          required value={email} aria-invalid={error ? true : undefined} aria-describedby={error ? "recovery-form-error" : "recovery-email-hint"} onChange={event => { setEmail(event.currentTarget.value); setError(""); }} />
        <p className={styles.hint} id="recovery-email-hint">For your privacy, the response is the same whether the address is eligible.</p></div>
      <button className={styles.primaryButton} type="submit" disabled={busy}>{busy ? "Requesting code…" : "Send recovery code"}</button>
      <Link className={styles.link} href="/sign-in">Back to sign in</Link>
    </form> : <form className={styles.form} onSubmit={reset}>
      <FormMessage id="recovery-code-error" error={error} status={status} />
      <p className={styles.statusBox} role="status">Enter the six-digit code sent to the email address. It expires in five minutes.</p>
      <div className={styles.field}><label className={styles.label} htmlFor="recovery-code">Six-digit recovery code</label>
        <input ref={codeInput} className={styles.input} id="recovery-code" name="one-time-code" type="text" inputMode="numeric" autoComplete="one-time-code"
          pattern="[0-9]{6}" maxLength={6} required value={code} aria-invalid={error ? true : undefined} aria-describedby={error ? "recovery-code-error" : "recovery-code-hint"} onChange={event => { setCode(normalizeOtpEntry(event.currentTarget.value)); setError(""); }} />
        <p className={styles.hint} id="recovery-code-hint">You can paste the full code. Never share it with anyone.</p></div>
      <PasswordField id="recovery-password" label="New password" autoComplete="new-password" value={newPassword} onChange={setNewPassword} />
      <button className={styles.primaryButton} type="submit" disabled={busy}>{busy ? "Resetting password…" : "Reset password"}</button>
      <button className={styles.secondaryButton} type="button" disabled={busy} onClick={() => void resend()}>{busy ? "Sending…" : "Resend code"}</button>
      <button className={styles.secondaryButton} type="button" disabled={busy} onClick={() => { setChallengeId(""); setCode(""); setError(""); setStatus(""); }}>Use a different email</button>
    </form>}
  </AuthShell>;
}

function PhoneVerificationPanel({ csrfToken, initiallyVerified }: { csrfToken: string; initiallyVerified: boolean }) {
  const [phone, setPhone] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [code, setCode] = useState("");
  const [phase, setPhase] = useState<"enter" | "code" | "verified">(initiallyVerified ? "verified" : "enter");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function requestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setStatus("");
    const normalizedPhone = normalizePhoneNumber(phone);
    if (!normalizedPhone) { setError("Enter a valid Indian mobile number with 10 digits."); return; }
    setBusy(true);
    try {
      const attached = await setPhoneForVerification(normalizedPhone, csrfToken);
      setPhone(normalizedPhone);
      if (!attached.verificationRequired) {
        setPhase("verified");
        return;
      }
      const challenge = await requestPhoneChallenge({ channel: "phone", purpose: "phone_verification", destination: normalizedPhone });
      setChallengeId(challenge.challengeId);
      setPhase("code");
      setStatus("If this number can be verified, a code will be sent. Enter the six-digit code here.");
    } catch (cause) { setError(messageFor(cause)); }
    finally { setBusy(false); }
  }

  async function verifyPhone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setStatus("");
    if (!/^\d{6}$/.test(code)) { setError("Enter the six-digit code."); return; }
    setBusy(true);
    try {
      await verifyPhoneChallenge(challengeId, { purpose: "phone_verification", code });
      setCode(""); setChallengeId(""); setPhase("verified");
    } catch (cause) { setError(messageFor(cause)); }
    finally { setBusy(false); }
  }

  function changeNumber() {
    setCode(""); setChallengeId(""); setError(""); setStatus(""); setPhase("enter");
  }

  return <section className={styles.subForm} aria-labelledby="phone-verification-heading">
    <hr className={styles.separator} />
    <div>
      <h2 className={styles.sectionHeading} id="phone-verification-heading">Phone number</h2>
      <p className={styles.hint}>Add and verify an Indian mobile number for contact and account recovery. It won’t sign you in by phone.</p>
    </div>
    {phase === "verified" ? <div className={styles.form}>
      <p className={styles.successBox} role="status">Your phone number is verified for this account.</p>
      <button className={styles.secondaryButton} type="button" onClick={changeNumber}>Change phone number</button>
    </div> : phase === "code" ? <form className={styles.form} onSubmit={verifyPhone}>
      <FormMessage error={error} status={status} />
      <div className={styles.field}>
        <label className={styles.label} htmlFor="account-phone-code">Six-digit verification code</label>
        <input className={styles.input} id="account-phone-code" name="one-time-code" type="text" inputMode="numeric" autoComplete="one-time-code"
          pattern="[0-9]{6}" maxLength={6} required value={code} onChange={event => setCode(normalizeOtpEntry(event.currentTarget.value))} />
      </div>
      <button className={styles.primaryButton} type="submit" disabled={busy}>{busy ? "Verifying…" : "Verify phone number"}</button>
      <button className={styles.secondaryButton} type="button" disabled={busy} onClick={changeNumber}>Use a different number</button>
    </form> : <form className={styles.form} onSubmit={requestCode}>
      <FormMessage error={error} status={status} />
      <div className={styles.field}>
        <label className={styles.label} htmlFor="account-phone">Indian mobile number</label>
        <input className={styles.input} id="account-phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" maxLength={20}
          placeholder="+91 98765 43210" aria-describedby="account-phone-hint" required value={phone} onChange={event => setPhone(event.currentTarget.value)} />
        <p className={styles.hint} id="account-phone-hint">We’ll text a one-time code to confirm this number belongs to you.</p>
      </div>
      <button className={styles.primaryButton} type="submit" disabled={busy}>{busy ? "Sending code…" : "Add phone and send code"}</button>
    </form>}
  </section>;
}

export function AccountSession() {
  const router = useRouter();
  const [state, setState] = useState<"loading" | "ready" | "expired" | "error">("loading");
  const [csrf, setCsrf] = useState(""); const [error, setError] = useState("");
  const [account, setAccount] = useState<CurrentSession["account"] | null>(null);
  const [signOutBusy, setSignOutBusy] = useState(false);
  async function inspect() {
    setState("loading"); setError("");
    try { const session = await getCurrentSession(); setCsrf(session.csrfToken); setAccount(session.account); setState("ready"); }
    catch (cause) {
      if (cause instanceof AuthApiError && cause.status === 401) setState("expired");
      else { setError(messageFor(cause)); setState("error"); }
    }
  }
  // Load on mount without placing session data in browser storage or URLs.
  useEffect(() => { void inspect(); }, []);
  async function signOut() {
    if (signOutBusy || !csrf) return;
    setError(""); setSignOutBusy(true);
    try { await logoutCurrentSession(csrf); setCsrf(""); setAccount(null); router.replace("/sign-in"); router.refresh(); }
    catch (cause) { setError(messageFor(cause)); }
    finally { setSignOutBusy(false); }
  }
  return <AuthShell eyebrow="Your account" title="Account session" description="This page is shown only after the backend confirms your session.">
    {state === "loading" && <p className={styles.loading} role="status">Checking your session…</p>}
    {state === "ready" && <div className={styles.form}><p className={styles.successBox} role="status">You are signed in.</p>
      {error && <FormMessage error={error} status="" />}
      {account?.signInMethod === "phone"
        ? <section className={styles.subForm} aria-labelledby="phone-sign-in-heading">
          <hr className={styles.separator} />
          <h2 className={styles.sectionHeading} id="phone-sign-in-heading">Phone sign-in</h2>
          <p className={styles.hint}>Your phone number is verified and is used to sign in with a one-time code. You don’t need to add it again here.</p>
          {account.phoneVerified && <p className={styles.successBox} role="status">Phone number verified</p>}
        </section>
        : <PhoneVerificationPanel csrfToken={csrf} initiallyVerified={account?.phoneVerified ?? false} />}
      <button className={styles.primaryButton} type="button" onClick={signOut} disabled={signOutBusy}>
        {signOutBusy ? "Signing out…" : "Sign out"}
      </button></div>}
    {state === "expired" && <div className={styles.form}><p className={styles.statusBox}>Your session has expired. Sign in to continue.</p><Link className={styles.primaryButton} href="/sign-in">Go to sign in</Link></div>}
    {state === "error" && <div className={styles.form}><FormMessage error={error} status=""/><button className={styles.secondaryButton} type="button" onClick={() => void inspect()}>Try again</button></div>}
  </AuthShell>;
}
