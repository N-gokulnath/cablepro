"use client";

import React, { Suspense } from "react";
import CustomerDetailClient from "./CustomerDetailClient";

export default function CustomerDetailPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center">Loading customer details...</div>}>
            <CustomerDetailClient />
        </Suspense>
    );
}
