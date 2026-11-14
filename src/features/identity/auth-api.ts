import type { components, operations } from "@/generated/renivet-api";

type RegisterRequest = operations["registerWithEmailAndPassword"]["requestBody"]["content"]["application/json"];
type RegisterResponse = operations["registerWithEmailAndPassword"]["responses"][202]["content"]["application/json"];
type PasswordSessionRequest = operations["createPasswordSession"]["requestBody"]["content"]["application/json"];
type PasswordSessionResponse = operations["createPasswordSession"]["responses"][200]["content"]["application/json"];
type ChallengeRequest = operations["createOtpChallenge"]["requestBody"]["content"]["application/json"];
type ChallengeResponse = operations["createOtpChallenge"]["responses"][202]["content"]["application/json"];
type VerifyRequest = operations["verifyOtpChallenge"]["requestBody"]["content"]["application/json"];
type VerifyResponse = operations["verifyOtpChallenge"]["responses"][200]["content"]["application/json"];
type SetPhoneRequest = operations["setPhoneForVerification"]["requestBody"]["content"]["application/json"];
type SetPhoneResponse = operations["setPhoneForVerification"]["responses"][202]["content"]["application/json"];
type MfaStepUpRequest = operations["stepUpWithMfa"]["requestBody"]["content"]["application/json"];
type MfaStepUpResponse = operations["stepUpWithMfa"]["responses"][200]["content"]["application/json"];
// NestJS currently documents logout's JSON example without a response schema, so validate this narrow shape at runtime.
type LogoutResponse = { status: "logged_out" };
type CsrfToken = operations["logoutCurrentSession"]["parameters"]["header"]["X-CSRF-Token"];
type ApiErrorCode = components["schemas"]["AuthErrorDto"]["code"];
type EmailChallengeRequest = Omit<ChallengeRequest, "channel" | "purpose"> & {
  channel: "email";
  purpose: "email_verification" | "password_recovery";
};
type EmailVerifyRequest = Omit<VerifyRequest, "purpose"> & {
  purpose: "email_verification" | "password_recovery";
};
type PhoneChallengeRequest = Omit<ChallengeRequest, "channel" | "purpose"> & {
  channel: "phone";
  purpose: "phone_verification" | "phone_registration";
};
type PhoneVerifyRequest = Omit<VerifyRequest, "purpose"> & { purpose: "phone_verification" | "phone_registration" };
type PhoneLoginResponse = { authenticationState: "authenticated"; user: { id: string } };

const fallbackError = {
  code: "AUTH_SERVICE_UNAVAILABLE" as const,
  message: "Authentication is temporarily unavailable. Please try again shortly.",
};

export class AuthApiError extends Error {
  constructor(readonly code: ApiErrorCode, message: string, readonly status: number) {
    super(message);
    this.name = "AuthApiError";
  }
}

function isApiError(value: unknown): value is { code: ApiErrorCode; message: string } {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return typeof record.code === "string"
    && ["AUTH_INPUT_INVALID", "AUTHENTICATION_FAILED", "AUTH_RATE_LIMITED", "AUTH_SERVICE_UNAVAILABLE", "AUTH_INTERNAL_ERROR", "AUTH_MFA_PROOF_INVALID", "AUTH_MFA_STEP_UP_REQUIRED", "AUTH_MFA_ENROLLMENT_UNAVAILABLE", "CSRF_VALIDATION_FAILED"].includes(record.code)
    && typeof record.message === "string";
}

async function requestJson<T>(url: string, init: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { ...init, cache: "no-store", credentials: "same-origin" });
  } catch {
    throw new AuthApiError(fallbackError.code, fallbackError.message, 503);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new AuthApiError(fallbackError.code, fallbackError.message, 503);
  }

  if (!response.ok) {
    if (isApiError(body)) throw new AuthApiError(body.code, body.message, response.status);
    throw new AuthApiError(fallbackError.code, fallbackError.message, 503);
  }
  return body as T;
}

