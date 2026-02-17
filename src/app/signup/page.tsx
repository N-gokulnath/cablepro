"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store";

export default function SignupPage() {
    const router = useRouter();
    const { firebaseEmailSignup, googleLogin, currentUser, logout } = useStore();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    if (currentUser) {
        router.replace("/dashboard");
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!fullName.trim() || !email.trim() || !password.trim()) {
            setError("All fields are required");
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        setLoading(true);
        const res = await firebaseEmailSignup({ fullName, email, password });
        if (res.ok) {
            // Logout immediately so they see the login page
            logout();
            router.push("/?signup=success");
        } else {
            setError(res.error || "Registration failed");
            setLoading(false);
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
                        Create your operator account
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-danger/10 border border-danger/30 text-danger rounded-lg px-4 py-3 mb-4 text-sm font-medium flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">error</span>
                        {error}
                    </div>
                )}

                {/* Signup Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Full Name */}
                    <div className="flex flex-col w-full">
                        <label className="text-text-primary text-sm font-medium pb-1.5">Full Name</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">badge</span>
                            <input
                                className="flex w-full rounded-lg text-text-primary bg-white border border-border h-14 placeholder:text-text-secondary pl-12 pr-4 text-base focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all"
                                placeholder="Enter your full name"
                                type="text"
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="flex flex-col w-full">
                        <label className="text-text-primary text-sm font-medium pb-1.5">Email</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">mail</span>
                            <input
                                className="flex w-full rounded-lg text-text-primary bg-white border border-border h-14 placeholder:text-text-secondary pl-12 pr-4 text-base focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all"
                                placeholder="you@example.com"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="flex flex-col w-full">
                        <label className="text-text-primary text-sm font-medium pb-1.5">Password</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">lock</span>
                            <input
                                className="flex w-full rounded-lg text-text-primary bg-white border border-border h-14 placeholder:text-text-secondary pl-12 pr-12 text-base focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all"
                                placeholder="Min. 6 characters"
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

                    {/* Confirm Password */}
                    <div className="flex flex-col w-full">
                        <label className="text-text-primary text-sm font-medium pb-1.5">Confirm Password</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">lock</span>
                            <input
                                className="flex w-full rounded-lg text-text-primary bg-white border border-border h-14 placeholder:text-text-secondary pl-12 pr-4 text-base focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all"
                                placeholder="Re-enter password"
                                type={showPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Signup Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary-dark text-white font-bold h-12 rounded-lg shadow-md flex items-center justify-center gap-2 transition-all uppercase tracking-wide active:scale-[0.98] disabled:opacity-60"
                    >
                        {loading ? (
                            <span className="animate-spin material-symbols-outlined text-[20px]">progress_activity</span>
                        ) : (
                            <>CREATE ACCOUNT <span className="material-symbols-outlined text-[20px]">arrow_forward</span></>
                        )}
                    </button>

                    {/* Login Link */}
                    <div className="text-center mt-2">
                        <p className="text-text-secondary text-sm">
                            Already have an account?{" "}
                            <Link href="/" className="text-primary font-semibold hover:underline">
                                Login here
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
                                // For Google login, they are logged in, so go to dashboard
                                router.push("/dashboard");
                            } else {
                                setError(res.error || "Google sign-in failed");
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
                                Sign up with Google
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
