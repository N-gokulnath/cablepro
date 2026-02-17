"use client";

import { useMemo, useCallback, useState } from "react";
import { useStore } from "@/lib/store";
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

export default function ReportsPage() {
    const { payments, customers, thisMonthCollection } = useStore();

    // Filter State
    const [filterType, setFilterType] = useState<"Month" | "Custom">("Month");
    const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [fromDate, setFromDate] = useState(() => {
        const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10);
    });
    const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10));

    // Filter Logic
    const filteredPayments = useMemo(() => {
        return payments.filter(p => {
            if (p.status !== "Confirmed") return false;
            if (filterType === "Month") {
                return p.paymentDate.startsWith(selectedMonth);
            } else {
                return p.paymentDate >= fromDate && p.paymentDate <= toDate;
            }
        });
    }, [payments, filterType, selectedMonth, fromDate, toDate]);

    // Trend data — daily breakdown for charts
    const trendData = useMemo(() => {
        const data: { name: string; amount: number }[] = [];
        const map = new Map<string, number>();

        // Aggregate by date
        filteredPayments.forEach(p => {
            map.set(p.paymentDate, (map.get(p.paymentDate) || 0) + p.amount);
        });

        // Fill gaps if needed, or just show days with data
        const sortedDates = Array.from(map.keys()).sort();
        if (sortedDates.length === 0) return [];

        const start = new Date(sortedDates[0]);
        const end = new Date(sortedDates[sortedDates.length - 1]);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const iso = d.toISOString().slice(0, 10);
            data.push({
                name: `${d.getDate()} ${d.toLocaleString("en", { month: "short" })}`,
                amount: map.get(iso) || 0
            });
        }
        return data;
    }, [filteredPayments]);

    // Payment methods breakdown
    const methodBreakdown = useMemo(() => {
        const methods: Record<string, number> = {};
        filteredPayments.forEach(p => {
            methods[p.paymentMethod] = (methods[p.paymentMethod] || 0) + p.amount;
        });
        const total = Object.values(methods).reduce((a, b) => a + b, 0) || 1;
        const colors: Record<string, string> = { Cash: "#14b8a6", UPI: "#404fb5" };
        return Object.entries(methods)
            .sort((a, b) => b[1] - a[1])
            .map(([label, amount]) => ({
                label,
                amount: `₹${amount.toLocaleString("en-IN")}`,
                pct: Math.round((amount / total) * 100),
                color: colors[label] || "#94a3b8",
            }));
    }, [filteredPayments]);

    // Daily breakdown table
    const dailyBreakdown = useMemo(() => {
        const days: Record<string, { transactions: number; amount: number }> = {};
        filteredPayments.forEach(p => {
            if (!days[p.paymentDate]) days[p.paymentDate] = { transactions: 0, amount: 0 };
            days[p.paymentDate].transactions++;
            days[p.paymentDate].amount += p.amount;
        });
        return Object.entries(days)
            .sort((a, b) => b[0].localeCompare(a[0]))
            .map(([date, data]) => ({
                date: new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
                dateRaw: date,
                transactions: data.transactions,
                amount: `₹${data.amount.toLocaleString("en-IN")}`,
                amountNum: data.amount,
            }));
    }, [filteredPayments]);

    // Export CSV
    const generateCSV = useCallback(() => {
        const header = "Customer,Date,Method,Amount,Billing Period,Status\n";
        const rows = filteredPayments
            .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))
            .map(p => `"${p.customerName}","${p.paymentDate}","${p.paymentMethod}",${p.amount},"${p.billingPeriod}","${p.status}"`)
            .join("\n");
        const blob = new Blob([header + rows], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `report_${filterType === "Month" ? selectedMonth : "custom"}.csv`;
        a.click();
    }, [filteredPayments, filterType, selectedMonth]);

    // ─── Generate PDF Overview ───
    const generatePDF = useCallback(() => {
        const label = filterType === "Month"
            ? new Date(selectedMonth + "-01").toLocaleString("en", { month: "long", year: "numeric" })
            : `${new Date(fromDate).toLocaleDateString("en-IN")} - ${new Date(toDate).toLocaleDateString("en-IN")}`;

        const totalAmount = filteredPayments.reduce((s, p) => s + p.amount, 0);
        const methodTotals: Record<string, number> = {};
        filteredPayments.forEach(p => {
            methodTotals[p.paymentMethod] = (methodTotals[p.paymentMethod] || 0) + p.amount;
        });

        // Build HTML content for PDF
        const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Payment Report - ${label}</title>
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
  .method-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
</style></head><body>
  <div class="header"><h1>CablePro Report</h1><p>${label}</p></div>
  <div class="kpi-row">
    <div class="kpi"><div class="value">₹${totalAmount.toLocaleString("en-IN")}</div><div class="label">Total Collection</div></div>
    <div class="kpi"><div class="value">${filteredPayments.length}</div><div class="label">Transactions</div></div>
  </div>
  <div class="section"><h2>Payment Methods</h2>
    ${Object.entries(methodTotals).map(([m, a]) => `<div class="method-row"><span>${m}</span><span style="font-weight:700;color:#404fb5">₹${a.toLocaleString("en-IN")}</span></div>`).join("")}
  </div>
  <div class="section"><h2>Transactions</h2>
    <table><thead><tr><th>Customer</th><th>Date</th><th>Method</th><th>Amount</th></tr></thead><tbody>
      ${filteredPayments.sort((a, b) => b.paymentDate.localeCompare(a.paymentDate)).map(p =>
            `<tr><td>${p.customerName}</td><td>${new Date(p.paymentDate).toLocaleDateString("en-IN")}</td><td>${p.paymentMethod}</td><td>₹${p.amount}</td></tr>`
        ).join("")}
    </tbody></table></div>
</body></html>`;
        const win = window.open("", "_blank");
        if (win) { win.document.write(html); win.document.close(); win.print(); }
    }, [filteredPayments, filterType, selectedMonth, fromDate, toDate]);

    const totalCollected = filteredPayments.reduce((s, p) => s + p.amount, 0);

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary dark:text-white">Reports</h1>
                    <p className="text-text-secondary text-sm">Financial overview & analytics</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button onClick={generateCSV} className="flex items-center gap-2 bg-white dark:bg-bg-card-dark border border-gray-200 dark:border-border-dark text-text-primary dark:text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                        <span className="material-symbols-outlined text-[20px]">csv</span> Export CSV
                    </button>
                    <button onClick={generatePDF} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg shadow-primary/30 hover:opacity-90 transition">
                        <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span> Export PDF
                    </button>
                </div>
            </div>

            {/* Filter Toolbar */}
            <div className="bg-white dark:bg-bg-card-dark rounded-xl p-4 shadow-sm border border-gray-100 dark:border-border-dark flex flex-col md:flex-row gap-4 items-center">
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg shrink-0">
                    {["Month", "Custom"].map(t => (
                        <button key={t} onClick={() => setFilterType(t as any)}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filterType === t ? "bg-white dark:bg-bg-card-dark text-primary shadow-sm" : "text-text-secondary dark:text-gray-400 hover:text-text-primary dark:hover:text-white"}`}>
                            {t}
                        </button>
                    ))}
                </div>

                {filterType === "Month" ? (
                    <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-border dark:border-border-dark bg-white dark:bg-bg-dark text-text-primary dark:text-white focus:ring-2 focus:ring-primary/20 focus:outline-none dark:[color-scheme:dark]" />
                ) : (
                    <div className="flex items-center gap-2">
                        <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                            className="px-4 py-2 rounded-lg border border-border dark:border-border-dark bg-white dark:bg-bg-dark text-text-primary dark:text-white focus:ring-2 focus:ring-primary/20 focus:outline-none dark:[color-scheme:dark]" />
                        <span className="text-text-secondary dark:text-gray-400">-</span>
                        <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                            className="px-4 py-2 rounded-lg border border-border dark:border-border-dark bg-white dark:bg-bg-dark text-text-primary dark:text-white focus:ring-2 focus:ring-primary/20 focus:outline-none dark:[color-scheme:dark]" />
                    </div>
                )}
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-bg-card-dark p-5 rounded-xl border border-gray-100 dark:border-border-dark shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-text-secondary dark:text-gray-400 text-xs uppercase font-bold tracking-wider">Total Collection</p>
                            <h3 className="text-2xl font-bold text-primary mt-1">₹{totalCollected.toLocaleString("en-IN")}</h3>
                        </div>
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <span className="material-symbols-outlined">attach_money</span>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-bg-card-dark p-5 rounded-xl border border-gray-100 dark:border-border-dark shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-text-secondary dark:text-gray-400 text-xs uppercase font-bold tracking-wider">Transactions</p>
                            <h3 className="text-2xl font-bold text-text-primary dark:text-white mt-1">{filteredPayments.length}</h3>
                        </div>
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-600">
                            <span className="material-symbols-outlined">receipt_long</span>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-bg-card-dark p-5 rounded-xl border border-gray-100 dark:border-border-dark shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-text-secondary dark:text-gray-400 text-xs uppercase font-bold tracking-wider">Avg. Transaction</p>
                            <h3 className="text-2xl font-bold text-orange mt-1">₹{filteredPayments.length ? Math.round(totalCollected / filteredPayments.length) : 0}</h3>
                        </div>
                        <div className="p-2 bg-orange/10 rounded-lg text-orange">
                            <span className="material-symbols-outlined">analytics</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-bg-card-dark p-6 rounded-xl border border-gray-100 dark:border-border-dark shadow-sm">
                    <h3 className="text-text-primary dark:text-white font-bold mb-6">Collection Trend</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorAmountClient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#404fb5" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#404fb5" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} interval="preserveStartEnd" />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                                    formatter={(val: number | undefined) => [`₹${(val || 0).toLocaleString()}`, "Collection"]}
                                />
                                <Area type="monotone" dataKey="amount" stroke="#404fb5" strokeWidth={3} fillOpacity={1} fill="url(#colorAmountClient)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-bg-card-dark p-6 rounded-xl border border-gray-100 dark:border-border-dark shadow-sm">
                    <h3 className="text-text-primary dark:text-white font-bold mb-6">Payment Methods</h3>
                    <div className="space-y-4">
                        {methodBreakdown.map((item, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-medium text-text-primary dark:text-white">{item.label}</span>
                                        <span className="text-sm font-bold text-text-primary dark:text-white">{item.amount}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${item.pct}%`, backgroundColor: item.color }} />
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-text-secondary w-8 text-right">{item.pct}%</span>
                            </div>
                        ))}
                        {methodBreakdown.length === 0 && <p className="text-text-secondary text-center py-8">No data available</p>}
                    </div>
                </div>
            </div>

            {/* Daily Breakdown Table */}
            <div className="bg-white dark:bg-bg-card-dark rounded-xl border border-gray-100 dark:border-border-dark shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 dark:border-gray-800">
                    <h3 className="text-text-primary dark:text-white font-bold">Daily Breakdown</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 dark:bg-gray-800 text-xs uppercase text-text-secondary dark:text-gray-400 font-semibold">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Transactions</th>
                                <th className="px-6 py-4 text-right">Amount Collection</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {dailyBreakdown.length === 0 ? (
                                <tr><td colSpan={3} className="px-6 py-8 text-center text-text-secondary dark:text-gray-400 text-sm">No transactions found for selected period</td></tr>
                            ) : dailyBreakdown.map((day, i) => (
                                <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors cursor-default">
                                    <td className="px-6 py-4 text-sm font-medium text-text-primary dark:text-white">{day.date}</td>
                                    <td className="px-6 py-4 text-sm text-text-secondary dark:text-gray-400">
                                        <div className="flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                                                {day.transactions}
                                            </span>
                                            payments
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-success text-right">{day.amount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