function jsonPost(body: unknown): RequestInit {
  return { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

export async function registerWithEmailAndPassword(input: RegisterRequest): Promise<RegisterResponse> {
  const response = await requestJson<RegisterResponse>("/api/auth/register", jsonPost(input));
  if (response.status !== "accepted") throw new AuthApiError(fallbackError.code, fallbackError.message, 503);
  return response;
}

export async function requestEmailChallenge(input: EmailChallengeRequest): Promise<ChallengeResponse> {
  const response = await requestJson<ChallengeResponse>("/api/auth/challenges", jsonPost(input));
  if (response.status !== "accepted" || !isUuid(response.challengeId)) {
    throw new AuthApiError(fallbackError.code, fallbackError.message, 503);
  }
  return response;
}

export async function verifyChallenge(challengeId: string, input: EmailVerifyRequest): Promise<VerifyResponse> {
  const response = await requestJson<VerifyResponse>(
    `/api/auth/challenges/${encodeURIComponent(challengeId)}/verify`,
    jsonPost(input),
  );
  if (!("status" in response) || response.status !== "verified") throw new AuthApiError(fallbackError.code, fallbackError.message, 503);
  return response;
}

export async function setPhoneForVerification(phone: string, csrfToken: string): Promise<SetPhoneResponse> {
  const response = await requestJson<SetPhoneResponse>("/api/auth/phone", {
    ...jsonPost({ phone } satisfies SetPhoneRequest),
    headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
  });
  if (response.status !== "accepted" || typeof response.verificationRequired !== "boolean") {
    throw new AuthApiError(fallbackError.code, fallbackError.message, 503);
  }
  return response;
}

export async function requestPhoneChallenge(input: PhoneChallengeRequest): Promise<ChallengeResponse> {
  const response = await requestJson<ChallengeResponse>("/api/auth/challenges", jsonPost(input));
  if (response.status !== "accepted" || !isUuid(response.challengeId)) {
    throw new AuthApiError(fallbackError.code, fallbackError.message, 503);
  }
  return response;
}

export async function verifyPhoneChallenge(challengeId: string, input: PhoneVerifyRequest): Promise<VerifyResponse> {
  const response = await requestJson<VerifyResponse>(
    `/api/auth/challenges/${encodeURIComponent(challengeId)}/verify`,
    jsonPost(input),
  );
  if (!("status" in response) || response.status !== "verified") throw new AuthApiError(fallbackError.code, fallbackError.message, 503);
  return response;
}

export async function requestPhoneLoginChallenge(phone: string): Promise<ChallengeResponse> {
  const response = await requestJson<ChallengeResponse>("/api/auth/challenges", jsonPost({ channel: "phone", purpose: "phone_login", destination: phone }));
  if (response.status !== "accepted" || !isUuid(response.challengeId)) throw new AuthApiError(fallbackError.code, fallbackError.message, 503);
  return response;
}

export async function verifyPhoneLogin(challengeId: string, code: string): Promise<PhoneLoginResponse> {
  const response = await requestJson<unknown>(`/api/auth/challenges/${encodeURIComponent(challengeId)}/verify`, jsonPost({ purpose: "phone_login", code }));
  if (!response || typeof response !== "object") throw new AuthApiError(fallbackError.code, fallbackError.message, 503);
  const result = response as Record<string, unknown>;
  const user = result.user as Record<string, unknown> | undefined;
  if (result.authenticationState !== "authenticated" || !isUuid(user?.id)) throw new AuthApiError(fallbackError.code, fallbackError.message, 503);
  return response as PhoneLoginResponse;
}

export async function requestPhoneRegistrationChallenge(phone: string): Promise<ChallengeResponse> {
  const response = await requestPhoneChallenge({ channel: "phone", purpose: "phone_registration", destination: phone });
  return response;
}

export async function verifyPhoneRegistration(challengeId: string, code: string): Promise<PhoneLoginResponse> {
  const response = await requestJson<unknown>(`/api/auth/challenges/${encodeURIComponent(challengeId)}/verify`, jsonPost({ purpose: "phone_registration", code }));
  if (!response || typeof response !== "object") throw new AuthApiError(fallbackError.code, fallbackError.message, 503);
  const result = response as Record<string, unknown>;
  const user = result.user as Record<string, unknown> | undefined;
  if (result.authenticationState !== "authenticated" || !isUuid(user?.id)) throw new AuthApiError(fallbackError.code, fallbackError.message, 503);
  return response as PhoneLoginResponse;
}

export async function createPasswordSession(input: PasswordSessionRequest): Promise<PasswordSessionResponse> {
  const response = await requestJson<PasswordSessionResponse>("/api/auth/sessions", jsonPost(input));
  if (response.authenticationState !== "authenticated" || !isUuid(response.user?.id)) {
    throw new AuthApiError(fallbackError.code, fallbackError.message, 503);
  }
  return response;
}

export interface CurrentSession {
  authenticationState: "authenticated";
  user: { id: string };
  account: { signInMethod: "phone" | "email_password"; phoneVerified: boolean };
  csrfToken: string;
  destination: SessionDestination;
}

export type SessionDestination =
  | { kind: "storefront" }
  | { kind: "operations" }
  | { kind: "brands"; brands: Array<{ id: string; name: string }> };

function isCurrentSession(value: unknown): value is CurrentSession {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  const user = record.user;
  const account = record.account;
  const destination = record.destination;
  const validDestination = Boolean(destination && typeof destination === "object" && (() => {
    const value = destination as Record<string, unknown>;
    if (value.kind === "storefront" || value.kind === "operations") return true;
    return value.kind === "brands" && Array.isArray(value.brands) && value.brands.length > 0
      && value.brands.every((brand) => Boolean(brand && typeof brand === "object"
        && isUuid((brand as Record<string, unknown>).id)
        && typeof (brand as Record<string, unknown>).name === "string"
        && ((brand as Record<string, unknown>).name as string).trim().length > 0));
  })());
  return record.authenticationState === "authenticated"
    && Boolean(user && typeof user === "object" && isUuid((user as Record<string, unknown>).id))
    && Boolean(account && typeof account === "object"
      && ["phone", "email_password"].includes(String((account as Record<string, unknown>).signInMethod))
      && typeof (account as Record<string, unknown>).phoneVerified === "boolean")
    && typeof record.csrfToken === "string"
    && record.csrfToken.length >= 32
    && record.csrfToken.length <= 512
    && validDestination;
}

export async function getCurrentSession(): Promise<CurrentSession> {
  const body = await requestJson<unknown>("/api/auth/session", { method: "GET" });
  if (!isCurrentSession(body)) throw new AuthApiError(fallbackError.code, fallbackError.message, 503);
  return body;
}

export async function stepUpWithMfa(code: MfaStepUpRequest["code"], csrfToken: CsrfToken): Promise<MfaStepUpResponse> {
  const response = await requestJson<unknown>("/api/auth/mfa/step-up", {
    ...jsonPost({ code }),
    headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
  });
  if (!response || typeof response !== "object") throw new AuthApiError(fallbackError.code, fallbackError.message, 503);
  const value = response as Record<string, unknown>;
  if (value.authenticationState !== "elevated" || typeof value.csrfToken !== "string" || value.csrfToken.length < 32 || value.csrfToken.length > 512) {
    throw new AuthApiError(fallbackError.code, fallbackError.message, 503);
  }
  return response as MfaStepUpResponse;
}

export async function logoutCurrentSession(csrfToken: CsrfToken): Promise<LogoutResponse> {
  const response = await requestJson<unknown>("/api/auth/session", {
    method: "DELETE",
    headers: { "X-CSRF-Token": csrfToken },
  });
  if (!response || typeof response !== "object" || (response as Record<string, unknown>).status !== "logged_out") {
    throw new AuthApiError(fallbackError.code, fallbackError.message, 503);
  }
  return response as LogoutResponse;
}

function isUuid(value: unknown): value is string {
  return typeof value === "string"
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
