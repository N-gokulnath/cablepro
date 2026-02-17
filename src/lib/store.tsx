"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import type { Customer, Payment, User } from "./types";
import {
    auth, googleProvider, signInWithPopup, signOut as firebaseSignOut,
    createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile,
    sendPasswordResetEmail, GoogleAuthProvider
} from "./firebase";

/* ───────── seed data (only for seed user u2) ───────── */
const SEED_USERS: User[] = [
    { id: "u2", username: "operator", password: "operator123", fullName: "Raj Kumar", role: "operator", email: "raj@cablepro.in" },
];

const SEED_CUSTOMERS: Customer[] = [
    { id: "c1", name: "Rajesh Kumar", phone: "+91 98765 43210", address: "123, Maple Street, Green View Layout", stbNumber: "9876543210", connectionDate: "2023-01-15", packageName: "Ultra HD Gold Pack", monthlyRate: 450, planDuration: 1, status: "Active", operatorId: "u2", createdAt: "2023-01-15" },
    { id: "c2", name: "Priya Sharma", phone: "+91 98765 43211", address: "45, Oak Avenue, Sunflower Colony", stbNumber: "8765432109", connectionDate: "2023-02-20", packageName: "Basic HD Pack", monthlyRate: 300, planDuration: 1, status: "Active", operatorId: "u2", createdAt: "2023-02-20" },
    { id: "c3", name: "Amit Patel", phone: "+91 98765 43212", address: "78, Pine Road, Lake View", stbNumber: "7654321098", connectionDate: "2023-03-10", packageName: "Premium Pack", monthlyRate: 500, planDuration: 1, status: "Active", operatorId: "u2", createdAt: "2023-03-10" },
    { id: "c4", name: "Sunita Devi", phone: "+91 98765 43213", address: "12, Elm Street, Park Side", stbNumber: "6543210987", connectionDate: "2023-04-05", packageName: "Ultra HD Gold Pack", monthlyRate: 450, planDuration: 3, status: "Active", operatorId: "u2", createdAt: "2023-04-05" },
    { id: "c5", name: "Vikram Singh", phone: "+91 98765 43214", address: "56, Cedar Lane, Hill View", stbNumber: "5432109876", connectionDate: "2023-05-15", packageName: "Basic HD Pack", monthlyRate: 300, planDuration: 1, status: "Active", operatorId: "u2", createdAt: "2023-05-15" },
    { id: "c6", name: "Deepak Verma", phone: "+91 98765 43215", address: "90, Birch Road, Valley Side", stbNumber: "4321098765", connectionDate: "2023-06-20", packageName: "Premium Pack", monthlyRate: 500, planDuration: 6, status: "Deactive", operatorId: "u2", createdAt: "2023-06-20" },
    { id: "c7", name: "Neha Gupta", phone: "+91 98765 43216", address: "34, Willow Court, River Edge", stbNumber: "3210987654", connectionDate: "2023-07-10", packageName: "Ultra HD Gold Pack", monthlyRate: 450, planDuration: 12, status: "Active", operatorId: "u2", createdAt: "2023-07-10" },
    { id: "c8", name: "Rahul Saxena", phone: "+91 98765 43217", address: "67, Ash Street, Mountain View", stbNumber: "2109876543", connectionDate: "2023-08-05", packageName: "Basic HD Pack", monthlyRate: 300, planDuration: 1, status: "Active", operatorId: "u2", createdAt: "2023-08-05" },
];

