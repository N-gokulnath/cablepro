"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";



export default function NewPaymentPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { customers, addPayment, getCustomer, payments } = useStore();

    const preselectedId = searchParams.get("customerId") || "";
    const [selectedCustomerId, setSelectedCustomerId] = useState(preselectedId);
    const [customerSearch, setCustomerSearch] = useState("");
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [amount, setAmount] = useState("");
    const [method, setMethod] = useState<"Cash" | "UPI">("Cash");
    const [billingPeriod, setBillingPeriod] = useState(() => {
        const d = new Date();
        return `${d.toLocaleString("en", { month: "long" })} ${d.getFullYear()}`;
    });
    const [notes, setNotes] = useState("");
    const [whatsapp, setWhatsapp] = useState(true);
    const [sms, setSms] = useState(false);
    const [error, setError] = useState("");

    // Success state
    const [savedPayment, setSavedPayment] = useState<{ customerName: string; amount: number } | null>(null);

    const selectedCustomer = selectedCustomerId ? getCustomer(selectedCustomerId) : null;

    // Auto-fill amount with customer's plan price
    useEffect(() => {
        if (selectedCustomer) setAmount(selectedCustomer.monthlyRate.toString());
    }, [selectedCustomer]);

    const filteredCustomers = useMemo(() => {
        if (!customerSearch.trim()) return customers.filter(c => c.status === "Active" && !c.isDeleted);
        const s = customerSearch.toLowerCase();
        return customers.filter(c =>
            c.status === "Active" && !c.isDeleted && (c.name.toLowerCase().includes(s) || c.phone.includes(s) || c.stbNumber.includes(s))
        );
    }, [customers, customerSearch]);

    // outstanding for selected customer — respects planDuration
    const currentMonth = new Date().toISOString().slice(0, 7);
    const selectedOutstanding = useMemo(() => {
        if (!selectedCustomer || selectedCustomer.status !== "Active") return 0;
        const custPayments = payments
            .filter(p => p.customerId === selectedCustomer.id && p.status === "Confirmed")
            .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));
        if (custPayments.length === 0) return selectedCustomer.monthlyRate;
        const lastPayDate = new Date(custPayments[0].paymentDate);
        const duration = selectedCustomer.planDuration || 1;
        const coverageEnd = new Date(lastPayDate.getFullYear(), lastPayDate.getMonth() + duration, lastPayDate.getDate());
        return new Date() < coverageEnd ? 0 : selectedCustomer.monthlyRate;
    }, [selectedCustomer, payments, currentMonth]);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!selectedCustomerId) { setError("Please select a customer"); return; }
        if (!amount || Number(amount) <= 0) { setError("Please enter a valid amount"); return; }
        const customer = getCustomer(selectedCustomerId);
        if (!customer) { setError("Customer not found"); return; }
        if (customer.status !== "Active") { setError("Cannot record payment for deactive customer"); return; }

        // Block duplicate payment if customer's billing cycle is still covered
        const custPayments = payments
            .filter(p => p.customerId === customer.id && p.status === "Confirmed")
            .sort((a, b) => b.billingPeriod.localeCompare(a.billingPeriod));
        if (custPayments.length > 0) {
            const duration = customer.planDuration || 1;
            // Parse billing period (e.g. "February 2026") to get cycle start
            const lastBillingPeriod = custPayments[0].billingPeriod;
            const billingStart = new Date(lastBillingPeriod + " 1"); // "February 2026 1" → Feb 1, 2026
            if (!isNaN(billingStart.getTime())) {
                const coverageEnd = new Date(billingStart.getFullYear(), billingStart.getMonth() + duration, 1);
                if (new Date() < coverageEnd) {
                    const endStr = coverageEnd.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
                    setError(`This customer's ${duration}-month plan is active until ${endStr}. Next payment can be recorded from that date.`);
                    return;
                }
            }
        }

        const payment = addPayment({
            customerId: selectedCustomerId,
            customerName: customer.name,
            amount: Number(amount),
            paymentDate: new Date().toISOString().slice(0, 10),
            paymentMethod: method,
            billingPeriod,
            status: "Confirmed",
            notes,
        });
        setSavedPayment({ customerName: customer.name, amount: payment.amount });
    };

    if (savedPayment) {
        return (
            <div className="max-w-md mx-auto flex flex-col items-center justify-center min-h-[60vh] gap-6">
                <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-success text-[48px]">check_circle</span>
                </div>
                <h2 className="text-2xl font-bold text-text-primary dark:text-white">Payment Recorded!</h2>
                <div className="bg-white dark:bg-bg-card-dark rounded-xl p-6 w-full shadow-sm border border-gray-100 dark:border-border-dark text-center space-y-2">
                    <p className="text-text-secondary dark:text-gray-400 text-sm">{savedPayment.customerName}</p>
                    <p className="text-3xl font-bold text-success">₹{savedPayment.amount.toLocaleString("en-IN")}</p>
                </div>
                <div className="flex gap-3 w-full">
                    <button onClick={() => router.push("/payments")}
                        className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm active:scale-95 transition">Done</button>
                    <button onClick={() => { setSavedPayment(null); setSelectedCustomerId(""); setAmount(""); setNotes(""); }}
                        className="flex-1 py-3 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light font-bold text-sm active:scale-95 transition">Add Another</button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto space-y-4 pb-24">
            {/* Back */}
            <button onClick={() => router.back()} className="flex items-center gap-1 text-text-secondary hover:text-primary text-sm font-medium transition">
                <span className="material-symbols-outlined text-lg">arrow_back</span> Back
            </button>

            {/* Customer Selector */}
            <div>
                <p className="text-text-primary dark:text-white text-sm font-medium pb-1.5">Select Customer *</p>
                {selectedCustomer ? (
                    <div className="flex items-center justify-between gap-4 rounded-xl bg-white dark:bg-bg-card-dark p-4 shadow-sm border border-gray-100 dark:border-border-dark">
                        <div className="flex flex-col gap-1 flex-1">
                            <p className="text-text-primary dark:text-white text-base font-bold">{selectedCustomer.name}</p>
                            <p className="text-text-secondary dark:text-gray-400 text-sm">{selectedCustomer.phone} • {selectedCustomer.packageName}</p>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                                    <span className="material-symbols-outlined text-xs">schedule</span>
                                    {selectedCustomer.planDuration || 1} {(selectedCustomer.planDuration || 1) === 1 ? "Month" : "Months"}
                                </span>
                                {selectedOutstanding > 0 && (
                                    <span className="text-orange text-xs font-semibold">Outstanding: ₹{selectedOutstanding}</span>
                                )}
                            </div>
                        </div>
                        <button onClick={() => { setSelectedCustomerId(""); setAmount(""); }}
                            className="text-text-secondary hover:text-danger transition">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                ) : (
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">search</span>
                        <input
                            className="w-full h-14 pl-12 pr-4 rounded-lg bg-white dark:bg-bg-card-dark border border-border dark:border-border-dark text-sm text-text-primary dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
                            placeholder="Search customer by name, phone, or STB..."
                            value={customerSearch}
                            onChange={e => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); }}
                            onFocus={() => setShowCustomerDropdown(true)}
                        />
                        {showCustomerDropdown && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-bg-card-dark rounded-xl shadow-lg border border-gray-200 dark:border-border-dark max-h-60 overflow-y-auto z-20">
                                {filteredCustomers.length === 0 ? (
                                    <p className="p-4 text-text-secondary text-sm text-center">No customers found</p>
                                ) : filteredCustomers.map(c => (
                                    <button key={c.id} type="button"
                                        onClick={() => { setSelectedCustomerId(c.id); setCustomerSearch(""); setShowCustomerDropdown(false); }}
                                        className="w-full text-left px-4 py-3 hover:bg-bg-light dark:hover:bg-gray-800 flex items-center gap-3 transition border-b border-gray-50 dark:border-gray-800 last:border-0">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                                            {c.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-text-primary dark:text-white">{c.name}</p>
                                            <p className="text-xs text-text-secondary dark:text-gray-400">{c.phone} • STB: {c.stbNumber}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {error && (
                <div className="bg-danger/10 text-danger text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">error</span>{error}
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
                <h3 className="text-text-primary dark:text-white text-lg font-bold pt-2">Payment Details</h3>

                {/* Amount */}
                <label className="flex flex-col w-full">
                    <p className="text-text-primary dark:text-white text-sm font-medium pb-1.5">Amount Paid *</p>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-primary dark:text-white font-medium text-base">₹</span>
                        <input
                            className="flex w-full rounded-lg text-text-primary dark:text-white bg-white dark:bg-bg-card-dark focus:outline-none focus:ring-1 focus:ring-primary border border-border dark:border-border-dark h-14 pl-8 pr-4 text-base"
                            placeholder="0.00" type="number" min="1"
                            value={amount} onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>
                </label>



                {/* Payment Method */}
                <label className="flex flex-col w-full">
                    <p className="text-text-primary dark:text-white text-sm font-medium pb-1.5">Payment Method</p>
                    <div className="relative">
                        <select value={method} onChange={(e) => setMethod(e.target.value as typeof method)}
                            className="flex w-full rounded-lg text-text-primary dark:text-white bg-white dark:bg-bg-card-dark focus:outline-none focus:ring-1 focus:ring-primary border border-border dark:border-border-dark h-14 px-4 appearance-none text-base">
                            <option value="Cash">Cash</option>
                            <option value="UPI">UPI / GPay / PhonePe</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">expand_more</span>
                    </div>
                </label>

                {/* Billing Period */}
                <label className="flex flex-col w-full">
                    <p className="text-text-primary dark:text-white text-sm font-medium pb-1.5">Billing Period</p>
                    <select value={billingPeriod} onChange={e => setBillingPeriod(e.target.value)}
                        className="flex w-full rounded-lg text-text-primary dark:text-white bg-white dark:bg-bg-card-dark focus:outline-none focus:ring-1 focus:ring-primary border border-border dark:border-border-dark h-14 px-4 appearance-none text-base">
                        {(() => {
                            const months = [];
                            const now = new Date();
                            for (let i = -1; i < 12; i++) {
                                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                                const label = `${d.toLocaleString("en", { month: "long" })} ${d.getFullYear()}`;
                                months.push(<option key={label} value={label}>{label}</option>);
                            }
                            return months;
                        })()}
                    </select>
                </label>

                {/* Notes */}
                <label className="flex flex-col w-full">
                    <p className="text-text-primary dark:text-white text-sm font-medium pb-1.5">Notes (Optional)</p>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)}
                        className="w-full rounded-lg text-text-primary dark:text-white bg-white dark:bg-bg-card-dark focus:outline-none focus:ring-1 focus:ring-primary border border-border dark:border-border-dark p-4 text-sm resize-none"
                        rows={2} placeholder="Add any notes..." />
                </label>

                {/* Receipt Options Removed directly */}
            </form>

            {/* Save Button — inline on desktop, fixed on mobile */}
            <div className="pt-4 pb-6 lg:pb-0">
                <button onClick={handleSave}
                    className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-transform uppercase tracking-wide">
                    SAVE PAYMENT
                </button>
            </div>
        </div>
    );
}
