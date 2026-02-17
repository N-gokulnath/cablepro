export interface Customer {
    id: string;
    name: string;
    phone: string;
    address: string;
    stbNumber: string;
    connectionDate: string;
    packageName: string;
    monthlyRate: number;
    planDuration: number; // 1, 3, 6, or 12 months
    status: "Active" | "Deactive";
    operatorId: string;
    createdAt: string;
    isDeleted?: boolean;
    deletedAt?: string;
}

export interface Payment {
    id: string;
    customerId: string;
    customerName: string;
    amount: number;
    paymentDate: string;
    paymentMethod: "Cash" | "UPI";
    billingPeriod: string;
    // receiptNumber removed
    status: "Confirmed" | "Pending" | "Cancelled";
    notes: string;
    createdAt: string;
}

export interface User {
    id: string;
    username: string;
    password: string;
    fullName: string;
    role: "admin" | "operator";
    email: string;
    profileImage?: string;
    isDeleted?: boolean;
    deletedAt?: string;
}
