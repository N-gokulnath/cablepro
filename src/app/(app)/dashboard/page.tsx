"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
    PieChart, Pie, Cell,
} from "recharts";
import { useMemo, useCallback } from "react";

export default function DashboardPage() {
    const router = useRouter();
    const {
        totalCustomers, activeCustomers, totalPaidCustomers, totalOutstanding, todayCollection,
        thisMonthCollection, payments, recentActivity, currentUser, customers, theme,
    } = useStore();

    // Build chart data from real payments
    const chartData = useMemo(() => {
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const weekData = days.map(d => ({ name: d, amount: 0 }));
        const now = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().slice(0, 10);
            const dayIndex = d.getDay();
            weekData[dayIndex].amount += payments
                .filter(p => p.paymentDate === dateStr && p.status === "Confirmed")
                .reduce((s, p) => s + p.amount, 0);
        }
        return weekData;
    }, [payments]);

    // Pie data — only Cash & UPI (Net Banking removed)
    const pieData = useMemo(() => {
        const allowedMethods = ["Cash", "UPI"];
        const methods: Record<string, number> = {};
        payments.filter(p => p.status === "Confirmed").forEach(p => {
            if (allowedMethods.includes(p.paymentMethod)) {
                methods[p.paymentMethod] = (methods[p.paymentMethod] || 0) + p.amount;
            }
        });
        return Object.entries(methods).map(([name, value]) => ({ name, value }));
    }, [payments]);
    const PIE_COLORS: Record<string, string> = { Cash: "#14b8a6", UPI: "#404fb5" };

    // Clickable KPI cards with links
    const stats = [
        { label: "Total Customers", value: totalCustomers.toString(), icon: "groups", color: "text-primary", href: "/customers?filter=All" },
        { label: "Active", value: activeCustomers.toString(), icon: "check_circle", color: "text-success", href: "/customers?filter=Active" },
        { label: "Outstanding", value: `₹${totalOutstanding.toLocaleString("en-IN")}`, icon: "pending_actions", color: "text-orange", href: "/customers?filter=Overdue" },
        { label: "Total Paid", value: totalPaidCustomers.toString(), icon: "payments", color: "text-primary", href: "/customers?filter=Paid" },
    ];

    const greeting = (() => {
        const h = new Date().getHours();
        if (h < 12) return "Good morning";
        if (h < 17) return "Good afternoon";
        return "Good evening";
    })();

    // PDF Export
    const handleExportPDF = useCallback(() => {
        const monthLabel = new Date().toLocaleString("en", { month: "long", year: "numeric" });
        const currentMonth = new Date().toISOString().slice(0, 7);
        const confirmed = payments.filter(p => p.status === "Confirmed" && p.paymentDate.startsWith(currentMonth));
        const totalAmount = confirmed.reduce((s, p) => s + p.amount, 0);
        const methodTotals: Record<string, number> = {};
        confirmed.forEach(p => { methodTotals[p.paymentMethod] = (methodTotals[p.paymentMethod] || 0) + p.amount; });

        const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>CablePro Report - ${monthLabel}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #1a1a2e; background: #fff; }
  .header { text-align: center; margin-bottom: 32px; border-bottom: 3px solid #404fb5; padding-bottom: 20px; }
  .header h1 { font-size: 28px; color: #404fb5; margin-bottom: 4px; }
  .header p { font-size: 14px; color: #6a6d81; }
  .kpi-row { display: flex; gap: 16px; margin-bottom: 28px; }
  .kpi { flex: 1; background: #f5f6fa; border-radius: 12px; padding: 20px; text-align: center; }
  .kpi .value { font-size: 26px; font-weight: 800; color: #404fb5; }
  .kpi .label { font-size: 12px; color: #6a6d81; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
  .section { margin-bottom: 24px; }
  .section h2 { font-size: 16px; font-weight: 700; margin-bottom: 12px; color: #1a1a2e; border-bottom: 1px solid #eee; padding-bottom: 6px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #404fb5; color: white; padding: 10px 12px; text-align: left; }
  td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; }
  tr:nth-child(even) td { background: #fafbfc; }
  .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 16px; }
  .method-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
  .method-label { font-weight: 600; }
  .method-amount { color: #404fb5; font-weight: 700; }
</style></head><body>
  <div class="header"><h1>CablePro</h1><p>Payment Overview Report — ${monthLabel}</p></div>
  <div class="kpi-row">
    <div class="kpi"><div class="value">₹${totalAmount.toLocaleString("en-IN")}</div><div class="label">Total Collection</div></div>
    <div class="kpi"><div class="value">${confirmed.length}</div><div class="label">Total Payments</div></div>
    <div class="kpi"><div class="value">${customers.filter(c => c.status === "Active").length}</div><div class="label">Active Customers</div></div>
  </div>
  <div class="section"><h2>By Payment Method</h2>
    ${Object.entries(methodTotals).map(([m, a]) => `<div class="method-row"><span class="method-label">${m}</span><span class="method-amount">₹${a.toLocaleString("en-IN")}</span></div>`).join("")}
  </div>
    <div class="section"><h2>Payment Transactions</h2>
      <table><thead><tr><th>Customer</th><th>Date</th><th>Method</th><th>Amount</th></tr></thead><tbody>
        ${confirmed.sort((a, b) => b.paymentDate.localeCompare(a.paymentDate)).map(p =>
            `<tr><td>${p.customerName}</td><td>${new Date(p.paymentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td><td>${p.paymentMethod}</td><td>₹${p.amount.toLocaleString("en-IN")}</td></tr>`
        ).join("")}
      </tbody></table>
    </div>
  <div class="footer">Generated on ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })} — CablePro</div>
</body></html>`;

        const w = window.open("", "_blank");
        if (w) { w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 400); }
    }, [payments, customers]);

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Greeting */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary dark:text-white tracking-tight">
                        {greeting}, {currentUser?.fullName?.split(" ")[0] || "User"}
                    </h1>
                    <p className="text-text-secondary dark:text-gray-400 text-sm mt-0.5">Here&apos;s your business overview for today</p>
                </div>
                <div className="flex gap-2">
                    <span className="text-text-secondary dark:text-gray-400 text-xs font-medium bg-white dark:bg-bg-card-dark border border-border dark:border-border-dark px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm">calendar_today</span>
                        {new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                </div>
            </div>

            {/* Stats Grid — clickable cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {stats.map((stat, i) => (
                    <Link
                        key={i}
                        href={stat.href}
                        className="flex flex-col gap-1 rounded-xl p-4 bg-white dark:bg-bg-card-dark border border-gray-100 dark:border-border-dark shadow-sm hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98]"
                    >
                        <div className="flex justify-between items-start">
                            <span className={`material-symbols-outlined ${stat.color}`}>{stat.icon}</span>
                            <span className="material-symbols-outlined text-gray-300 text-lg">chevron_right</span>
                        </div>
                        <p className="text-text-secondary dark:text-gray-400 text-xs font-medium uppercase tracking-wider mt-2">
                            {stat.label}
                        </p>
                        <p className="text-text-primary dark:text-white text-2xl font-bold">{stat.value}</p>
                    </Link>
                ))}
            </div>

            {/* Quick Actions */}
            <div>
                <h3 className="text-text-primary dark:text-white text-lg font-bold mb-3">Quick Actions</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Link
                        href="/customers?action=add"
                        className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-border-dark bg-white dark:bg-bg-card-dark p-4 hover:shadow-md transition-all active:scale-95"
                    >
                        <div className="flex w-10 h-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <span className="material-symbols-outlined">person_add</span>
                        </div>
                        <h2 className="text-text-primary dark:text-white text-sm font-bold">Add Customer</h2>
                    </Link>
                    <Link
                        href="/payments/new"
                        className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-border-dark bg-white dark:bg-bg-card-dark p-4 hover:shadow-md transition-all active:scale-95"
                    >
                        <div className="flex w-10 h-10 items-center justify-center rounded-lg bg-green-100 text-success">
                            <span className="material-symbols-outlined">currency_rupee</span>
                        </div>
                        <h2 className="text-text-primary dark:text-white text-sm font-bold">Payment</h2>
                    </Link>
                    <Link
                        href="/reports"
                        className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-border-dark bg-white dark:bg-bg-card-dark p-4 hover:shadow-md transition-all active:scale-95"
                    >
                        <div className="flex w-10 h-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                            <span className="material-symbols-outlined">description</span>
                        </div>
                        <h2 className="text-text-primary dark:text-white text-sm font-bold">Reports</h2>
                    </Link>
                    <button
                        onClick={handleExportPDF}
                        className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-border-dark bg-white dark:bg-bg-card-dark p-4 hover:shadow-md transition-all active:scale-95"
                    >
                        <div className="flex w-10 h-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                            <span className="material-symbols-outlined">picture_as_pdf</span>
                        </div>
                        <h2 className="text-text-primary dark:text-white text-sm font-bold">Export PDF</h2>
                    </button>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Collection Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-bg-card-dark rounded-xl border border-gray-100 dark:border-border-dark shadow-sm p-5">
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-text-primary dark:text-white text-base font-bold">Weekly Collection</p>
                        <p className="text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-lg">
                            Total: ₹{thisMonthCollection.toLocaleString("en-IN")}
                        </p>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={chartData} barSize={28}>
                            <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#374151" : "#f0f0f0"} vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 12, fill: theme === "dark" ? "#9ca3af" : "#6a6d81" }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 12, fill: theme === "dark" ? "#9ca3af" : "#6a6d81" }} axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={{
                                    background: theme === "dark" ? "#1f2937" : "#fff",
                                    border: `1px solid ${theme === "dark" ? "#374151" : "#dddee3"}`,
                                    borderRadius: "8px",
                                    fontSize: "13px",
                                    color: theme === "dark" ? "#fff" : "#000"
                                }}
                                labelStyle={{ fontWeight: 700, color: theme === "dark" ? "#fff" : "#000" }}
                                formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, "Collection"]}
                                cursor={{ fill: theme === "dark" ? "#374151" : "#f4f4f5", opacity: 0.4 }}
                            />
                            <Bar dataKey="amount" fill="#404fb5" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Payment Method Pie — only Cash & UPI */}
                <div className="bg-white dark:bg-bg-card-dark rounded-xl border border-gray-100 dark:border-border-dark shadow-sm p-5">
                    <p className="text-text-primary dark:text-white text-base font-bold mb-4">Payment Methods</p>
                    {pieData.length > 0 ? (
                        <div className="flex flex-col items-center">
                            <ResponsiveContainer width="100%" height={140}>
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" stroke="none">
                                        {pieData.map((entry, i) => <Cell key={i} fill={PIE_COLORS[entry.name] || "#94a3b8"} />)}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            background: theme === "dark" ? "#1f2937" : "#fff",
                                            border: `1px solid ${theme === "dark" ? "#374151" : "#dddee3"}`,
                                            borderRadius: "8px",
                                            fontSize: "13px",
                                            color: theme === "dark" ? "#fff" : "#000"
                                        }}
                                        formatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex flex-col gap-2 w-full mt-2">
                                {pieData.map((item, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[item.name] || "#94a3b8" }} />
                                        <p className="text-xs font-bold text-text-primary dark:text-white">{item.name} (₹{item.value.toLocaleString("en-IN")})</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-text-secondary dark:text-gray-400 text-sm text-center py-8">No payment data yet</p>
                    )}
                </div>
            </div>

            {/* Recent Activity — clickable, links to customer detail */}
            <div>
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-text-primary dark:text-white text-lg font-bold">Recent Activity</h3>
                    <Link href="/payments" className="text-primary text-sm font-semibold hover:underline">View All</Link>
                </div>
                <div className="flex flex-col gap-3">
                    {recentActivity.length === 0 ? (
                        <p className="text-text-secondary dark:text-gray-400 text-sm text-center py-8 bg-white dark:bg-bg-card-dark rounded-xl border border-gray-100 dark:border-border-dark">No recent activity</p>
                    ) : recentActivity.map((item, i) => (
                        <Link
                            key={i}
                            href={`/customers/view?id=${item.customerId}`}
                            className="flex items-center gap-4 rounded-xl bg-white dark:bg-bg-card-dark p-4 border border-gray-100 dark:border-border-dark shadow-sm hover:shadow-md transition-shadow cursor-pointer active:scale-[0.99]"
                        >
                            <div className={`flex w-12 h-12 shrink-0 items-center justify-center rounded-full ${item.iconBg} ${item.iconColor}`}>
                                <span className="material-symbols-outlined">{item.icon}</span>
                            </div>
                            <div className="flex flex-1 flex-col min-w-0">
                                <p className="text-text-primary dark:text-white text-sm font-bold truncate">{item.title}</p>
                                <p className="text-text-secondary dark:text-gray-400 text-xs truncate">{item.subtitle}</p>
                            </div>
                            <div className="text-right shrink-0 flex items-center gap-2">
                                <p className="text-gray-400 text-[10px] font-medium uppercase">{item.time}</p>
                                <span className="material-symbols-outlined text-gray-300 text-lg">chevron_right</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
