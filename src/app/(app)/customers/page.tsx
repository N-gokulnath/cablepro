"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import type { Customer } from "@/lib/types";

const filters = ["All", "Active", "Deactive", "Overdue", "Paid"];

export default function CustomersPage() {
    const searchParams = useSearchParams();
    const { customers, payments, addCustomer, updateCustomer, deleteCustomer } = useStore();
    const [activeFilter, setActiveFilter] = useState("All");
    const [search, setSearch] = useState("");

    // modals
    const [showAddEdit, setShowAddEdit] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    // open add modal via query param from dashboard quick action
    useEffect(() => {
        if (searchParams.get("action") === "add") setShowAddEdit(true);
        const filterParam = searchParams.get("filter");
        if (filterParam && filters.includes(filterParam)) setActiveFilter(filterParam);
    }, [searchParams]);

    // form state
    const [formName, setFormName] = useState("");
    const [formPhone, setFormPhone] = useState("");
    const [formAddress, setFormAddress] = useState("");
    const [formSTB, setFormSTB] = useState("");
    const [formPackage, setFormPackage] = useState("");
    const [formRate, setFormRate] = useState("300");
    const [formDuration, setFormDuration] = useState("1");
    const [formStatus, setFormStatus] = useState<Customer["status"]>("Active");
    const [formError, setFormError] = useState("");

    const openAdd = () => {
        setEditingCustomer(null);
        setFormName(""); setFormPhone(""); setFormAddress(""); setFormSTB("");
        setFormPackage(""); setFormRate("300"); setFormDuration("1"); setFormStatus("Active");
        setFormError("");
        setShowAddEdit(true);
    };
    const openEdit = (c: Customer) => {
        setEditingCustomer(c);
        setFormName(c.name); setFormPhone(c.phone); setFormAddress(c.address);
        setFormSTB(c.stbNumber); setFormPackage(c.packageName);
        setFormRate(c.monthlyRate.toString()); setFormDuration((c.planDuration || 1).toString());
        setFormStatus(c.status);
        setFormError("");
        setShowAddEdit(true);
    };

    const handleSave = () => {
        setFormError("");
        try {
            if (editingCustomer) {
                updateCustomer(editingCustomer.id, {
                    name: formName, phone: formPhone, address: formAddress,
                    stbNumber: formSTB, packageName: formPackage,
                    monthlyRate: Number(formRate) || 300, planDuration: Number(formDuration) || 1,
                    status: formStatus,
                });
            } else {
                addCustomer({
                    name: formName, phone: formPhone, address: formAddress,
                    stbNumber: formSTB, packageName: formPackage,
                    monthlyRate: Number(formRate) || 300, planDuration: Number(formDuration) || 1,
                    status: formStatus,
                    connectionDate: new Date().toISOString().slice(0, 10),
                    operatorId: "u2",
                });
            }
            setShowAddEdit(false);
        } catch (err: any) {
            setFormError(err.message);
        }
    };

    // outstanding calc per customer — respects planDuration and deactive status
    const getOutstanding = (c: Customer) => {
        if (c.status !== "Active") return 0; // deactive customers don't owe
        const custPayments = payments
            .filter(p => p.customerId === c.id && p.status === "Confirmed")
            .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));
        if (custPayments.length === 0) return c.monthlyRate;
        const lastPayDate = new Date(custPayments[0].paymentDate);
        const duration = c.planDuration || 1;
        const coverageEnd = new Date(lastPayDate.getFullYear(), lastPayDate.getMonth() + duration, lastPayDate.getDate());
        return new Date() < coverageEnd ? 0 : c.monthlyRate;
    };

    const filtered = customers.filter((c) => {
        if (c.isDeleted) return false;
        const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.stbNumber.includes(search) || c.phone.includes(search);
        if (!matchSearch) return false;
        if (activeFilter === "All") return true;
        if (activeFilter === "Active") return c.status === "Active";
        if (activeFilter === "Deactive") return c.status === "Deactive";
        if (activeFilter === "Overdue") return getOutstanding(c) > 0;
        if (activeFilter === "Paid") return c.status === "Active" && getOutstanding(c) === 0;
        return true;
    });

    const initials = (name: string) => name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

    return (
        <div className="max-w-4xl mx-auto space-y-4">
            {/* Search Bar */}
            <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary dark:text-gray-400">search</span>
                <input
                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-white dark:bg-bg-card-dark border border-gray-200 dark:border-border-dark text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all placeholder:text-text-secondary dark:placeholder:text-gray-500 dark:text-white"
                    placeholder="Search by name, phone, or STB number..."
                    value={search} onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Filter Chips */}
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                {filters.map((f) => (
                    <button key={f} onClick={() => setActiveFilter(f)}
                        className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 text-sm font-semibold transition-all
              ${activeFilter === f ? "bg-primary text-white shadow-sm" : "bg-white dark:bg-bg-card-dark border border-gray-200 dark:border-border-dark text-text-secondary dark:text-gray-400 hover:border-primary hover:text-primary dark:hover:text-primary"}`}
                    >{f}</button>
                ))}
                <span className="ml-auto text-text-secondary dark:text-gray-400 text-sm font-medium self-center shrink-0">{filtered.length} customers</span>
            </div>

            {/* Customer Cards */}
            <div className="space-y-3">
                {filtered.length === 0 && (
                    <div className="bg-white dark:bg-bg-card-dark rounded-xl p-8 text-center text-text-secondary dark:text-gray-400 border border-gray-100 dark:border-border-dark">
                        <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600">group_off</span>
                        <p className="mt-2 font-medium">No customers found</p>
                    </div>
                )}
                {filtered.map((customer) => {
                    const outstanding = getOutstanding(customer);
                    return (
                        <div key={customer.id} className="bg-white dark:bg-bg-card-dark rounded-xl p-4 shadow-sm border border-gray-100 dark:border-border-dark transition-all hover:shadow-md">
                            <div className="flex items-start gap-4">
                                <div className={`flex items-center justify-center rounded-full h-14 w-14 font-bold text-lg shrink-0
                  ${customer.status === "Deactive" ? "bg-gray-200 text-gray-600"
                                        : outstanding > 0 ? "bg-orange/10 text-orange" : "bg-primary/10 text-primary"}`}>
                                    {initials(customer.name)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <p className="text-text-primary dark:text-white text-base font-bold truncate">{customer.name}</p>
                                        <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded
                      ${customer.status === "Active" ? "text-success bg-success/10" : "text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800"}`}>
                                            {customer.status}
                                        </span>
                                    </div>
                                    <p className="text-text-secondary dark:text-gray-400 text-sm mt-0.5">{customer.phone}</p>
                                    <p className="text-text-secondary dark:text-gray-400 text-sm">STB: {customer.stbNumber} • {customer.packageName}</p>
                                    <p className={`text-sm font-semibold mt-1 ${outstanding > 0 ? "text-orange" : "text-success"}`}>
                                        Outstanding: ₹{outstanding.toLocaleString("en-IN")}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-50 dark:border-gray-800 flex justify-between items-center">
                                <div className="flex gap-1">
                                    <Link href={`/customers/view?id=${customer.id}`}
                                        className="flex flex-col items-center gap-1 px-3 py-1 rounded-lg hover:bg-bg-light dark:hover:bg-gray-800 transition">
                                        <span className="material-symbols-outlined text-text-secondary dark:text-gray-400 text-[20px]">visibility</span>
                                        <p className="text-[10px] font-medium text-text-secondary dark:text-gray-400">View</p>
                                    </Link>
                                    <a href={`tel:${customer.phone}`}
                                        className="flex flex-col items-center gap-1 px-3 py-1 rounded-lg hover:bg-success/10 transition">
                                        <span className="material-symbols-outlined text-success text-[20px]">call</span>
                                        <p className="text-[10px] font-medium text-success">Call</p>
                                    </a>
                                    <button onClick={() => openEdit(customer)}
                                        className="flex flex-col items-center gap-1 px-3 py-1 rounded-lg hover:bg-bg-light dark:hover:bg-gray-800 transition">
                                        <span className="material-symbols-outlined text-text-secondary dark:text-gray-400 text-[20px]">edit</span>
                                        <p className="text-[10px] font-medium text-text-secondary dark:text-gray-400">Edit</p>
                                    </button>
                                    <button onClick={() => setDeleteConfirm(customer.id)}
                                        className="flex flex-col items-center gap-1 px-3 py-1 rounded-lg hover:bg-danger/10 transition">
                                        <span className="material-symbols-outlined text-danger text-[20px]">delete</span>
                                        <p className="text-[10px] font-medium text-danger">Delete</p>
                                    </button>
                                </div>
                                {customer.status === "Deactive" ? (
                                    <span className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 px-4 py-2 rounded-lg text-sm font-bold cursor-not-allowed border border-transparent dark:border-gray-700">
                                        <span className="material-symbols-outlined text-[18px]">block</span> Deactive
                                    </span>
                                ) : outstanding > 0 ? (
                                    <Link href={`/payments/new?customerId=${customer.id}`}
                                        className="flex items-center gap-2 bg-orange text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md shadow-orange/30 hover:opacity-90 transition">
                                        <span className="material-symbols-outlined text-[18px]">payments</span> Pay Now
                                    </Link>
                                ) : (
                                    <span className="flex items-center gap-2 bg-success/10 text-success px-4 py-2 rounded-lg text-sm font-bold">
                                        <span className="material-symbols-outlined text-[18px]">check_circle</span> Paid
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* FAB */}
            <div className="fixed bottom-24 sm:bottom-6 right-6 z-20">
                <button onClick={openAdd} className="flex h-14 w-14 items-center justify-center rounded-full bg-teal text-white shadow-xl hover:scale-105 active:scale-95 transition-transform">
                    <span className="material-symbols-outlined text-3xl">person_add</span>
                </button>
            </div>

            {/* Add/Edit Modal */}
            {showAddEdit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddEdit(false)}>
                    <div className="bg-white dark:bg-bg-card-dark rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-border-dark">
                            <h3 className="text-lg font-bold dark:text-white">{editingCustomer ? "Edit Customer" : "Add Customer"}</h3>
                            <button onClick={() => setShowAddEdit(false)} className="text-text-secondary dark:text-gray-400 hover:text-text-primary dark:hover:text-white">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            {formError && (
                                <div className="bg-danger/10 text-danger text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2">
                                    <span className="material-symbols-outlined text-lg">error</span>{formError}
                                </div>
                            )}
                            <label className="block">
                                <span className="text-sm font-medium text-text-primary dark:text-gray-300">Full Name *</span>
                                <input value={formName} onChange={e => setFormName(e.target.value)}
                                    className="mt-1 w-full h-12 px-4 rounded-lg border border-border dark:border-border-dark dark:bg-bg-dark dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none" placeholder="Enter full name" />
                            </label>
                            <label className="block">
                                <span className="text-sm font-medium text-text-primary dark:text-gray-300">Phone Number *</span>
                                <input value={formPhone} onChange={e => setFormPhone(e.target.value)}
                                    className="mt-1 w-full h-12 px-4 rounded-lg border border-border dark:border-border-dark dark:bg-bg-dark dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none" placeholder="+91 98765 43210" />
                            </label>
                            <label className="block">
                                <span className="text-sm font-medium text-text-primary dark:text-gray-300">Address</span>
                                <input value={formAddress} onChange={e => setFormAddress(e.target.value)}
                                    className="mt-1 w-full h-12 px-4 rounded-lg border border-border dark:border-border-dark dark:bg-bg-dark dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none" placeholder="Full address" />
                            </label>
                            <label className="block">
                                <span className="text-sm font-medium text-text-primary dark:text-gray-300">STB Number *</span>
                                <input value={formSTB} onChange={e => setFormSTB(e.target.value)}
                                    className="mt-1 w-full h-12 px-4 rounded-lg border border-border dark:border-border-dark dark:bg-bg-dark dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none" placeholder="Set-Top Box number" />
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <label className="block">
                                    <span className="text-sm font-medium text-text-primary dark:text-gray-300">Plan Name</span>
                                    <input value={formPackage} onChange={e => setFormPackage(e.target.value)}
                                        className="mt-1 w-full h-12 px-4 rounded-lg border border-border dark:border-border-dark dark:bg-bg-dark dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none" placeholder="e.g. Basic HD Pack" />
                                </label>
                                <label className="block">
                                    <span className="text-sm font-medium text-text-primary dark:text-gray-300">Plan Price(₹)</span>
                                    <input type="number" value={formRate} onChange={e => setFormRate(e.target.value)}
                                        className="mt-1 w-full h-12 px-4 rounded-lg border border-border dark:border-border-dark dark:bg-bg-dark dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none" />
                                </label>
                            </div>
                            <label className="block">
                                <span className="text-sm font-medium text-text-primary dark:text-gray-300">Plan Duration</span>
                                <select value={formDuration} onChange={e => setFormDuration(e.target.value)}
                                    className="mt-1 w-full h-12 px-4 rounded-lg border border-border dark:border-border-dark dark:bg-bg-dark dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none appearance-none">
                                    <option value="1">1 Month</option>
                                    <option value="3">3 Months</option>
                                    <option value="6">6 Months</option>
                                    <option value="12">12 Months</option>
                                </select>
                            </label>
                            <label className="block">
                                <span className="text-sm font-medium text-text-primary dark:text-gray-300">Status</span>
                                <select value={formStatus} onChange={e => setFormStatus(e.target.value as Customer["status"])}
                                    className="mt-1 w-full h-12 px-4 rounded-lg border border-border dark:border-border-dark dark:bg-bg-dark dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none appearance-none">
                                    <option value="Active">Active</option>
                                    <option value="Deactive">Deactive</option>
                                </select>
                            </label>
                        </div>
                        <div className="p-5 border-t border-gray-100 dark:border-gray-800 flex gap-3">
                            <button onClick={() => setShowAddEdit(false)} className="flex-1 py-3 rounded-xl border border-border dark:border-gray-700 text-text-primary dark:text-white font-bold text-sm hover:bg-bg-light dark:hover:bg-gray-800 transition">
                                Cancel
                            </button>
                            <button onClick={handleSave} className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-dark transition active:scale-[0.98]">
                                {editingCustomer ? "Save Changes" : "Add Customer"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
                    <div className="bg-white dark:bg-bg-card-dark rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-danger text-3xl">delete_forever</span>
                            </div>
                            <h3 className="text-lg font-bold text-text-primary dark:text-white">Delete Customer?</h3>
                            <p className="text-text-secondary dark:text-gray-400 text-sm">This action cannot be undone. All data for this customer will be permanently removed.</p>
                            <div className="flex gap-3 w-full mt-2">
                                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 rounded-xl border border-border dark:border-gray-700 text-text-primary dark:text-white font-bold text-sm hover:bg-bg-light dark:hover:bg-gray-800 transition">
                                    Cancel
                                </button>
                                <button onClick={() => { deleteCustomer(deleteConfirm); setDeleteConfirm(null); }}
                                    className="flex-1 py-3 rounded-xl bg-danger text-white font-bold text-sm hover:bg-red-700 transition active:scale-[0.98]">
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