const SEED_PAYMENTS: Payment[] = [
    { id: "p1", customerId: "c1", customerName: "Rajesh Kumar", amount: 450, paymentDate: "2026-02-13", paymentMethod: "UPI", billingPeriod: "February 2026", status: "Confirmed", notes: "", createdAt: "2026-02-13T10:30:00" },
    { id: "p2", customerId: "c2", customerName: "Priya Sharma", amount: 300, paymentDate: "2026-02-13", paymentMethod: "Cash", billingPeriod: "February 2026", status: "Confirmed", notes: "", createdAt: "2026-02-13T11:00:00" },
    { id: "p3", customerId: "c8", customerName: "Rahul Saxena", amount: 500, paymentDate: "2026-02-12", paymentMethod: "UPI", billingPeriod: "February 2026", status: "Confirmed", notes: "", createdAt: "2026-02-12T09:15:00" },
    { id: "p4", customerId: "c5", customerName: "Vikram Singh", amount: 300, paymentDate: "2026-02-12", paymentMethod: "Cash", billingPeriod: "January 2026", status: "Pending", notes: "Partial payment", createdAt: "2026-02-12T14:00:00" },
    { id: "p5", customerId: "c4", customerName: "Sunita Devi", amount: 450, paymentDate: "2026-02-11", paymentMethod: "Cash", billingPeriod: "February 2026", status: "Confirmed", notes: "", createdAt: "2026-02-11T10:00:00" },
    { id: "p6", customerId: "c7", customerName: "Neha Gupta", amount: 450, paymentDate: "2026-02-10", paymentMethod: "UPI", billingPeriod: "February 2026", status: "Confirmed", notes: "", createdAt: "2026-02-10T16:30:00" },
    { id: "p7", customerId: "c3", customerName: "Amit Patel", amount: 500, paymentDate: "2026-02-10", paymentMethod: "UPI", billingPeriod: "February 2026", status: "Confirmed", notes: "", createdAt: "2026-02-10T11:45:00" },
    { id: "p8", customerId: "c1", customerName: "Rajesh Kumar", amount: 450, paymentDate: "2026-01-13", paymentMethod: "Cash", billingPeriod: "January 2026", status: "Confirmed", notes: "", createdAt: "2026-01-13T10:30:00" },
    { id: "p9", customerId: "c2", customerName: "Priya Sharma", amount: 300, paymentDate: "2026-01-12", paymentMethod: "UPI", billingPeriod: "January 2026", status: "Confirmed", notes: "", createdAt: "2026-01-12T09:00:00" },
];

/* ───────── helpers ───────── */
// receiptCounter removed
function genId() { return Math.random().toString(36).substring(2, 10); }

/* ───────── context type ───────── */
interface AppStore {
    currentUser: User | null;
    login: (username: string, password: string) => { ok: boolean; error?: string; isDeleted?: boolean; uid?: string };
    signup: (data: { fullName: string; username: string; password: string; email: string }) => { ok: boolean; error?: string };
    firebaseEmailSignup: (data: { fullName: string; email: string; password: string }) => Promise<{ ok: boolean; error?: string }>;
    firebaseEmailLogin: (email: string, password: string) => Promise<{ ok: boolean; error?: string; isDeleted?: boolean; uid?: string }>;
    googleLogin: () => Promise<{ ok: boolean; error?: string; isDeleted?: boolean; uid?: string }>;
    logout: () => void;
    deleteAccount: () => void;
    restoreAccount: (uid: string) => void;

    sendPasswordReset: (email: string) => Promise<{ ok: boolean; error?: string }>;
    backupToDrive: () => Promise<{ ok: boolean; error?: string }>;
    restoreFromDrive: () => Promise<{ ok: boolean; count?: number; error?: string }>;
    updateUserProfile: (data: { fullName?: string; profileImage?: string }) => void;
    customers: Customer[];
    importCustomers: (data: Customer[]) => { count: number; error?: string };
    addCustomer: (c: Omit<Customer, "id" | "createdAt">) => Customer;
    updateCustomer: (id: string, c: Partial<Customer>) => void;
    deleteCustomer: (id: string) => void;
    getCustomer: (id: string) => Customer | undefined;
    payments: Payment[];
    addPayment: (p: Omit<Payment, "id" | "createdAt">) => Payment;
    updatePayment: (id: string, p: Partial<Payment>) => void;
    getPaymentsForCustomer: (customerId: string) => Payment[];
    totalCustomers: number;
    activeCustomers: number;
    totalPaidCustomers: number;
    totalOutstanding: number;
    todayCollection: number;
    thisMonthCollection: number;
    recentActivity: { title: string; subtitle: string; time: string; icon: string; iconBg: string; iconColor: string; customerId: string }[];
    exportCustomersCSV: () => void;
    exportPaymentsCSV: () => void;
    theme: "light" | "dark";
    toggleTheme: () => void;
    hydrated: boolean;
    backupFrequency: "manual" | "daily" | "weekly" | "monthly";
    setBackupFrequency: (freq: "manual" | "daily" | "weekly" | "monthly") => void;
    showBackupReminder: boolean;
    setShowBackupReminder: (show: boolean) => void;
    googleAccessToken: string | null;
}


