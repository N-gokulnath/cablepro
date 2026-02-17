"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import AppShell from "@/components/AppShell";
import { useStore } from "@/lib/store";

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { currentUser } = useStore();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!currentUser) {
            router.replace("/");
        }
    }, [currentUser, router, pathname]);

    if (!currentUser) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg-light">
                <div className="animate-pulse text-primary font-bold text-lg">Redirecting...</div>
            </div>
        );
    }

    return <AppShell>{children}</AppShell>;
}
