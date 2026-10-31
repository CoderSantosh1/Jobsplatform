"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  authErrorMessage,
  GOOGLE_REDIRECT_LOST_MESSAGE,
  isInAppBrowser,
  validateEmail,
  validateNewPassword,
} from "@/lib/auth-rules";
import type { StoredUser } from "@/lib/auth-session";

type View = "options" | "login" | "signup" | "forgot";

const loadClient = () => import("@/lib/firebase-auth-client");

function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5 shrink-0" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.7 1.2 9.2 3.6l6.9-6.9C35.9 2.4 30.5 0 24 0 14.6 0 6.5 5.4 2.6 13.2l8 6.2C12.5 13.6 17.8 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 7l7.2 5.6c4.2-3.9 7.1-9.6 7.1-17.1z" />
      <path fill="#FBBC05" d="M10.6 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-8-6.2C.9 16.5 0 20.1 0 24s.9 7.5 2.6 10.8l8-6.2z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.2-5.6c-2 1.4-4.6 2.2-8.7 2.2-6.2 0-11.5-4.1-13.4-9.8l-8 6.2C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

/** Continue with Google, or with email and password. Calls onSuccess once with the signed-in user. */
export default function FirebaseAuthPanel({ onSuccess }: { onSuccess: (user: StoredUser) => void }) {
  const [view, setView] = useState<View>("options");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingUser, setPendingUser] = useState<StoredUser | null>(null);
  const [inAppBrowser, setInAppBrowser] = useState(false);
  const redirectHandled = useRef(false);

  useEffect(() => {
    setInAppBrowser(isInAppBrowser(navigator.userAgent));
    // Back from a full-page Google sign-in. The SDK is only loaded when that actually happened.
    if (redirectHandled.current) return;
    redirectHandled.current = true;
    (async () => {
      try {
        if (!sessionStorage.getItem("srn-google-redirect")) return;
        setBusy(true);
        const { completeGoogleRedirect } = await loadClient();
        const user = await completeGoogleRedirect();
        if (user) onSuccess(user);
        else setError(GOOGLE_REDIRECT_LOST_MESSAGE);
      } catch (e) {
        setError(authErrorMessage(e));
      } finally {
        setBusy(false);
      }
    })();
    // Runs once when the panel opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchView = (next: View) => {
    setView(next);
    setError(null);
    setNotice(null);
    setShowPassword(false);
  };

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await action();
    } catch (e) {
      const code = (e as { code?: unknown }).code;
      setError(typeof code === "string" ? authErrorMessage(e) : e instanceof Error ? e.message : authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const google = () =>
    run(async () => {
      const { signInWithGoogle } = await loadClient();
      const user = await signInWithGoogle();
      if (user) onSuccess(user);
    });

  const submitEmail = (e: FormEvent) => {
    e.preventDefault();
    const problem =
      validateEmail(email) ||
      (view === "signup" && name.trim().length < 2 ? "Please enter your name." : null) ||
      (view === "signup" ? validateNewPassword(password) : password ? null : "Please enter your password.");
    if (problem) {
      setError(problem);
      return;
    }
    run(async () => {
      const client = await loadClient();
      if (view === "signup") {
        const user = await client.signUpWithEmail(name, email, password);
        // Verification is not required to continue, so the visitor's next step is not interrupted.
        setPendingUser(user);
      } else {
        onSuccess(await client.signInWithEmail(email, password));
      }
    });
  };

  const submitForgot = (e: FormEvent) => {
    e.preventDefault();
    const problem = validateEmail(email);
    if (problem) {
      setError(problem);
      return;
    }
    run(async () => {
      const { resetPassword } = await loadClient();
      try {
        await resetPassword(email);
      } catch (err) {
        // The same message whether or not the account exists, so this form cannot reveal who has one.
        if ((err as { code?: string }).code !== "auth/user-not-found") throw err;
      }
      setNotice("If an account exists for this email, a password reset link has been sent. Please check your inbox.");
    });
  };

  const messages = (
    <>
      {error && (
        <Alert className="border-2 border-red-200 bg-red-50/80" role="alert">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <AlertDescription className="text-red-700 font-semibold ml-2">{error}</AlertDescription>
        </Alert>
      )}
      {notice && (
        <Alert className="border-2 border-green-200 bg-green-50" role="status">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <AlertDescription className="text-green-800 font-semibold ml-2">{notice}</AlertDescription>
        </Alert>
      )}
    </>
  );

  const primaryButton =
    "w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold py-3 rounded-lg";
  const inputClass =
    "pl-11 py-3 bg-white border-2 border-amber-200 text-amber-900 placeholder-amber-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 rounded-lg";
  const labelClass = "text-sm font-bold text-amber-800";
  const iconClass = "absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-amber-600";

  if (pendingUser) {
    return (
      <div className="space-y-5 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
        <p className="font-semibold text-amber-900">
          Your account has been created. We sent a verification link to {pendingUser.email}. Please check your inbox.
        </p>
        <Button onClick={() => onSuccess(pendingUser)} className={primaryButton}>
          Continue
        </Button>
      </div>
    );
  }

  if (view === "options") {
    return (
      <div className="space-y-4">
        {messages}
        {inAppBrowser && (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            Google sign-in may not work inside this app. For Google, please open this page in Chrome or Safari.
          </p>
        )}
        <Button
          type="button"
          onClick={google}
          disabled={busy}
          variant="outline"
          className="w-full gap-3 border-2 border-gray-300 bg-white py-3 font-semibold text-gray-800 hover:bg-gray-50 rounded-lg"
        >
          {busy ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
          ) : (
            <GoogleLogo />
          )}
          Continue with Google
        </Button>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-amber-200" />
          </div>
          <div className="relative flex justify-center text-sm uppercase">
            <span className="bg-white px-4 font-medium text-amber-700">OR</span>
          </div>
        </div>
        <Button type="button" onClick={() => switchView("login")} disabled={busy} className={`${primaryButton} gap-3`}>
          <Mail className="h-5 w-5" />
          Continue with Email
        </Button>
      </div>
    );
  }

  const emailField = (
    <div className="space-y-2">
      <Label htmlFor="auth-email" className={labelClass}>
        Email
      </Label>
      <div className="relative">
        <Mail className={iconClass} />
        <Input
          id="auth-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </div>
    </div>
  );

  const backButton = (
    <button
      type="button"
      onClick={() => switchView("options")}
      className="inline-flex items-center gap-1 text-sm font-semibold text-amber-700 hover:underline"
    >
      <ArrowLeft className="h-4 w-4" />
      All login options
    </button>
  );

  if (view === "forgot") {
    return (
      <form onSubmit={submitForgot} noValidate className="space-y-4">
        {backButton}
        <p className="text-sm text-amber-900">Enter your email and we will send you a link to set a new password.</p>
        {emailField}
        {messages}
        <Button type="submit" disabled={busy} className={primaryButton}>
          {busy ? "Sending…" : "Send Reset Link"}
        </Button>
        <button
          type="button"
          onClick={() => switchView("login")}
          className="w-full text-sm font-semibold text-amber-700 hover:underline"
        >
          Back to login
        </button>
      </form>
    );
  }

  const signingUp = view === "signup";
  return (
    <form onSubmit={submitEmail} noValidate className="space-y-4">
      {backButton}
      <div role="tablist" aria-label="Login or sign up" className="grid grid-cols-2 gap-1 rounded-lg bg-amber-100 p-1">
        {(["login", "signup"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={view === tab}
            onClick={() => switchView(tab)}
            className={`rounded-md py-2 text-sm font-bold ${view === tab ? "bg-white text-amber-900 shadow" : "text-amber-700"}`}
          >
            {tab === "login" ? "Login" : "Sign Up"}
          </button>
        ))}
      </div>

      {signingUp && (
        <div className="space-y-2">
          <Label htmlFor="auth-name" className={labelClass}>
            Full Name
          </Label>
          <div className="relative">
            <User className={iconClass} />
            <Input
              id="auth-name"
              type="text"
              autoComplete="name"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      )}

      {emailField}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="auth-password" className={labelClass}>
            Password
          </Label>
          {!signingUp && (
            <button
              type="button"
              onClick={() => switchView("forgot")}
              className="text-sm font-semibold text-amber-700 hover:underline"
            >
              Forgot password?
            </button>
          )}
        </div>
        <div className="relative">
          <Lock className={iconClass} />
          <Input
            id="auth-password"
            type={showPassword ? "text" : "password"}
            autoComplete={signingUp ? "new-password" : "current-password"}
            placeholder={signingUp ? "At least 8 characters" : "Enter your password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${inputClass} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-700"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {messages}

      <Button type="submit" disabled={busy} className={primaryButton}>
        {busy ? (signingUp ? "Creating Account…" : "Logging In…") : signingUp ? "Create Account" : "Login"}
      </Button>
    </form>
  );
}