const StoreContext = createContext<AppStore | null>(null);
export function useStore() {
    const ctx = useContext(StoreContext);
    if (!ctx) throw new Error("useStore must be used within StoreProvider");
    return ctx;
}

/* ───────── localStorage helpers ───────── */
function uKey(userId: string, key: string) { return `cp_${userId}_${key}`; }

function load<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch { return fallback; }
}
function save(key: string, data: unknown) {
    if (typeof window === "undefined") return;
    try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* ignore */ }
}

/* ───────── provider ───────── */
export function StoreProvider({ children }: { children: React.ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [deletedUsers, setDeletedUsers] = useState<Record<string, string>>({}); // uid -> ISO date
    const [hydrated, setHydrated] = useState(false);
    const [theme, setTheme] = useState<"light" | "dark">("light");
    const [backupFrequency, setBackupFrequency] = useState<"manual" | "daily" | "weekly" | "monthly">("manual");
    const [showBackupReminder, setShowBackupReminder] = useState(false);
    const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
    const loadedUid = useRef<string | null>(null);
    const lastBackupTime = useRef<number>(0);

    /* ── mount: clean old keys, restore user & their data ── */
    useEffect(() => {
        try {
            // clean up all legacy keys
            ["cablepro_user", "cablepro_customers", "cablepro_payments",
                "cablepro_registered_users", "cablepro_current_user"].forEach(k => {
                    try { localStorage.removeItem(k); } catch { /* */ }
                });

            const savedTheme = load<"light" | "dark">("cablepro_theme", "light");
            setTheme(savedTheme);
            if (typeof document !== "undefined") {
                if (savedTheme === "dark") document.documentElement.classList.add("dark");
                else document.documentElement.classList.remove("dark");
            }

            const du = load<Record<string, string>>("cp_deleted_users", {});
            setDeletedUsers(du);

            const saved = load<User | null>("cp_current_user", null);
            if (saved) {
                setCurrentUser(saved);
                const uid = saved.id;
                const seed = uid === "u2";
                const sc = load<Customer[]>(uKey(uid, "cust"), []);
                const sp = load<Payment[]>(uKey(uid, "pay"), []);
                // Sanitize old payment methods — only Cash & UPI allowed
                const sanitizePayments = (list: Payment[]) => list.map(p =>
                    (p.paymentMethod !== "Cash" && p.paymentMethod !== "UPI")
                        ? { ...p, paymentMethod: "Cash" as const }
                        : p
                );
                setCustomers(sc.length > 0 ? sc : seed ? SEED_CUSTOMERS : []);
                setPayments(sp.length > 0 ? sanitizePayments(sp) : seed ? SEED_PAYMENTS : []);

                setCustomers(sc.length > 0 ? sc : seed ? SEED_CUSTOMERS : []);
                setPayments(sp.length > 0 ? sanitizePayments(sp) : seed ? SEED_PAYMENTS : []);

                const bf = load<any>(uKey(uid, "backup_freq"), "manual");
                setBackupFrequency(bf);
                lastBackupTime.current = load<number>(uKey(uid, "last_backup"), 0);

                // Reminder check (3 days)
                const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
                if (lastBackupTime.current > 0 && (Date.now() - lastBackupTime.current) > THREE_DAYS) {
                    setShowBackupReminder(true);
                }

                loadedUid.current = uid;
            }
        } catch { /* always continue */ }
        setHydrated(true);
    }, []);

    /* ── when user changes after login/logout, swap data ── */
    useEffect(() => {
        if (!hydrated) return;
        if (currentUser) {
            save("cp_current_user", currentUser);
            const uid = currentUser.id;
            if (loadedUid.current !== uid) {
                const seed = uid === "u2";
                const sc = load<Customer[]>(uKey(uid, "cust"), []);
                const sp = load<Payment[]>(uKey(uid, "pay"), []);
                const sanitize = (list: Payment[]) => list.map(p =>
                    (p.paymentMethod !== "Cash" && p.paymentMethod !== "UPI")
                        ? { ...p, paymentMethod: "Cash" as const } : p
                );
                setCustomers(sc.length > 0 ? sc : seed ? SEED_CUSTOMERS : []);
                setPayments(sp.length > 0 ? sanitize(sp) : seed ? SEED_PAYMENTS : []);

                setCustomers(sc.length > 0 ? sc : seed ? SEED_CUSTOMERS : []);
                setPayments(sp.length > 0 ? sanitize(sp) : seed ? SEED_PAYMENTS : []);

                const bf = load<any>(uKey(uid, "backup_freq"), "manual");
                setBackupFrequency(bf);
                lastBackupTime.current = load<number>(uKey(uid, "last_backup"), 0);

                // Reminder check
                const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
                if (lastBackupTime.current > 0 && (Date.now() - lastBackupTime.current) > THREE_DAYS) {
                    setShowBackupReminder(true);
                }

                // Auto-restore if no local data exists and it's a new login
                if (sc.length === 0 && !seed) {
                    console.log("No local data found, attempting auto-restore...");
                    restoreFromDrive();
                }

                loadedUid.current = uid;
            }
        } else if (loadedUid.current !== null) {
            save("cp_current_user", null);
            setCustomers([]);
            setPayments([]);
            loadedUid.current = null;
        }
    }, [currentUser, hydrated]);

    /* ── auto-backup logic ── */
    useEffect(() => {
        if (!hydrated || !currentUser || backupFrequency === "manual") return;

        const checkAndBackup = async () => {
            const now = Date.now();
            const last = lastBackupTime.current;
            let shouldBackup = false;

            const DAILY = 24 * 60 * 60 * 1000; // Actually "Every 3 Days" logic was specified before, but user said keep Weekly/Monthly/Every 3 Days
            const THREE_DAYS = 3 * DAILY;
            const WEEK = 7 * DAILY;
            const MONTH = 30 * DAILY;

            if (backupFrequency === "daily" && (now - last) > THREE_DAYS) shouldBackup = true;
            else if (backupFrequency === "weekly" && (now - last) > WEEK) shouldBackup = true;
            else if (backupFrequency === "monthly" && (now - last) > MONTH) shouldBackup = true;

            if (shouldBackup) {
                console.log("Auto-backing up...");
                const res = await backupToDrive();
                if (res.ok) {
                    lastBackupTime.current = now;
                    save(uKey(currentUser.id, "last_backup"), now);
                }
            }
        };

        const timer = setTimeout(checkAndBackup, 5000);
        return () => clearTimeout(timer);
    }, [hydrated, currentUser, backupFrequency, customers, payments]);

    /* ── persist backup settings ── */
    useEffect(() => {
        if (hydrated && currentUser) {
            save(uKey(currentUser.id, "backup_freq"), backupFrequency);
        }
    }, [backupFrequency, hydrated, currentUser]);

    /* ── persist per-user data ── */
    useEffect(() => { if (hydrated && currentUser) save(uKey(currentUser.id, "cust"), customers); }, [customers, hydrated, currentUser]);
    useEffect(() => { if (hydrated && currentUser) save(uKey(currentUser.id, "pay"), payments); }, [payments, hydrated, currentUser]);
    /* ── persist deleted users ── */
    useEffect(() => { if (hydrated) save("cp_deleted_users", deletedUsers); }, [deletedUsers, hydrated]);

    /* ── make local User from Firebase user ── */
    const toLocal = useCallback((fb: { uid: string; email: string | null; displayName: string | null }): User => ({
        id: fb.uid, username: fb.email?.split("@")[0] || fb.uid, password: "",
        fullName: fb.displayName || "User", role: "operator", email: fb.email || "",
    }), []);

    /* ── auth ── */
    /* ── auth ── */
    const checkDeleted = useCallback((uid: string) => {
        if (deletedUsers[uid]) {
            const delDate = new Date(deletedUsers[uid]);
            const diff = Date.now() - delDate.getTime();
            const days = diff / (1000 * 3600 * 24);
            if (days < 7) return { isDeleted: true };
            // > 7 days, effectively permanently deleted (return error or handle logic)
            return { isDeleted: true, permanent: true };
        }
        return { isDeleted: false };
    }, [deletedUsers]);

    const login = useCallback((username: string, password: string) => {
        const u = SEED_USERS.find(u => u.username === username && u.password === password);
        if (u) {
            const check = checkDeleted(u.id);
            if (check.isDeleted) return { ok: false, isDeleted: true, uid: u.id, error: "Account deleted." };
            setCurrentUser(u);
            return { ok: true };
        }
        return { ok: false, error: "Invalid credentials" };
    }, [checkDeleted]);

    const signup = useCallback((data: { fullName: string; username: string; password: string; email: string }) => {
        setCurrentUser({ id: genId(), ...data, role: "operator" });
        return { ok: true };
    }, []);

    const firebaseEmailSignup = useCallback(async (data: { fullName: string; email: string; password: string }) => {
        try {
            const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
            await updateProfile(cred.user, { displayName: data.fullName });
            setCurrentUser(toLocal({ uid: cred.user.uid, email: cred.user.email, displayName: data.fullName }));
            return { ok: true };
        } catch (err: unknown) {
            const m = err instanceof Error ? err.message : "Signup failed";
            if (m.includes("email-already-in-use")) return { ok: false, error: "This email is already registered." };
            if (m.includes("weak-password")) return { ok: false, error: "Password must be at least 6 characters." };
            if (m.includes("invalid-email")) return { ok: false, error: "Please enter a valid email." };
            return { ok: false, error: m };
        }
    }, [toLocal]);

    const firebaseEmailLogin = useCallback(async (email: string, password: string) => {
        try {
            const cred = await signInWithEmailAndPassword(auth, email, password);
            const check = checkDeleted(cred.user.uid);
            if (check.isDeleted) {
                // Sign out immediately if deleted
                await firebaseSignOut(auth);
                return { ok: false, isDeleted: true, uid: cred.user.uid, error: "Account deleted." };
            }
            setCurrentUser(toLocal({ uid: cred.user.uid, email: cred.user.email, displayName: cred.user.displayName }));
            return { ok: true };
        } catch (err: unknown) {
            const m = err instanceof Error ? err.message : "Login failed";
            if (m.includes("invalid-credential") || m.includes("wrong-password") || m.includes("user-not-found"))
                return { ok: false, error: "Invalid email or password." };
            return { ok: false, error: m };
        }
    }, [toLocal, checkDeleted]);

    const googleLogin = useCallback(async () => {
        try {
            const provider = new GoogleAuthProvider();
            provider.addScope("https://www.googleapis.com/auth/drive.file");
            const result = await signInWithPopup(auth, provider);
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential?.accessToken;
            if (token) setGoogleAccessToken(token);

            const check = checkDeleted(result.user.uid);
            if (check.isDeleted) {
                await firebaseSignOut(auth);
                return { ok: false, isDeleted: true, uid: result.user.uid, error: "Account deleted." };
            }
            setCurrentUser(toLocal({ uid: result.user.uid, email: result.user.email, displayName: result.user.displayName }));
            return { ok: true };
        } catch (err: unknown) {
            const m = err instanceof Error ? err.message : "Google sign-in failed";
            if (m.includes("popup-closed-by-user")) return { ok: false, error: "Sign-in popup was closed." };
            return { ok: false, error: m };
        }
    }, [toLocal, checkDeleted]);

    const logout = useCallback(() => {
        firebaseSignOut(auth).catch(() => { });
        setCurrentUser(null);
        setGoogleAccessToken(null);
    }, []);

    const deleteAccount = useCallback(() => {
        if (!currentUser) return;
        setDeletedUsers(prev => ({ ...prev, [currentUser.id]: new Date().toISOString() }));
        logout();
    }, [currentUser, logout]);

    const restoreAccount = useCallback((uid: string) => {
        setDeletedUsers(prev => {
            const next = { ...prev };
            delete next[uid];
            return next;
        });
    }, []);

    const updateUserProfile = useCallback((data: { fullName?: string; profileImage?: string }) => {
        setCurrentUser(prev => prev ? { ...prev, ...data } : null);
    }, []);

    const sendPasswordReset = useCallback(async (email: string) => {
        try {
            await sendPasswordResetEmail(auth, email);
            return { ok: true };
        } catch (err: unknown) {
            const m = err instanceof Error ? err.message : "Reset failed";
            if (m.includes("user-not-found")) return { ok: false, error: "No user found with this email." };
            return { ok: false, error: m };
        }
    }, []);

    const backupToDrive = useCallback(async () => {
        try {
            let token = googleAccessToken;
            if (!token) {
                const provider = new GoogleAuthProvider();
                provider.addScope("https://www.googleapis.com/auth/drive.file");
                const result = await signInWithPopup(auth, provider);
                const credential = GoogleAuthProvider.credentialFromResult(result);
                token = credential?.accessToken || null;
                if (token) setGoogleAccessToken(token);
            }
            if (!token) return { ok: false, error: "Failed to get access token." };

            const backupData = {
                customers,
                payments,
                deletedUsers,
                settings: { currentUser, backupFrequency }
            };
            const fileContent = JSON.stringify(backupData, null, 2);
            const FOLDER_NAME = "Cable Pro Backup";
            const FILE_NAME = "cablepro_backup.json";

            // 1. Get/Create Folder
            let folderId = "";
            const folderListRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const folderListData = await folderListRes.json();

            if (folderListData.files?.length > 0) {
                folderId = folderListData.files[0].id;
            } else {
                const folderCreateRes = await fetch("https://www.googleapis.com/drive/v3/files", {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                    body: JSON.stringify({ name: FOLDER_NAME, mimeType: "application/vnd.google-apps.folder" })
                });
                const folderCreateData = await folderCreateRes.json();
                folderId = folderCreateData.id;
            }

            // 2. Find existing file in folder
            const fileListRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${FILE_NAME}' and '${folderId}' in parents and trashed=false`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const fileListData = await fileListRes.json();
            const existingFile = fileListData.files?.[0];

            let url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";
            let method = "POST";

            const metadata = { name: FILE_NAME, parents: [folderId] };
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', new Blob([fileContent], { type: 'application/json' }));

            if (existingFile) {
                url = `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`;
                method = "PATCH";
            }

            const uploadRes = await fetch(url, {
                method,
                headers: { Authorization: `Bearer ${token}` },
                body: existingFile ? fileContent : form
            });

            if (!uploadRes.ok) throw new Error(await uploadRes.text());

            const now = Date.now();
            lastBackupTime.current = now;
            save(uKey(currentUser?.id || "anon", "last_backup"), now);
            setShowBackupReminder(false);
            return { ok: true };
        } catch (err: unknown) {
            console.error("Backup Error:", err);
            return { ok: false, error: err instanceof Error ? err.message : "Backup failed" };
        }
    }, [customers, payments, currentUser, deletedUsers, backupFrequency]);

    const restoreFromDrive = useCallback(async () => {
        try {
            let token = googleAccessToken;
            if (!token) {
                const provider = new GoogleAuthProvider();
                provider.addScope("https://www.googleapis.com/auth/drive.file");
                const result = await signInWithPopup(auth, provider);
                const credential = GoogleAuthProvider.credentialFromResult(result);
                token = credential?.accessToken || null;
                if (token) setGoogleAccessToken(token);
            }
            if (!token) return { ok: false, error: "Failed to get access token." };

            const FOLDER_NAME = "Cable Pro Backup";
            const FILE_NAME = "cablepro_backup.json";

            // 1. Find Folder
            const fRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const fData = await fRes.json();
            if (!fData.files?.length) return { ok: false, error: "Backup folder not found" };
            const folderId = fData.files[0].id;

            // 2. Find File
            const sRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${FILE_NAME}' and '${folderId}' in parents and trashed=false`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const sJson = await sRes.json();
            const file = sJson.files?.[0];

            if (!file) return { ok: false, error: "No backup found in 'Cable Pro Backup' folder." };

            const downloadRes = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await downloadRes.json();

            if (data.customers) setCustomers(data.customers);
            if (data.payments) setPayments(data.payments);
            if (data.deletedUsers) setDeletedUsers(data.deletedUsers);
            if (data.settings?.currentUser) updateUserProfile(data.settings.currentUser);

            const now = Date.now();
            lastBackupTime.current = now;
            save(uKey(currentUser?.id || "anon", "last_backup"), now);
            setShowBackupReminder(false);

            return { ok: true, count: data.customers?.length || 0 };
        } catch (err: unknown) {
            return { ok: false, error: err instanceof Error ? err.message : "Restore failed" };
        }
    }, [currentUser, updateUserProfile]);

    /* ── customer validation ── */
    const validateCustomer = useCallback((c: Partial<Customer>, idToExclude?: string) => {
        if (!c.name?.trim()) throw new Error("Customer Name is required.");

        // Mobile (10 digits, numeric, unique)
        if (!c.phone?.trim()) throw new Error("Mobile Number is required.");
        const cleanPhone = c.phone.replace(/\s+/g, "").replace("+91", "");
        if (!/^\d{10}$/.test(cleanPhone)) throw new Error("Mobile Number must be exactly 10 digits.");

        if (customers.some(cust => {
            const existingClean = cust.phone.replace(/\s+/g, "").replace("+91", "");
            return existingClean === cleanPhone && cust.id !== idToExclude;
        })) {
            throw new Error("Mobile Number already exists for another customer.");
        }

        // STB (numeric, unique)
        if (!c.stbNumber?.trim()) throw new Error("STB Number is required.");
        if (!/^\d+$/.test(c.stbNumber)) throw new Error("STB Number must be numeric only.");
        if (customers.some(cust => cust.stbNumber === c.stbNumber && cust.id !== idToExclude)) {
            throw new Error("STB Number already exists for another customer.");
        }
    }, [customers]);

    /* ── customers ── */
    const addCustomer = useCallback((c: Omit<Customer, "id" | "createdAt">) => {
        validateCustomer(c);
        const n: Customer = { ...c, id: genId(), createdAt: new Date().toISOString().slice(0, 10) };
        setCustomers(prev => [n, ...prev]); return n;
    }, [validateCustomer]);

    const importCustomers = useCallback((data: Customer[]) => {
        let count = 0;
        setCustomers(prev => {
            const newCusts = [...prev];
            data.forEach(c => {
                const customer = { ...c, id: c.id || genId() };
                if (!newCusts.find(existing => existing.id === customer.id)) {
                    newCusts.push(customer);
                    count++;
                }
            });
            return newCusts;
        });
        return { count };
    }, []);
    const updateCustomer = useCallback((id: string, d: Partial<Customer>) => {
        const existing = customers.find(c => c.id === id);
        if (existing) {
            validateCustomer({ ...existing, ...d }, id);
        }
        setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...d } : c));
    }, [customers, validateCustomer]);
    const deleteCustomer = useCallback((id: string) => {
        setCustomers(prev => prev.map(c =>
            c.id === id
                ? { ...c, name: "Deleted Customer", phone: "", address: "", stbNumber: "", isDeleted: true, deletedAt: new Date().toISOString() }
                : c
        ));
        setPayments(prev => prev.map(p =>
            p.customerId === id
                ? { ...p, customerName: "Deleted Customer" }
                : p
        ));
    }, []);
    const getCustomer = useCallback((id: string) => customers.find(c => c.id === id), [customers]);

    /* ── payments ── */
    const addPayment = useCallback((p: Omit<Payment, "id" | "createdAt">) => {
        const n: Payment = { ...p, id: genId(), createdAt: new Date().toISOString() };
        setPayments(prev => [n, ...prev]); return n;
    }, []);
    const updatePayment = useCallback((id: string, d: Partial<Payment>) => { setPayments(prev => prev.map(p => p.id === id ? { ...p, ...d } : p)); }, []);
    const getPaymentsForCustomer = useCallback((cid: string) => payments.filter(p => p.customerId === cid), [payments]);

    /* ── computed ── */
    const totalCustomers = customers.filter(c => !c.isDeleted).length;
    const activeCustomers = customers.filter(c => c.status === "Active" && !c.isDeleted).length;
    const currentMonth = new Date().toISOString().slice(0, 7);
    const paidThisMonth = new Set(payments.filter(p => p.status === "Confirmed" && p.paymentDate.startsWith(currentMonth)).map(p => p.customerId));
    const nonDeletedIds = new Set(customers.filter(c => !c.isDeleted).map(c => c.id));
    const totalPaidCustomers = Array.from(paidThisMonth).filter(cid => nonDeletedIds.has(cid)).length;

    // Check if a customer is covered by their plan (planDuration months from last payment)
    const isCustomerCovered = (c: typeof customers[0]) => {
        // Deactive customers don't owe — they're not using services
        if (c.status !== "Active") return true;
        const custPayments = payments
            .filter(p => p.customerId === c.id && p.status === "Confirmed")
            .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));
        if (custPayments.length === 0) return false;
        const lastPayDate = new Date(custPayments[0].paymentDate);
        const duration = c.planDuration || 1;
        const coverageEnd = new Date(lastPayDate.getFullYear(), lastPayDate.getMonth() + duration, lastPayDate.getDate());
        const now = new Date();
        return now < coverageEnd;
    };

    const totalOutstanding = customers.filter(c => c.status === "Active" && !c.isDeleted && !isCustomerCovered(c)).reduce((s, c) => s + c.monthlyRate, 0);
    const today = new Date().toISOString().slice(0, 10);
    const todayCollection = payments.filter(p => p.paymentDate === today && p.status === "Confirmed").reduce((s, p) => s + p.amount, 0);
    const thisMonthCollection = payments.filter(p => p.paymentDate.startsWith(currentMonth) && p.status === "Confirmed").reduce((s, p) => s + p.amount, 0);

    const recentActivity = payments.slice(0, 5).map(p => {
        const mins = Math.floor((Date.now() - new Date(p.createdAt).getTime()) / 60000);
        const timeStr = mins < 60 ? `${mins}m ago` : mins < 1440 ? `${Math.floor(mins / 60)}h ago` : `${Math.floor(mins / 1440)}d ago`;
        return {
            title: p.status === "Cancelled" ? "Payment Cancelled" : "Payment Received",
            subtitle: `${p.customerName} • ₹${p.amount} via ${p.paymentMethod}`,
            time: timeStr,
            icon: p.status === "Cancelled" ? "cancel" : "receipt_long",
            iconBg: p.status === "Cancelled" ? "bg-danger/10" : "bg-success/10",
            iconColor: p.status === "Cancelled" ? "text-danger" : "text-success",
            customerId: p.customerId,
        };
    });

    /* ── CSV export ── */
    const exportCustomersCSV = useCallback(() => {
        const h = "ID,Name,Phone,Address,STB Number,Package,Plan Price,Status,Connection Date\n";
        const r = customers.map(c => `"${c.id}","${c.name}","${c.phone}","${c.address}","${c.stbNumber}","${c.packageName}",${c.monthlyRate},"${c.status}","${c.connectionDate}"`).join("\n");
        dl(h + r, "cablepro_customers.csv");
    }, [customers]);
    const exportPaymentsCSV = useCallback(() => {
        const h = "Customer,Amount,Date,Method,Billing Period,Status\n";
        const r = payments.map(p => `"${p.customerName}",${p.amount},"${p.paymentDate}","${p.paymentMethod}","${p.billingPeriod}","${p.status}"`).join("\n");
        dl(h + r, "cablepro_payments.csv");
    }, [payments]);

    const toggleTheme = useCallback(() => {
        setTheme(prev => {
            const next = prev === "light" ? "dark" : "light";
            save("cablepro_theme", next);
            if (typeof document !== "undefined") {
                if (next === "dark") document.documentElement.classList.add("dark");
                else document.documentElement.classList.remove("dark");
            }
            return next;
        });
    }, []);

    /* Loading screen removed to fix hydration mismatch */

    return (
        <StoreContext.Provider value={{
            currentUser, login, signup, firebaseEmailSignup, firebaseEmailLogin, googleLogin, logout,
            customers, addCustomer, updateCustomer, deleteCustomer, getCustomer, importCustomers,
            payments, addPayment, updatePayment, getPaymentsForCustomer,
            totalCustomers, activeCustomers, totalPaidCustomers, totalOutstanding, todayCollection, thisMonthCollection,
            recentActivity, exportCustomersCSV, exportPaymentsCSV, deleteAccount, restoreAccount, updateUserProfile,
            sendPasswordReset, backupToDrive, restoreFromDrive, theme, toggleTheme, hydrated,
            backupFrequency, setBackupFrequency, showBackupReminder, setShowBackupReminder, googleAccessToken
        }}>
            {children}
        </StoreContext.Provider>
    );
}

function dl(content: string, filename: string) {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
}
