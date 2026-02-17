"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

export default function CustomerDetailClient() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { getCustomer, getPaymentsForCustomer, payments, customers, updateCustomer, hydrated } = useStore();

    const id = searchParams.get("id");
    const customer = id ? getCustomer(id) : undefined;

    if (!hydrated) {
        return <div className="p-8 text-center animate-pulse">Loading customer data...</div>;
    }

    if (!customer || !id || customer.isDeleted) {
        return (
            <div className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 text-6xl">person_off</span>
                <p className="text-text-primary dark:text-white text-lg font-bold">Customer not found</p>
                <Link href="/customers" className="text-primary text-sm font-semibold hover:underline">← Back to Customers</Link>
            </div>
        );
    }

    const customerPayments = getPaymentsForCustomer(id)
        .filter(p => p.status === "Confirmed")
        .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));

    const currentMonth = new Date().toISOString().slice(0, 7);
    const paidThisMonth = customerPayments.some(p => p.paymentDate.startsWith(currentMonth));

    // Outstanding respects planDuration — deactive customers never owe
    const outstanding = (() => {
        if (customer.status !== "Active") return 0;
        if (customerPayments.length === 0) return customer.monthlyRate;
        const lastPayDate = new Date(customerPayments[0].paymentDate);
        const duration = customer.planDuration || 1;
        const coverageEnd = new Date(lastPayDate.getFullYear(), lastPayDate.getMonth() + duration, lastPayDate.getDate());
        return new Date() < coverageEnd ? 0 : customer.monthlyRate;
    })();

    const lastPayment = customerPayments[0];

    const initials = customer.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

    const toggleStatus = () => {
        updateCustomer(id, { status: customer.status === "Active" ? "Deactive" : "Active" });
    };

    return (
        <div className="max-w-2xl mx-auto space-y-4">
            {/* Back */}
            <button onClick={() => router.back()} className="flex items-center gap-1 text-text-secondary dark:text-gray-400 hover:text-primary dark:hover:text-primary text-sm font-medium transition">
                <span className="material-symbols-outlined text-lg">arrow_back</span> Back
            </button>

            {/* Profile Header */}
            <div className="bg-white dark:bg-bg-card-dark rounded-xl border border-gray-100 dark:border-border-dark shadow-sm overflow-hidden">
                <div className="flex flex-col items-center gap-4 p-6">
                    <div className="relative">
                        <div className="w-[72px] h-[72px] rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold border-2 border-primary/10">
                            {initials}
                        </div>
                        <div className={`absolute bottom-0 right-0 h-4 w-4 border-2 border-white dark:border-bg-card-dark rounded-full ${customer.status === "Active" ? "bg-success" : "bg-gray-400"}`} />
                    </div>
                    <div className="text-center">
                        <p className="text-[22px] font-bold tracking-tight text-text-primary dark:text-white">{customer.name}</p>
                        <div className="mt-1 flex items-center gap-2 justify-center">
                            <span className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider inline-block
                ${customer.status === "Active" ? "bg-success/10 text-success" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"}`}>
                                {customer.status}
                            </span>
                            <button onClick={toggleStatus} className="text-xs text-primary font-semibold hover:underline">
                                {customer.status === "Active" ? "Deactive" : "Activate"}
                            </button>
                        </div>
                        <p className="text-text-secondary dark:text-gray-400 text-sm mt-1">ID: {customer.id}</p>
                    </div>
                    <div className="flex w-full gap-3">
                        <a href={`tel:${customer.phone}`} className="flex items-center justify-center gap-2 rounded-xl h-12 px-4 bg-success text-white text-sm font-bold flex-1 shadow-sm active:scale-95 transition-transform">
                            <span className="material-symbols-outlined">call</span><span>Call</span>
                        </a>
                        <a href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer"
                            className="flex items-center justify-center gap-2 rounded-xl h-12 px-4 bg-teal text-white text-sm font-bold flex-1 shadow-sm active:scale-95 transition-transform">
                            <span className="material-symbols-outlined">chat</span><span>WhatsApp</span>
                        </a>
                    </div>
                </div>
            </div>

            {/* Outstanding Balance */}
            <div className={`bg-white dark:bg-bg-card-dark rounded-xl p-5 shadow-sm border-l-4 ${outstanding > 0 ? "border-orange" : "border-success"}`}>
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-text-secondary text-sm font-medium uppercase tracking-wider">Outstanding Balance</p>
                        <p className={`text-3xl font-bold mt-1 ${outstanding > 0 ? "text-orange" : "text-success"}`}>
                            ₹{outstanding.toLocaleString("en-IN")}
                        </p>
                    </div>
                    <div className={`p-2 rounded-lg ${outstanding > 0 ? "bg-orange/10 text-orange" : "bg-success/10 text-success"}`}>
                        <span className="material-symbols-outlined">{outstanding > 0 ? "account_balance_wallet" : "check_circle"}</span>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-800 flex justify-between text-sm">
                    <span className="text-text-secondary dark:text-gray-400">Last payment: {lastPayment ? lastPayment.paymentDate : "None"}</span>
                </div>
            </div>

            {/* Subscription Details */}
            <div>
                <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-text-primary dark:text-white">
                    <Image src="/logo.svg" alt="CablePro" width={24} height={24} />
                    Subscription Details
                </h3>
                <div className="bg-white dark:bg-bg-card-dark rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-border-dark">
                    <div className="flex items-center gap-4 px-4 py-4 border-b border-gray-50 dark:border-gray-800">
                        <div className="text-primary flex items-center justify-center rounded-lg bg-primary/10 shrink-0 w-10 h-10">
                            <span className="material-symbols-outlined">tv_gen</span>
                        </div>
                        <div className="flex flex-col">
                            <p className="font-medium text-text-primary dark:text-white">{customer.stbNumber}</p>
                            <p className="text-text-secondary dark:text-gray-400 text-xs">STB Number</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 px-4 py-4 border-b border-gray-50 dark:border-gray-800">
                        <div className="text-primary flex items-center justify-center rounded-lg bg-primary/10 shrink-0 w-10 h-10">
                            <span className="material-symbols-outlined">package_2</span>
                        </div>
                        <div className="flex flex-col">
                            <p className="font-medium text-text-primary dark:text-white">{customer.packageName}</p>
                            <p className="text-text-secondary dark:text-gray-400 text-xs">Current Plan</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 px-4 py-4">
                        <div className="text-primary flex items-center justify-center rounded-lg bg-primary/10 shrink-0 w-10 h-10">
                            <span className="material-symbols-outlined">currency_rupee</span>
                        </div>
                        <div className="flex flex-col">
                            <p className="font-medium text-text-primary dark:text-white">₹{customer.monthlyRate}/month</p>
                            <p className="text-text-secondary dark:text-gray-400 text-xs">Plan Price</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Personal Information */}
            <div>
                <h3 className="text-lg font-bold mb-2 text-text-primary dark:text-white">Personal Information</h3>
                <div className="bg-white dark:bg-bg-card-dark rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-border-dark">
                    <div className="flex items-center gap-4 px-4 py-4 border-b border-gray-50 dark:border-gray-800">
                        <div className="text-gray-500 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0 w-10 h-10">
                            <span className="material-symbols-outlined">phone_iphone</span>
                        </div>
                        <div><p className="font-medium text-text-primary dark:text-white">{customer.phone}</p><p className="text-text-secondary dark:text-gray-400 text-xs">Mobile Number</p></div>
                    </div>
                    <div className="flex items-center gap-4 px-4 py-4 border-b border-gray-50 dark:border-gray-800">
                        <div className="text-gray-500 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0 w-10 h-10">
                            <span className="material-symbols-outlined">location_on</span>
                        </div>
                        <div><p className="font-medium text-text-primary dark:text-white">{customer.address || "Not provided"}</p><p className="text-text-secondary dark:text-gray-400 text-xs">Address</p></div>
                    </div>
                    <div className="flex items-center gap-4 px-4 py-4">
                        <div className="text-gray-500 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0 w-10 h-10">
                            <span className="material-symbols-outlined">calendar_month</span>
                        </div>
                        <div><p className="font-medium text-text-primary dark:text-white">{customer.connectionDate}</p><p className="text-text-secondary dark:text-gray-400 text-xs">Connection Date</p></div>
                    </div>
                </div>
            </div>

            {/* Recent Payments Table */}
            <div>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-bold text-text-primary dark:text-white">Payment History</h3>
                    <span className="text-text-secondary dark:text-gray-400 text-xs">{customerPayments.length} payments</span>
                </div>
                <div className="bg-white dark:bg-bg-card-dark rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-border-dark">
                    {customerPayments.length === 0 ? (
                        <p className="text-text-secondary dark:text-gray-400 text-sm text-center py-8">No payments recorded</p>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-bg-light dark:bg-gray-800 text-text-secondary dark:text-gray-400">
                                    <th className="px-4 py-3 text-left font-semibold">Date</th>
                                    <th className="px-4 py-3 text-left font-semibold">Method</th>
                                    <th className="px-4 py-3 text-left font-semibold hidden sm:table-cell">Period</th>
                                    <th className="px-4 py-3 text-right font-semibold">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                {customerPayments.map((p) => (
                                    <tr key={p.id} className="hover:bg-bg-light dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-4 py-4 text-text-primary dark:text-white">{p.paymentDate}</td>
                                        <td className="px-4 py-4 text-text-primary dark:text-white">{p.paymentMethod}</td>
                                        <td className="px-4 py-4 hidden sm:table-cell text-text-secondary dark:text-gray-400">{p.billingPeriod}</td>
                                        <td className="px-4 py-4 text-right font-bold text-success">₹{p.amount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* FAB */}
            <Link href={`/payments/new?customerId=${id}`}
                className="fixed bottom-28 lg:bottom-6 right-6 flex items-center gap-3 bg-teal hover:bg-teal/90 text-white rounded-full py-4 px-6 shadow-xl active:scale-95 transition-all z-20">
                <span className="material-symbols-outlined">payments</span>
                <span className="font-bold tracking-wide uppercase text-sm">Record Payment</span>
            </Link>
        </div>
    );
}
