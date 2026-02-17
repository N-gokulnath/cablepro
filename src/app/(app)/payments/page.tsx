"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";

const methodFilters = ["All", "Cash", "UPI"];

export default function PaymentsPage() {
    const { payments, updatePayment } = useStore();
    const [methodFilter, setMethodFilter] = useState("All");
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        let list = methodFilter === "All"
            ? payments
            : payments.filter(p => p.paymentMethod === methodFilter);
        if (search.trim()) {
            const s = search.toLowerCase();
            list = list.filter(p =>
                p.customerName.toLowerCase().includes(s)
            );
        }
        return list.sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));
    }, [payments, methodFilter, search]);

    const today = new Date().toISOString().slice(0, 10);
    const currentMonth = new Date().toISOString().slice(0, 7);

    const todayTotal = payments.filter(p => p.paymentDate === today && p.status === "Confirmed").reduce((s, p) => s + p.amount, 0);
    const todayCount = payments.filter(p => p.paymentDate === today && p.status === "Confirmed").length;
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const weekStr = weekAgo.toISOString().slice(0, 10);
    const weekTotal = payments.filter(p => p.paymentDate >= weekStr && p.status === "Confirmed").reduce((s, p) => s + p.amount, 0);
    const weekCount = payments.filter(p => p.paymentDate >= weekStr && p.status === "Confirmed").length;
    const monthTotal = payments.filter(p => p.paymentDate.startsWith(currentMonth) && p.status === "Confirmed").reduce((s, p) => s + p.amount, 0);
    const monthCount = payments.filter(p => p.paymentDate.startsWith(currentMonth) && p.status === "Confirmed").length;

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "Confirmed": return "text-success bg-success/10";
            case "Pending": return "text-warning bg-warning/10";
            case "Cancelled": return "text-danger bg-danger/10";
            default: return "text-gray-500 bg-gray-100";
        }
    };

    const cancelPayment = (id: string) => {
        if (confirm("Are you sure you want to cancel this payment?")) {
            updatePayment(id, { status: "Cancelled" });
        }
    };
    const confirmPayment = (id: string) => {
        updatePayment(id, { status: "Confirmed" });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-4">
            {/* Header Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white dark:bg-bg-card-dark rounded-xl p-4 border border-gray-100 dark:border-border-dark shadow-sm">
                    <p className="text-text-secondary dark:text-gray-400 text-xs font-medium uppercase tracking-wider">Today</p>
                    <p className="text-text-primary dark:text-white text-xl font-bold mt-1">₹{todayTotal.toLocaleString("en-IN")}</p>
                    <p className="text-success text-xs font-bold mt-1">{todayCount} payments</p>
                </div>
                <div className="bg-white dark:bg-bg-card-dark rounded-xl p-4 border border-gray-100 dark:border-border-dark shadow-sm">
                    <p className="text-text-secondary dark:text-gray-400 text-xs font-medium uppercase tracking-wider">This Week</p>
                    <p className="text-text-primary dark:text-white text-xl font-bold mt-1">₹{weekTotal.toLocaleString("en-IN")}</p>
                    <p className="text-primary text-xs font-bold mt-1">{weekCount} payments</p>
                </div>
                <div className="bg-white dark:bg-bg-card-dark rounded-xl p-4 border border-gray-100 dark:border-border-dark shadow-sm">
                    <p className="text-text-secondary dark:text-gray-400 text-xs font-medium uppercase tracking-wider">This Month</p>
                    <p className="text-text-primary dark:text-white text-xl font-bold mt-1">₹{monthTotal.toLocaleString("en-IN")}</p>
                    <p className="text-primary text-xs font-bold mt-1">{monthCount} payments</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary dark:text-gray-400">search</span>
                <input
                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-white dark:bg-bg-card-dark border border-gray-200 dark:border-border-dark text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all placeholder:text-text-secondary dark:placeholder:text-gray-500 dark:text-white"
                    placeholder="Search by customer..."
                    value={search} onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* Filter Chips */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {methodFilters.map((f) => (
                    <button key={f} onClick={() => setMethodFilter(f)}
                        className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all
              ${methodFilter === f ? "bg-primary text-white shadow-sm" : "bg-white dark:bg-bg-card-dark border border-gray-200 dark:border-border-dark text-text-secondary dark:text-gray-400 hover:border-primary hover:text-primary dark:hover:text-primary"}`}>
                        {f}
                    </button>
                ))}
            </div>

            {/* Payment List */}
            <div className="bg-white dark:bg-bg-card-dark rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-border-dark">
                {filtered.length === 0 ? (
                    <div className="text-center py-10 text-text-secondary dark:text-gray-400">
                        <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600">receipt_long</span>
                        <p className="mt-2 font-medium">No payments found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-bg-light dark:bg-gray-800 text-text-secondary dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                                    <th className="px-4 py-3 text-left font-semibold">Customer</th>
                                    <th className="px-4 py-3 text-left font-semibold hidden sm:table-cell">Date</th>
                                    <th className="px-4 py-3 text-left font-semibold hidden sm:table-cell">Method</th>
                                    <th className="px-4 py-3 text-right font-semibold">Amount</th>
                                    <th className="px-4 py-3 text-center font-semibold">Status</th>
                                    <th className="px-4 py-3 text-center font-semibold">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                {filtered.map((p) => (
                                    <tr key={p.id} className="hover:bg-bg-light/50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-4 py-4 font-medium text-text-primary dark:text-white">{p.customerName}</td>
                                        <td className="px-4 py-4 text-text-secondary dark:text-gray-400 hidden sm:table-cell">{p.paymentDate}</td>
                                        <td className="px-4 py-4 text-text-secondary dark:text-gray-400 hidden sm:table-cell">{p.paymentMethod}</td>
                                        <td className="px-4 py-4 text-right font-bold text-success">₹{p.amount.toLocaleString("en-IN")}</td>
                                        <td className="px-4 py-4 text-center">
                                            <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded ${getStatusStyle(p.status)}`}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            {p.status === "Pending" && (
                                                <div className="flex gap-1 justify-center">
                                                    <button onClick={() => confirmPayment(p.id)} title="Confirm"
                                                        className="w-8 h-8 rounded-lg bg-success/10 text-success hover:bg-success/20 flex items-center justify-center transition">
                                                        <span className="material-symbols-outlined text-lg">check</span>
                                                    </button>
                                                    <button onClick={() => cancelPayment(p.id)} title="Cancel"
                                                        className="w-8 h-8 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 flex items-center justify-center transition">
                                                        <span className="material-symbols-outlined text-lg">close</span>
                                                    </button>
                                                </div>
                                            )}
                                            {p.status === "Confirmed" && (
                                                <button onClick={() => cancelPayment(p.id)} title="Cancel payment"
                                                    className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-danger/10 hover:text-danger flex items-center justify-center transition mx-auto">
                                                    <span className="material-symbols-outlined text-lg">block</span>
                                                </button>
                                            )}
                                            {p.status === "Cancelled" && (
                                                <span className="text-gray-400 text-xs">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* FAB */}
            <div className="fixed bottom-24 sm:bottom-6 right-6 z-20">
                <Link href="/payments/new"
                    className="flex h-14 items-center gap-3 rounded-full bg-primary text-white py-4 px-6 shadow-xl hover:scale-105 active:scale-95 transition-transform">
                    <span className="material-symbols-outlined">add</span>
                    <span className="font-bold text-sm uppercase tracking-wide">New Payment</span>
                </Link>
            </div>
        </div>
    );
}
