"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store";

function LoginForm() {
  const router = useRouter();
  const { login, firebaseEmailLogin, googleLogin, currentUser, restoreAccount, sendPasswordReset } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [deletedUid, setDeletedUid] = useState<string | null>(null);

  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [sendingReset, setSendingReset] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");

  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("signup") === "success") {
      setSuccess("Account created successfully. You can now log in.");
    }
  }, [searchParams]);

  // If already logged in, redirect
  if (currentUser) {
    router.replace("/dashboard");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password");
      return;
    }
    setLoading(true);

    // Try legacy seed user login first (by username)
    const legacyRes = login(email, password);
    if (legacyRes.ok) {
      router.push("/dashboard");
      return;
    }
    if (legacyRes.isDeleted && legacyRes.uid) {
      setDeletedUid(legacyRes.uid);
      setError("Account deleted. Recover?");
      setLoading(false);
      return;
    }

    // Then try Firebase email/password
    const res = await firebaseEmailLogin(email, password);
    if (res.ok) {
      router.push("/dashboard");
    } else {
      if (res.isDeleted && res.uid) {
        setDeletedUid(res.uid);
        setError("Account deleted. Recover?");
      } else {
        setError(res.error || "Invalid email or password");
      }
      setLoading(false);
    }
  };

  const handleRestore = () => {
    if (!deletedUid) return;
    restoreAccount(deletedUid);
    setDeletedUid(null);
    setError("");
    alert("Account restored! Please login again.");
  };

  const handleForgotSubmit = async () => {
    if (!forgotEmail) return;
    setSendingReset(true);
    setForgotMessage("");
    const res = await sendPasswordReset(forgotEmail);
    setSendingReset(false);
    if (res.ok) {
      setForgotMessage("Reset link sent! Check your email.");
      setTimeout(() => setIsForgotOpen(false), 3000);
    } else {
      setForgotMessage(res.error || "Failed to send link.");
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center overflow-x-hidden px-4"
      style={{ background: "linear-gradient(180deg, #C5CAE9 0%, #FFFFFF 100%)" }}
    >
      <div className="w-full max-w-[480px]">
        {/* Branding */}
        <div className="flex flex-col items-center mb-6">
          <h1 className="text-primary text-[28px] font-bold leading-tight text-center">
            CablePro
          </h1>
          <p className="text-text-secondary text-sm font-normal leading-normal text-center mt-1">
            Management System
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-danger/10 border border-danger/30 text-danger rounded-lg px-4 py-3 mb-4 text-sm font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">error</span>
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="bg-success/10 border border-success/30 text-success-dark rounded-lg px-4 py-3 mb-4 text-sm font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">check_circle</span>
            {success}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div className="flex flex-col w-full">
            <label className="text-text-primary text-sm font-medium pb-1.5">Email or Username</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">
                mail
              </span>
              <input
                className="flex w-full rounded-lg text-text-primary bg-white border border-border h-14 placeholder:text-text-secondary pl-12 pr-4 text-base focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all"
                placeholder="Enter your email or username"
                type="text"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col w-full">
            <label className="text-text-primary text-sm font-medium pb-1.5">Password</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">
                lock
              </span>
              <input
                className="flex w-full rounded-lg text-text-primary bg-white border border-border h-14 placeholder:text-text-secondary pl-12 pr-12 text-base focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all"
                placeholder="••••••••"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary cursor-pointer hover:text-primary transition-colors"
              >
                {showPassword ? "visibility_off" : "visibility"}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                className="w-5 h-5 rounded border-border text-primary focus:ring-primary accent-primary"
                type="checkbox"
              />
              <span className="text-sm text-text-primary">Remember me</span>
            </label>
            <button type="button" onClick={() => { setIsForgotOpen(true); setForgotMessage(""); }} className="text-sm font-medium text-primary hover:underline bg-transparent border-0 p-0 cursor-pointer">
              Forgot Password?
            </button>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold h-12 rounded-lg shadow-md flex items-center justify-center gap-2 transition-all uppercase tracking-wide active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? (
              <span className="animate-spin material-symbols-outlined text-[20px]">progress_activity</span>
            ) : (
              <>LOGIN <span className="material-symbols-outlined text-[20px]">arrow_forward</span></>
            )}
          </button>

          {deletedUid && (
            <button
              type="button"
              onClick={handleRestore}
              className="w-full bg-success hover:bg-success-dark text-white font-bold h-12 rounded-lg shadow-md flex items-center justify-center gap-2 transition-all uppercase tracking-wide active:scale-[0.98] mt-2"
            >
              <span className="material-symbols-outlined">restore_from_trash</span>
              Restore Account
            </button>
          )}

          {/* Sign Up Link */}
          <div className="text-center mt-2">
            <p className="text-text-secondary text-sm">
              New operator?{" "}
              <Link href="/signup" className="text-primary font-semibold hover:underline">
                Sign up here
              </Link>
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-border" />
            <span className="text-text-secondary text-xs uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Google Sign In */}
          <button
            type="button"
            disabled={googleLoading}
            onClick={async () => {
              setGoogleLoading(true);
              setError("");
              const res = await googleLogin();
              if (res.ok) {
                router.push("/dashboard");
              } else {
                if (res.isDeleted && res.uid) {
                  setDeletedUid(res.uid);
                  setError("Account deleted. Recover?");
                } else {
                  setError(res.error || "Google sign-in failed");
                }
                setGoogleLoading(false);
              }
            }}
            className="w-full bg-white hover:bg-gray-50 text-text-primary font-semibold h-12 rounded-lg border border-border shadow-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {googleLoading ? (
              <span className="animate-spin material-symbols-outlined text-[20px]">progress_activity</span>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" /><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" /><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.01 24.01 0 0 0 0 21.56l7.98-6.19z" /><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" /></svg>
                Continue with Google
              </>
            )}
          </button>
        </form>
      </div>

      {/* Forgot Password Modal */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Reset Password</h2>
            <p className="text-text-secondary text-sm mb-4">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            {forgotMessage && (
              <div className={`text-sm mb-4 p-2 rounded ${forgotMessage.includes("sent") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {forgotMessage}
              </div>
            )}
            <input
              type="email"
              className="w-full border border-border rounded-lg h-12 px-4 mb-4 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              placeholder="Enter your email"
              value={forgotEmail}
              onChange={e => setForgotEmail(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsForgotOpen(false)}
                className="px-4 py-2 text-text-secondary hover:bg-gray-100 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleForgotSubmit}
                disabled={sendingReset}
                className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark disabled:opacity-70 flex items-center gap-2"
              >
                {sendingReset && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                Send Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
