"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";
import Modal from "@/components/Modal";

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: "grid_view" },
    { href: "/customers", label: "Customers", icon: "group" },
    { href: "/payments", label: "Payments", icon: "account_balance_wallet" },
    { href: "/reports", label: "Reports", icon: "analytics" },
    { href: "/settings", label: "Settings", icon: "settings" },
];

/* Bottom nav items (without Payments — replaced by center FAB) */
const bottomNavItems = [
    { href: "/dashboard", label: "Home", icon: "grid_view" },
    { href: "/customers", label: "Customers", icon: "people" },
    // center FAB goes here
    { href: "/reports", label: "Reports", icon: "description" },
    { href: "/settings", label: "Settings", icon: "settings" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { currentUser, logout, theme, toggleTheme, showBackupReminder, setShowBackupReminder } = useStore();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogout = () => {
        logout();
        router.push("/");
    };

    const confirmLogout = () => {
        setShowLogoutConfirm(true);
    };

    const initials = currentUser?.fullName
        ? currentUser.fullName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
        : "OP";

    return (
        <div className="flex min-h-screen bg-bg-light dark:bg-bg-dark transition-colors duration-200">
            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-bg-card-dark border-r border-border dark:border-border-dark 
          flex flex-col transform transition-transform duration-250 ease-in-out
          lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:z-auto
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
            >
                {/* Logo */}
                <div className="flex items-center gap-3 px-6 py-5 border-b border-border shrink-0">
                    <Image src="/logo.svg" alt="CablePro" width={44} height={44} className="rounded-lg" />
                    <div>
                        <h1 className="text-lg font-bold text-text-primary dark:text-white tracking-tight">CablePro</h1>
                        <p className="text-[11px] text-text-secondary dark:text-gray-400 font-medium">Management System</p>
                    </div>
                </div>

                {/* Nav Items */}
                <nav className="flex flex-col gap-1 p-3 mt-2 flex-1">
                    {navItems.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150
                  ${isActive
                                        ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-blue-300"
                                        : "text-text-secondary hover:bg-bg-light hover:text-text-primary dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                                    }`}
                            >
                                <span className="material-symbols-outlined text-xl">{item.icon}</span>
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom section */}
                <div className="shrink-0 p-4 border-t border-border dark:border-border-dark bg-white dark:bg-bg-card-dark">
                    <div className="flex items-center gap-3 px-2">
                        {currentUser?.profileImage ? (
                            <img src={currentUser.profileImage} alt="Profile" className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                                {initials}
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-text-primary dark:text-white truncate">{currentUser?.fullName || "User"}</p>
                            <p className="text-xs text-text-secondary dark:text-gray-400 truncate">{currentUser?.email || ""}</p>
                        </div>
                        <button onClick={confirmLogout} title="Logout">
                            <span className="material-symbols-outlined text-text-secondary text-lg cursor-pointer hover:text-danger transition-colors">
                                logout
                            </span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Header */}
                <header className="sticky top-0 z-30 flex items-center justify-between bg-white/80 dark:bg-bg-card-dark/80 backdrop-blur-md border-b border-border dark:border-border-dark px-4 py-3 lg:px-6">
                    <div className="flex items-center gap-3">
                        <button
                            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl hover:bg-bg-light dark:hover:bg-gray-800 transition"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <span className="material-symbols-outlined text-text-primary dark:text-white">menu</span>
                        </button>
                        <h2 className="text-lg font-bold text-text-primary dark:text-white tracking-tight capitalize">
                            {pathname.split("/").pop() || "Dashboard"}
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleTheme();
                            }}
                            className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer z-50 relative"
                            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
                            aria-label="Toggle Theme"
                        >
                            <span className="material-symbols-outlined text-text-secondary dark:text-gray-400 text-2xl">
                                {theme === "light" ? "dark_mode" : "light_mode"}
                            </span>
                        </button>
                        <Link href="/settings" className="flex items-center gap-2 ml-1">
                            {currentUser?.profileImage ? (
                                <img src={currentUser.profileImage} alt="Profile" className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
                            ) : (
                                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold border border-primary/20">
                                    {initials}
                                </div>
                            )}
                        </Link>
                    </div>
                </header>

                {/* Backup Reminder Banner */}
                {showBackupReminder && (
                    <div className="bg-primary/10 dark:bg-primary/20 border-b border-primary/20 px-4 py-3 sm:px-6 flex items-center justify-between animate-in slide-in-from-top duration-300">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary text-xl">cloud_sync</span>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                                <p className="text-sm font-bold text-text-primary dark:text-white">Backup Reminder</p>
                                <span className="hidden sm:block text-text-secondary/40">•</span>
                                <p className="text-xs text-text-secondary dark:text-gray-400">You haven't backed up your data in over 3 days. Backup now to keep your data safe.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link
                                href="/settings"
                                onClick={() => setShowBackupReminder(false)}
                                className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-dark transition"
                            >
                                Backup Now
                            </Link>
                            <button
                                onClick={() => setShowBackupReminder(false)}
                                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-text-secondary transition"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Page Content — extra bottom padding on mobile for bottom nav */}
                <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6">
                    {children}
                </main>
            </div>

            {/* ─── Mobile Bottom Navigation Bar (matches reference) ─── */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-bg-card-dark border-t border-gray-200 dark:border-border-dark px-6 py-3 flex justify-between items-center lg:hidden"
                style={{ zIndex: 9999, paddingBottom: "max(env(safe-area-inset-bottom, 0px), 12px)" }}>
                <Link href="/dashboard"
                    className={`flex flex-col items-center gap-1 ${pathname.startsWith("/dashboard") ? "text-primary" : "text-gray-400"}`}
                    style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}>
                    <span className="material-symbols-outlined">grid_view</span>
                    <span className={`text-[10px] ${pathname.startsWith("/dashboard") ? "font-bold" : "font-medium"}`}>Home</span>
                </Link>

                <Link href="/customers"
                    className={`flex flex-col items-center gap-1 ${pathname.startsWith("/customers") ? "text-primary" : "text-gray-400"}`}
                    style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}>
                    <span className="material-symbols-outlined">group</span>
                    <span className={`text-[10px] ${pathname.startsWith("/customers") ? "font-bold" : "font-medium"}`}>Customers</span>
                </Link>

                <div className="-mt-12">
                    <Link href="/payments/new"
                        className="flex w-14 h-14 items-center justify-center rounded-full bg-primary text-white shadow-lg border-4 border-bg-light dark:border-bg-dark"
                        style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}>
                        <span className="material-symbols-outlined text-3xl">add</span>
                    </Link>
                </div>

                <Link href="/reports"
                    className={`flex flex-col items-center gap-1 ${pathname.startsWith("/reports") ? "text-primary" : "text-gray-400"}`}
                    style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}>
                    <span className="material-symbols-outlined">description</span>
                    <span className={`text-[10px] ${pathname.startsWith("/reports") ? "font-bold" : "font-medium"}`}>Reports</span>
                </Link>

                <Link href="/settings"
                    className={`flex flex-col items-center gap-1 ${pathname.startsWith("/settings") ? "text-primary" : "text-gray-400"}`}
                    style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}>
                    <span className="material-symbols-outlined">settings</span>
                    <span className={`text-[10px] ${pathname.startsWith("/settings") ? "font-bold" : "font-medium"}`}>Settings</span>
                </Link>
            </nav>

            <Modal isOpen={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)} title="Confirm Logout">
                <p className="text-text-secondary mb-6">Are you sure you want to log out?</p>
                <div className="flex justify-end gap-3">
                    <button onClick={() => setShowLogoutConfirm(false)} className="px-4 py-2 rounded-lg text-text-secondary font-semibold hover:bg-gray-100">Cancel</button>
                    <button onClick={handleLogout} className="px-4 py-2 rounded-lg bg-primary text-white font-bold shadow-sm hover:bg-primary-dark">Log Out</button>
                </div>
            </Modal>
        </div>
    );
}
