"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import Modal from "@/components/Modal";

export default function SettingsPage() {
    const router = useRouter();
    const { currentUser, logout, customers, payments, exportCustomersCSV, importCustomers, updateUserProfile, deleteAccount, backupToDrive, restoreFromDrive, backupFrequency, setBackupFrequency } = useStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const profileImageInputRef = useRef<HTMLInputElement>(null);
    const [importStatus, setImportStatus] = useState<string | null>(null);
    const [backupStatus, setBackupStatus] = useState<string | null>(null);
    const [lastBackupDates, setLastBackupDates] = useState<string>("-"); // Placeholder for now
    const [isBackingUp, setIsBackingUp] = useState(false); // Helper, though we can use status text
    const [isRestoring, setIsRestoring] = useState(false);

    // Modals
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showEditProfile, setShowEditProfile] = useState(false);

    // Edit Profile State
    const [editName, setEditName] = useState("");
    const [editImage, setEditImage] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (currentUser) {
            setEditName(currentUser.fullName);
            setEditImage(currentUser.profileImage);
        }
    }, [currentUser]);

    const handleLogout = () => {
        logout();
        router.push("/");
    };

    const handleDeleteAccount = () => {
        deleteAccount();
        router.push("/");
    };

    const handleSaveProfile = () => {
        updateUserProfile({ fullName: editName, profileImage: editImage });
        setShowEditProfile(false);
    };

    const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 500 * 1024) { alert("Image size must be less than 500KB"); return; }
        const reader = new FileReader();
        reader.onload = (ev) => {
            if (ev.target?.result) setEditImage(ev.target.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleResetData = () => {
        if (confirm("WARNING: This will delete ALL customers, payments, and settings. This action cannot be undone. Are you sure?")) {
            localStorage.clear();
            window.location.href = "/";
        }
    };

    const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                const lines = text.split("\n").filter(l => l.trim());
                if (lines.length < 2) { setImportStatus("❌ File is empty or has no data rows."); return; }
                const header = lines[0].split(",").map(h => h.trim().toLowerCase());
                const imported = lines.slice(1).map(line => {
                    const values = line.split(",").map(v => v.trim());
                    const row: Record<string, string> = {};
                    header.forEach((h, i) => { row[h] = values[i] || ""; });
                    return row;
                });

                // Mapping logic could be improved, but assuming order or header names
                // For now, simple mapping based on header matching
                const mapped: any[] = imported.map(row => ({
                    id: row["id"] || undefined, // Keep ID if present (for restore/update)
                    name: row["name"] || row["customer"] || "",
                    phone: row["phone"] || row["mobile"] || "",
                    address: row["address"] || "Unknown",
                    stbNumber: row["stb number"] || row["stb"] || "",
                    connectionDate: row["connection date"] || new Date().toISOString().slice(0, 10),
                    packageName: row["package"] || "Basic",
                    monthlyRate: parseFloat(row["monthly rate"] || row["plan price"] || row["amount"] || "0"),
                    planDuration: 1,
                    status: (row["status"] || "Active") as any,
                    operatorId: currentUser?.id || "u2",
                    createdAt: new Date().toISOString()
                })).filter(c => c.name && c.phone); // Basic validation

                const res = importCustomers(mapped);
                setImportStatus(`✅ Successfully imported ${res.count} customers.`);
            } catch {
                setImportStatus("❌ Failed to parse CSV file.");
            }
        };
        reader.readAsText(file);
        // Reset input so same file can be selected again
        e.target.value = "";
    };

    const initials = currentUser?.fullName
        ? currentUser.fullName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
        : "OP";

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-xl font-bold text-text-primary">Settings</h2>

            {/* Profile Section */}
            <div className="bg-white dark:bg-bg-card-dark rounded-xl shadow-sm border border-gray-100 dark:border-border-dark overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50 dark:border-gray-800">
                    <h3 className="text-base font-bold text-text-primary dark:text-white">Profile</h3>
                </div>
                <div className="p-5 space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="relative group cursor-pointer" onClick={() => setShowEditProfile(true)}>
                            {currentUser?.profileImage ? (
                                <img src={currentUser.profileImage} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-primary/20" />
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold">
                                    {initials}
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="material-symbols-outlined text-white text-sm">edit</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-lg font-bold text-text-primary dark:text-white">{currentUser?.fullName || "User"}</p>
                            <p className="text-sm text-text-secondary dark:text-gray-400">{currentUser?.email || ""}</p>
                            <p className="text-xs text-primary font-semibold mt-1 capitalize">{currentUser?.role || "operator"}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Data Summary */}
            <div className="bg-white dark:bg-bg-card-dark rounded-xl shadow-sm border border-gray-100 dark:border-border-dark overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50 dark:border-gray-800">
                    <h3 className="text-base font-bold text-text-primary dark:text-white">Data Summary</h3>
                </div>
                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                    <div className="flex items-center justify-between px-5 py-4">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary">group</span>
                            <span className="text-sm font-medium text-text-primary dark:text-white">Total Customers</span>
                        </div>
                        <span className="text-sm font-bold text-text-primary dark:text-white">{customers.length}</span>
                    </div>
                    <div className="flex items-center justify-between px-5 py-4">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-success">receipt_long</span>
                            <span className="text-sm font-medium text-text-primary dark:text-white">Total Payments</span>
                        </div>
                        <span className="text-sm font-bold text-text-primary dark:text-white">{payments.length}</span>
                    </div>
                    <div className="flex items-center justify-between px-5 py-4">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-orange">storage</span>
                            <span className="text-sm font-medium text-text-primary dark:text-white">Data Storage</span>
                        </div>
                        <span className="text-sm font-bold text-text-secondary dark:text-gray-400">Local (Browser)</span>
                    </div>
                </div>
            </div>

            {/* Import / Export */}
            <div className="bg-white dark:bg-bg-card-dark rounded-xl shadow-sm border border-gray-100 dark:border-border-dark overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50 dark:border-gray-800">
                    <h3 className="text-base font-bold text-text-primary dark:text-white">Import / Export</h3>
                </div>
                <div className="p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button onClick={exportCustomersCSV}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary/10 text-primary font-bold text-sm hover:bg-primary/20 transition active:scale-[0.98]">
                            <span className="material-symbols-outlined text-lg">download</span>
                            Export Customers CSV
                        </button>
                        <button onClick={() => fileInputRef.current?.click()}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-teal/10 text-teal font-bold text-sm hover:bg-teal/20 transition active:scale-[0.98]">
                            <span className="material-symbols-outlined text-lg">upload</span>
                            Import Customers CSV
                        </button>
                        <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
                    </div>
                    {importStatus && (
                        <div className="bg-bg-light dark:bg-gray-800 rounded-lg px-4 py-3 text-sm text-text-primary dark:text-white font-medium">
                            {importStatus}
                        </div>
                    )}
                    <p className="text-text-secondary dark:text-gray-400 text-xs">Export your customer data as CSV, or import from a CSV file.</p>
                </div>
            </div>

            {/* Cloud Backup */}
            <div className="bg-white dark:bg-bg-card-dark rounded-xl shadow-sm border border-gray-100 dark:border-border-dark overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
                    <h3 className="text-base font-bold text-text-primary dark:text-white">Cloud Backup (Google Drive)</h3>
                    <span className="material-symbols-outlined text-primary">cloud_upload</span>
                </div>
                <div className="p-5 space-y-4">
                    {/* Backup Frequency Selection */}
                    <div className="flex flex-col gap-3 mb-4">
                        <label className="text-xs font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wider">Backup Frequency</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                                { id: "manual", label: "Manual" },
                                { id: "daily", label: "3 Days" },
                                { id: "weekly", label: "Weekly" },
                                { id: "monthly", label: "Monthly" }
                            ].map((freq) => (
                                <button
                                    key={freq.id}
                                    onClick={() => setBackupFrequency(freq.id as any)}
                                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border ${backupFrequency === freq.id
                                        ? "bg-primary border-primary text-white shadow-sm"
                                        : "bg-white dark:bg-bg-card-dark border-gray-200 dark:border-gray-700 text-text-secondary dark:text-gray-400 hover:border-primary/50"
                                        }`}
                                >
                                    {freq.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={async () => {
                                setBackupStatus("Backing up...");
                                const res = await backupToDrive();
                                setBackupStatus(res.ok ? "✅ Backup successful!" : `❌ Backup failed: ${res.error}`);
                                // Clear status after 3 seconds
                                setTimeout(() => setBackupStatus(null), 3000);
                            }}
                            disabled={isBackingUp || isRestoring}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold text-sm hover:bg-blue-100 dark:hover:bg-blue-900/30 transition active:scale-[0.98] disabled:opacity-60"
                        >
                            {isBackingUp ? (
                                <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                            ) : (
                                <span className="material-symbols-outlined text-lg">cloud_upload</span>
                            )}
                            Backup Now
                        </button>
                        <button
                            onClick={async () => {
                                if (!confirm("This will overwrite your current data with the backup from Drive. Are you sure?")) return;
                                setBackupStatus("Restoring...");
                                const res = await restoreFromDrive();
                                setBackupStatus(res.ok ? `✅ Restored ${res.count} customers!` : `❌ Restore failed: ${res.error}`);
                                setTimeout(() => setBackupStatus(null), 3000);
                            }}
                            disabled={isBackingUp || isRestoring}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 font-bold text-sm hover:bg-purple-100 dark:hover:bg-purple-900/30 transition active:scale-[0.98] disabled:opacity-60"
                        >
                            {isRestoring ? (
                                <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                            ) : (
                                <span className="material-symbols-outlined text-lg">cloud_download</span>
                            )}
                            Restore
                        </button>
                    </div>
                    {backupStatus && (
                        <div className={`rounded-lg px-4 py-3 text-sm font-medium ${backupStatus.includes("✅") ? "bg-green-50 text-green-700" : (backupStatus.includes("...") ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-700")}`}>
                            {backupStatus}
                        </div>
                    )}
                    <p className="text-text-secondary dark:text-gray-400 text-xs text-center">
                        Backups are saved to your Google Drive App Folder.
                    </p>
                </div>
            </div>

            {/* General Settings */}
            <div className="bg-white dark:bg-bg-card-dark rounded-xl shadow-sm border border-gray-100 dark:border-border-dark overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50 dark:border-gray-800">
                    <h3 className="text-base font-bold text-text-primary dark:text-white">General</h3>
                </div>
                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                    {[
                        { icon: "language", label: "Language", value: "English" },
                        { icon: "currency_rupee", label: "Currency", value: "INR (₹)" },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between px-5 py-4 hover:bg-bg-light dark:hover:bg-gray-800 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-text-secondary dark:text-gray-400">{item.icon}</span>
                                <span className="text-sm font-medium text-text-primary dark:text-white">{item.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-text-secondary dark:text-gray-400">{item.value}</span>
                                <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 text-sm">chevron_right</span>
                            </div>
                        </div>
                    ))
                    }
                </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-white dark:bg-bg-card-dark rounded-xl shadow-sm border border-danger/20 overflow-hidden">
                <div className="px-5 py-4 border-b border-danger/10">
                    <h3 className="text-base font-bold text-danger">Danger Zone</h3>
                </div>
                <div className="p-5 space-y-3">
                    <button onClick={() => setShowLogoutConfirm(true)}
                        className="text-text-secondary dark:text-gray-400 text-sm font-bold hover:text-danger hover:underline flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">logout</span>
                        Sign Out
                    </button>
                    <div className="pt-3 border-t border-danger/10">
                        <button onClick={() => setShowDeleteConfirm(true)}
                            className="text-danger text-sm font-bold hover:underline flex items-center gap-2 w-full">
                            <span className="material-symbols-outlined text-lg">delete_forever</span>
                            Delete Account
                        </button>
                        <p className="text-[10px] text-danger/60 mt-1 pl-7">Action is reversible within 7 days.</p>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <Modal isOpen={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)} title="Confirm Logout">
                <p className="text-text-secondary mb-6">Are you sure you want to log out?</p>
                <div className="flex justify-end gap-3">
                    <button onClick={() => setShowLogoutConfirm(false)} className="px-4 py-2 rounded-lg text-text-secondary dark:text-gray-400 font-semibold hover:bg-gray-100 dark:hover:bg-gray-800">Cancel</button>
                    <button onClick={handleLogout} className="px-4 py-2 rounded-lg bg-primary text-white font-bold shadow-sm hover:bg-primary-dark">Log Out</button>
                </div>
            </Modal>

            <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete Account">
                <div className="bg-danger/10 text-danger p-4 rounded-xl mb-4 text-sm font-medium">
                    Warning: This will mark your account for deletion. You will have 7 days to restore it by logging in again. After that, all data will be permanently lost.
                </div>
                <p className="text-text-primary text-sm mb-6">Type <strong>DELETE</strong> to confirm.</p>
                {/* Simplified for now, just a button */}
                <div className="flex justify-end gap-3">
                    <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 rounded-lg text-text-secondary dark:text-gray-400 font-semibold hover:bg-gray-100 dark:hover:bg-gray-800">Cancel</button>
                    <button onClick={handleDeleteAccount} className="px-4 py-2 rounded-lg bg-danger text-white font-bold shadow-sm hover:bg-danger-dark">Delete Account</button>
                </div>
            </Modal>

            <Modal isOpen={showEditProfile} onClose={() => setShowEditProfile(false)} title="Edit Profile">
                <div className="space-y-4">
                    <div className="flex flex-col items-center gap-3">
                        <div className="relative w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition"
                            onClick={() => profileImageInputRef.current?.click()}>
                            {editImage ? (
                                <img src={editImage} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <span className="material-symbols-outlined text-4xl text-gray-400">add_a_photo</span>
                            )}
                        </div>
                        <button onClick={() => profileImageInputRef.current?.click()} className="text-primary text-sm font-bold">Change Photo</button>
                        <input ref={profileImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleProfileImageUpload} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Full Name</label>
                        <input value={editName} onChange={e => setEditName(e.target.value)}
                            className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button onClick={() => setShowEditProfile(false)} className="px-4 py-2 rounded-lg text-text-secondary font-semibold hover:bg-gray-100">Cancel</button>
                        <button onClick={handleSaveProfile} className="px-4 py-2 rounded-lg bg-primary text-white font-bold shadow-sm hover:bg-primary-dark">Save Changes</button>
                    </div>
                </div>
            </Modal>

            <p className="text-center text-text-secondary text-xs pb-4">
                CablePro v1.0.5 | © 2026 CablePro Systems Ltd.
            </p>
        </div>
    );
}
